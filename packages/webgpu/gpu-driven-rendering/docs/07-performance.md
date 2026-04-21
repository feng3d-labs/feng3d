# 05-性能优化

本文档描述性能监控和系统优化策略。

---

## 实现状态

**阶段**：阶段5 - 性能优化
**状态**：⬜ 未开始
**相关代码**：`src/utils/PerformanceMonitor.ts`
**进度跟踪**：[PROGRESS.md](../PROGRESS.md#阶段5性能监控与优化-⬜-未开始)

---

性能优化是全GPU驱动渲染的核心目标，通过系统化的优化策略，在保证渲染质量的同时最大化性能。

### 性能指标

### 目标性能

```
假设场景：1000透明物体，5种材质

GPU计算：    ~0.5ms（Bitonic Sort）
CPU回读：    ~0.01ms（600B批次信息，异步无等待）
Draw Calls: ~50次（按材质批次）
总开销：     ~0.5ms（60fps下占3%）
```

### 性能监控

```javascript
// 使用timestamp query监控性能
const timestampQuerySet = device.createQuerySet({
  type: 'timestamp',
  count: 8
});

function renderFrameWithProfiling() {
  const encoder = device.createCommandEncoder();

  encoder.writeTimestamp(timestampQuerySet, 0);  // 帧开始

  // 计算着色器
  runComputePass(encoder);
  encoder.writeTimestamp(timestampQuerySet, 1);  // 计算结束

  // 不透明渲染
  renderOpaque(encoder);
  encoder.writeTimestamp(timestampQuerySet, 2);  // 不透明结束

  // 透明渲染
  renderTransparent(encoder);
  encoder.writeTimestamp(timestampQuerySet, 3);  // 透明结束

  device.queue.submit([encoder.finish()]);

  // 异步读取结果
  timestampQuerySet.getTimestampResults().then(times => {
    const computeTime = times[1] - times[0];
    const opaqueTime = times[2] - times[1];
    const transparentTime = times[3] - times[2];
    const totalTime = times[3] - times[0];

    console.log({
      compute: `${computeTime / 1000000}ms`,
      opaque: `${opaqueTime / 1000000}ms`,
      transparent: `${transparentTime / 1000000}ms`,
      total: `${totalTime / 1000000}ms`
    });
  });
}
```

## 优化策略

### 1. 缓冲复用

**原则**：所有全局缓冲（顶点、索引、材质）仅创建一次，后续不销毁、不重建。

```javascript
// 初始化时创建
const globalBuffers = {
  vertex: createOnce(vertexData),
  index: createOnce(indexData),
  material: createOnce(materialData),
  texture: createOnce(textureData)
};

// 避免每帧创建
// ❌ 错误做法
function renderFrame() {
  const buffer = device.createBuffer({...}); // 每帧创建！
  // ...
}

// ✓ 正确做法
function renderFrame() {
  device.queue.writeBuffer(globalBuffers.vertex, 0, newData); // 仅更新数据
}
```

### 2. 管线切换优化

**原则**：通过深度聚类减少材质切换次数。

```javascript
// ❌ 频繁切换管线
for (const obj of objects) {
  pass.setPipeline(obj.pipeline); // 每个物体都切换
  pass.drawIndexed(...);
}

// ✓ 批量切换管线
for (const materialType of materialTypes) {
  pass.setPipeline(pipelines[materialType]); // 每种材质切换一次
  pass.multiDrawIndexedIndirect(cmdBuffers[materialType], ...);
}
```

### 3. 计算着色器优化

**Workgroup大小选择**：

```wgsl
// 根据硬件特性选择合适的workgroup大小
@compute @workgroup_size(64)  // 默认值，适合大多数场景
fn defaultWorkgroup(...) { }

@compute @workgroup_size(128) // 高延迟隐藏
fn highLatency(...) { }

@compute @workgroup_size(32)  // 低寄存器压力
fn lowRegister(...) { }
```

**排序算法选择**：

| 算法 | 时间复杂度 | 适用场景 |
|------|-----------|---------|
| Bitonic Sort | O(n log² n) | GPU并行，推荐 |
| Radix Sort | O(n) | 大数据量，实现复杂 |
| Bubble Sort | O(n²) | 小数据量，简单 |

### 4. 采样器访问优化

**原则**：通过baseSamplerIdx关联采样器，无需if-else判断。

```wgsl
// ❌ 分支判断（性能差）
@fragment
fn fsBad(...) -> vec4f {
  if (material.type == 0) {
    return textureSample(texture, sampler0, uv);
  } else if (material.type == 1) {
    return textureSample(texture, sampler1, uv);
  }
  // 更多分支...
}

// ✓ 索引访问（性能好）
@fragment
fn fsGood(...) -> vec4f {
  let samplerIdx = material.samplerIndices[0];
  // 通过预定义的采样器数组访问
  return textureSample(texture, samplers[samplerIdx], uv);
}
```

### 5. 回读优化

**异步读取方案**：

```javascript
// ✓ 推荐：submit前异步读取（无等待）
function renderFrame() {
  // 使用缓存数据（无等待）
  if (cachedBatches) {
    renderWithBatches(cachedBatches);
  }

  // 提交GPU命令
  device.queue.submit([encoder.finish()]);

  // 启动异步读取（不阻塞）
  buffer.mapAsync(GPUMapMode.READ).then(() => {
    cachedBatches = new Uint32Array(buffer.getMappedRange());
    buffer.unmap();
  });

  requestAnimationFrame(renderFrame);
}

// ❌ 避免：同步等待
async function renderFrameBad() {
  await buffer.mapAsync(GPUMapMode.READ); // 阻塞CPU！
  // ...
}
```

### 6. 遮挡剔除

**启用Hi-Z遮挡剔除**：

```javascript
// 开放场景启用，室内场景禁用
const config = {
  enableHiZOcclusion: sceneType === 'open-world'
};

if (config.enableHiZOcclusion) {
  // 生成Hi-Z金字塔
  generateHiZPyramid();
}
```

### 7. 批次渲染

**透明物体按批次批量绘制**：

```javascript
// 假设1000个透明物体，5种材质
// 未优化：1000次draw call
// 优化后：~50次draw call（按材质批次）

function renderTransparentOptimized(pass) {
  for (const batch of batches) {
    pass.setPipeline(pipelines[batch.materialType]);
    pass.multiDrawIndexedIndirect(
      cmdBuffer,
      batch.startIndex * 20,
      batch.count
    );
  }
}
```

### 8. LOD配置优化

**根据场景配置LOD**：

```javascript
// 室内场景：近距离高质量
const indoorLOD = {
  distances: [5, 15, 30],
  polyRatios: [1.0, 0.5, 0.25, 0.1]
};

// 开放世界：远距离优先
const outdoorLOD = {
  distances: [10, 50, 100],
  polyRatios: [1.0, 0.3, 0.1, 0.05]
};

// 移动端：性能优先
const mobileLOD = {
  distances: [3, 10, 20],
  polyRatios: [1.0, 0.25, 0.1, 0.05]
};
```

## 内存优化

### 纹理压缩

```javascript
// 使用压缩纹理格式
const compressedTexture = device.createTexture({
  format: 'bc7-rgba-unorm',  // 或 'astc-4x4-unorm'
  usage: GPUTextureUsage.TEXTURE_BINDING | GPUBufferUsage.COPY_DST
});
```

### 顶点数据压缩

```wgsl
// 使用更小的数据类型
struct VertexCompressed {
  position: vec3<f16>,  // half float
  normal: vec3<snorm10>, // 10位有符号归一化
  uv: vec2<u16>         // 16位归一化
};
```

## 性能分析工具

### 内置性能HUD

```javascript
class PerformanceHUD {
  constructor() {
    this.fps = 0;
    this.frameTime = 0;
    this.gpuTime = 0;
  }

  update(timestampResult) {
    this.fps = 1000 / this.frameTime;
    this.gpuTime = timestampResult.totalTime;
  }

  render(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 200, 80);

    ctx.fillStyle = '#00ff00';
    ctx.fillText(`FPS: ${this.fps.toFixed(1)}`, 20, 30);
    ctx.fillText(`Frame: ${this.frameTime.toFixed(2)}ms`, 20, 50);
    ctx.fillText(`GPU: ${this.gpuTime.toFixed(2)}ms`, 20, 70);
  }
}
```

### WebGPU Inspector

使用浏览器扩展查看：
- 绘制调用统计
- 着色器编译时间
- 内存使用情况
- 渲染管线状态

## 常见性能问题

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| FPS下降 | 计算着色器耗时 | 优化workgroup大小，减少排序复杂度 |
| 内存占用高 | 纹理未压缩 | 使用压缩纹理格式 |
| CPU占用高 | 同步回读或频繁绘制 | 使用异步读取，批量绘制 |
| GPU利用率低 | 数据传输瓶颈 | 使用STORAGE缓冲，减少MAP操作 |

---

## 相关文档

| 文档 | 说明 |
|------|------|
| [00-架构概览](./00-architecture.md) | 整体架构 |
| [01-全GPU渲染核心](./01-gpu-rendering-core.md) | 基础渲染管线 |
| [02-透明渲染](./03-transparent-rendering.md) | Bitonic Sort 性能优化 |
| [03-剔除系统](./05-culling.md) | 剔除性能优化 |
| [04-LOD系统](./06-lod.md) | LOD 性能优化 |
| [06-常见问题](./15-troubleshooting.md) | 问题排查 |
| [09-术语表](./18-glossary.md) | 性能指标术语 |

---

> 最后更新：2026-04-20
