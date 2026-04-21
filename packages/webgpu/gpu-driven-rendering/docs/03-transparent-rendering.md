# 02-透明渲染

本文档描述透明物体的GPU驱动渲染实现，包括深度聚类排序、材质聚合和批次渲染。

---

## 实现状态

**阶段**：阶段2 - 透明渲染
**状态**：⬜ 未开始
**相关代码**：`src/transparent/`
**依赖阶段**：[阶段1 - 全GPU渲染核心](./01-gpu-rendering-core.md)
**进度跟踪**：[PROGRESS.md](../PROGRESS.md#阶段2透明渲染-⬜-未开始)

---

透明渲染是全GPU驱动渲染中最复杂的部分，需要严格的深度排序和高效的批次管理。

### 概述

透明渲染的核心挑战：

1. **深度排序**：必须从远到近渲染，否则混合效果会出错
2. **管线切换**：频繁切换材质管线会严重影响性能
3. **数据回读**：需要获取GPU生成的批次信息

解决方案采用**深度聚类+材质聚合**策略，平衡正确性和性能。

## 深度聚类+材质聚合排序

### 核心思想

```
远 → 近
┌─────────────────────────────────────┐
│ 聚类0 (90-100m)                     │
│   ├─ 材质A × 5个物体                │
│   ├─ 材质B × 3个物体                │  ← 聚类内按材质聚合
│   └─ 材质C × 2个物体                │
├─────────────────────────────────────┤
│ 聚类1 (80-90m)                      │  ← 聚类间严格深度排序
│   ├─ 材质A × 4个物体                │
│   └─ 材质B × 6个物体                │
└─────────────────────────────────────┘
```

### 为什么这种方案是正确的？

| 方案 | 深度正确性 | 材质切换 | 适用场景 |
|------|-----------|---------|---------|
| 完全按深度排序 | ✓ 完美 | ✗ 频繁 | 理论正确但性能差 |
| 完全按材质分组 | ✗ 错误！ | ✓ 最少 | **不可用**，渲染错误 |
| **深度聚类+材质聚合** | **✓ 可接受** | **✓ 较少** | **推荐** |

**视觉上可接受的原因**：
- 相近深度（如±0.5m内）的物体互相遮挡，肉眼难以察觉细微差异
- 聚类内按材质聚合只交换"几乎相同深度"的物体顺序
- 只要聚类间距设置合理（如场景规模的0.5%-1%），视觉效果正确

## Bitonic Sort实现

### 透明物体数据结构

```wgsl
// 透明物体数据（用于排序）
struct TransparentObject {
  cmd: DrawCommand,   // 绘制命令
  depth: f32,         // 深度值
  materialType: u32,  // 材质类型
  _padding: u32,      // 对齐填充
};
```

### 排序键生成

```wgsl
const CLUSTER_DISTANCE: f32 = 0.5;  // 聚类间距（米）

// 计算聚类ID
fn getCluster(depth: f32) -> u32 {
  return u32(depth / CLUSTER_DISTANCE);
}

// 生成排序键：
// - 高32位：聚类ID（保证聚类间深度排序）
// - 中16位：材质类型（同聚类内材质聚合）
// - 低16位：精确深度（同材质内深度排序）
fn getSortKey(depth: f32, materialType: u32) -> u64 {
  let cluster = getCluster(depth);

  // 深度反转：远处(大值) → 近处(小值)
  let reversedDepth = u32(1000000.0 / (depth + 0.001));

  return (u64(cluster) << 48) |
         (u64(materialType) << 32) |
         u64(reversedDepth);
}
```

### Bitonic Sort算法

```wgsl
@group(0) @binding(0) var<storage, read_write> transparentObjects: array<TransparentObject>;
@group(0) @binding(1) var<storage, read> counter: atomic<u32>;

const MAX_TRANSPARENT: u32 = 4096;

// 比较和交换
fn compareAndSwap(i: u32, j: u32, dir: bool) {
  let count = atomicLoad(&counter);
  if (i >= count || j >= count) { return; }

  let objA = transparentObjects[i];
  let objB = transparentObjects[j];
  let keyA = getSortKey(objA.depth, objA.materialType);
  let keyB = getSortKey(objB.depth, objB.materialType);

  // 按排序键升序排列（远处先，近处后）
  if ((keyA > keyB) == dir) {
    let temp = transparentObjects[i];
    transparentObjects[i] = transparentObjects[j];
    transparentObjects[j] = temp;
  }
}

// Bitonic Sort主函数
@compute @workgroup_size(1024)
fn bitonicSort(@builtin(global_invocation_id) gid: vec3u) {
  let idx = gid.x;
  var k: u32 = 2;

  while (k <= MAX_TRANSPARENT) {
    var j: u32 = k >> 1;
    while (j > 0u) {
      let i = idx;
      let ij = i ^ j;
      if (ij > i) {
        let dir = ((i & k) == 0u);
        compareAndSwap(i, ij, dir);
      }
      j = j >> 1;
    }
    k = k << 1;
  }
}
```

## 批次生成

### GPU端批次生成

```wgsl
// 批次信息结构
struct Batch {
  materialType: u32,  // 材质类型
  startIndex: u32,    // 起始索引
  count: u32,         // 数量
};

@group(0) @binding(0) var<storage, read> transparentObjects: array<TransparentObject>;
@group(0) @binding(1) var<storage, read> counter: atomic<u32>;
@group(0) @binding(2) var<storage, read_write> batches: array<Batch>;
@group(0) @binding(3) var<storage, read_write> batchCounter: atomic<u32>;

@compute @workgroup_size(64)
fn generateBatches(@builtin(global_invocation_id) gid: vec3u) {
  let idx = gid.x;
  let count = atomicLoad(&counter);
  if (idx >= count) { return; }

  let obj = transparentObjects[idx];

  // 检查是否需要新建批次
  let currentBatchIdx = atomicLoad(&batchCounter);

  if (currentBatchIdx == 0u ||
      batches[currentBatchIdx - 1u].materialType != obj.materialType) {
    // 新建批次
    let newBatchIdx = atomicAdd(&batchCounter, 1u);
    batches[newBatchIdx].materialType = obj.materialType;
    batches[newBatchIdx].startIndex = idx;
    batches[newBatchIdx].count = 1u;
  } else {
    // 扩展当前批次
    batches[currentBatchIdx - 1u].count += 1u;
  }
}
```

## CPU端渲染

### 异步读取方案（推荐）

```javascript
let cachedBatches = null;

function renderTransparent(pass) {
  pass.setBindGroup(0, globalBindGroup);
  pass.setVertexBuffer(0, vertexBuffer);
  pass.setIndexBuffer(indexBuffer, 'uint32');

  // 使用缓存数据（无等待）
  if (cachedBatches) {
    for (const batch of cachedBatches) {
      pass.setPipeline(transparentPipelines[batch.materialType]);
      pass.multiDrawIndexedIndirect(
        transparentCmdBuffer,
        batch.startIndex * 16,
        batch.count
      );
    }
  }
}

function renderFrame() {
  // 1. 渲染（使用上一帧的批次数据）
  const encoder = device.createCommandEncoder();
  const pass = encoder.beginRenderPass({...});
  renderTransparent(pass);
  pass.end();
  device.queue.submit([encoder.finish()]);

  // 2. 异步读取当前帧批次数据（不阻塞）
  transparentBatchesBuffer.mapAsync(GPUMapMode.READ).then(() => {
    const batchCount = new Uint32Array(transparentBatchCounter.getMappedRange())[0];
    cachedBatches = new Uint32Array(
      transparentBatchesBuffer.getMappedRange(),
      0,
      batchCount * 3  // 每个批次3个u32
    );
    transparentBatchesBuffer.unmap();
  });

  requestAnimationFrame(renderFrame);
}
```

### 同步读取方案（备选）

```javascript
async function renderTransparentSync(pass) {
  // 等待GPU完成并读取批次数据
  await transparentBatchesBuffer.mapAsync(GPUMapMode.READ);
  const batchCount = new Uint32Array(transparentBatchCounter.getMappedRange())[0];
  const batches = new Uint32Array(
    transparentBatchesBuffer.getMappedRange(),
    0,
    batchCount * 3
  );
  transparentBatchesBuffer.unmap();

  // 渲染
  for (let i = 0; i < batchCount; i++) {
    const batch = {
      materialType: batches[i * 3],
      startIndex: batches[i * 3 + 1],
      count: batches[i * 3 + 2]
    };
    pass.setPipeline(transparentPipelines[batch.materialType]);
    pass.multiDrawIndexedIndirect(
      transparentCmdBuffer,
      batch.startIndex * 16,
      batch.count
    );
  }
}
```

## 深度缓冲配置

透明物体的深度缓冲配置至关重要：

```javascript
const transparentPipeline = device.createRenderPipeline({
  // ... 其他配置
  depthStencil: {
    depthWriteEnabled: false,  // 关键：关闭深度写入
    depthCompare: 'less',      // 关键：开启深度测试
    format: 'depth24plus-stencil8'
  },
  // ... 其他配置
});
```

**配置说明**：
- `depthWriteEnabled: false`：透明物体不写入深度，避免遮挡后续透明物体
- `depthCompare: 'less'`：进行深度测试，被不透明物体遮挡的部分不渲染

## 完整透明渲染流程

```text
┌─────────────────────────────────────────────────────────────┐
│                   透明物体渲染流程                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. GPU计算着色器                                            │
│     ├─ 物体筛选（视锥+遮挡剔除）                              │
│     ├─ 收集透明物体到缓冲                                    │
│     └─ Bitonic Sort（深度聚类+材质聚合）                      │
│                                                             │
│  2. GPU批次生成                                              │
│     └─ 按材质类型生成分组批次                                 │
│                                                             │
│  3. CPU渲染（使用缓存数据）                                   │
│     └─ 按批次批量绘制                                         │
│                                                             │
│  4. CPU异步读取                                              │
│     └─ 读取批次数据供下一帧使用                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 性能优化

### 1. 聚类间距调优

| 场景规模 | 推荐聚类间距 | 说明 |
|---------|-------------|------|
| 小场景（<50m） | 0.3m | 精确排序，视觉准确 |
| 中场景（50-200m） | 0.5m | 默认值，平衡性能 |
| 大场景（>200m） | 1.0m | 减少批次数 |

### 2. 批次合并

```wgsl
// 允许相邻小批次合并（减少draw call）
fn shouldMergeBatches(batchA: Batch, batchB: Batch) -> bool {
  // 相同材质且批次都很小
  return batchA.materialType == batchB.materialType &&
         batchA.count < 10 &&
         batchB.count < 10;
}
```

### 3. 预排序静态透明物体

```javascript
// 对静态透明物体进行预排序，减少运行时排序开销
function preSortStaticTransparentObjects() {
  staticTransparentObjects.sort((a, b) => {
    // 按材质类型预分组
    return a.materialType - b.materialType;
  });
}
```

## 常见问题

| 问题 | 解决方案 |
|------|---------|
| 透明物体顺序错误 | 检查排序键生成逻辑，确保聚类ID优先级正确 |
| 透明物体互相遮挡错误 | 确认深度写入关闭，深度测试开启 |
| 批次信息读取失败 | 检查buffer的MAP_READ usage，确保异步读取时机正确 |
| CPU性能开销过高 | 使用异步读取方案，避免await阻塞 |

---

## 相关文档

| 文档 | 说明 |
|------|------|
| [01-全GPU渲染核心](./01-gpu-rendering-core.md) | 基础渲染管线 |
| [03-剔除系统](./05-culling.md) | 视锥和遮挡剔除（下一阶段） |
| [07-API参考](./16-api-reference.md) | Bitonic Sort API |
| [08-代码示例](./17-examples.md) | 排序着色器示例 |
| [09-术语表](./18-glossary.md) | 深度聚类、Bitonic Sort 术语 |

---

> 最后更新：2026-04-20
