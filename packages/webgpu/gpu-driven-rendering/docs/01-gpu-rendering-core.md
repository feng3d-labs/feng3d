# 01-全GPU渲染核心

本文档描述全GPU驱动渲染的核心实现：GPU生成绘制命令，CPU仅触发渲染，支持不透明物体批量渲染。

---

## 实现状态

**阶段**：阶段1 - 全GPU渲染核心
**状态**：⬜ 未开始
**相关代码**：`src/core/`、`src/compute/`
**进度跟踪**：[PROGRESS.md](../PROGRESS.md#阶段1全gpu渲染核心-⬜-未开始)

---

## 间接绘制

间接绘制（Indirect Drawing）是GPU驱动渲染的核心技术，允许GPU生成绘制命令，CPU仅需触发执行。

### 概述

WebGPU提供的间接绘制API：

| API | 说明 | 特性要求 |
|-----|------|---------|
| `drawIndirect` | 间接绘制（无索引） | - |
| `drawIndexedIndirect` | 间接索引绘制 | - |
| `multiDrawIndirect` | 多重间接绘制 | `indirect-first-instance` |
| `multiDrawIndexedIndirect` | 多重间接索引绘制 | `indirect-first-instance` |

## 间接绘制命令结构

### DrawIndexedIndirect结构

```wgsl
// WebGPU标准间接绘制命令结构
struct DrawIndexedIndirect {
  indexCount: u32,      // 索引数量
  instanceCount: u32,   // 实例数量
  firstIndex: u32,      // 起始索引
  vertexOffset: i32,    // 顶点偏移
  baseInstance: u32,    // 基础实例ID
};
```

### 缓冲区布局

```javascript
// 不透明物体命令缓冲（按材质分组）
const opaqueCmdBuffers = [
  device.createBuffer({
    size: MAX_DRAWS * 20,  // 每个命令20字节
    usage: GPUBufferUsage.INDIRECT | GPUBufferUsage.STORAGE
  }),
  // 更多材质...
];

// 透明物体命令缓冲
const transparentCmdBuffer = device.createBuffer({
  size: MAX_TRANSPARENT_DRAWS * 20,
  usage: GPUBufferUsage.INDIRECT | GPUBufferUsage.STORAGE
});
```

## GPU端命令生成

### 计算着色器生成命令

```wgsl
// 命令缓冲输出
@group(0) @binding(0) var<storage, read_write> opaqueCmds: array<DrawIndexedIndirect>;
@group(0) @binding(1) var<storage, read_write> transparentCmds: array<DrawIndexedIndirect>;
@group(0) @binding(2) var<storage, read_write> opaqueCounter: atomic<u32>;
@group(0) @binding(3) var<storage, read_write> transparentCounter: atomic<u32>;

@compute @workgroup_size(64)
fn generateCommands(@builtin(global_invocation_id) gid: vec3u) {
  let objIdx = gid.x;
  let obj = objects[objIdx];

  // 剔除检查
  if (!isVisible(obj)) { return; }

  // LOD选择
  let lod = selectLOD(obj);

  // 构建绘制命令
  var cmd: DrawIndexedIndirect;
  cmd.indexCount = obj.lodCounts[lod];
  cmd.instanceCount = 1;
  cmd.firstIndex = obj.lodOffsets[lod];
  cmd.vertexOffset = 0;
  cmd.baseInstance = objIdx;

  // 按材质类型写入对应缓冲
  if (isTransparent(obj.materialType)) {
    let idx = atomicAdd(&transparentCounter, 1u);
    transparentCmds[idx] = cmd;
  } else {
    let idx = atomicAdd(&opaqueCounter, 1u);
    opaqueCmds[obj.materialType][idx] = cmd;
  }
}
```

## CPU端绘制执行

### 单次间接绘制

```javascript
function renderOpaque(pass) {
  pass.setBindGroup(0, globalBindGroup);
  pass.setVertexBuffer(0, vertexBuffer);
  pass.setIndexBuffer(indexBuffer, 'uint32');

  // 材质0
  pass.setPipeline(pipelines[0]);
  for (let i = 0; i < MAX_DRAWS; i++) {
    pass.drawIndexedIndirect(opaqueCmdBuffers[0], i * 20);
  }
}
```

### MultiDraw优化

```javascript
function renderOpaqueMultiDraw(pass) {
  pass.setBindGroup(0, globalBindGroup);
  pass.setVertexBuffer(0, vertexBuffer);
  pass.setIndexBuffer(indexBuffer, 'uint32');

  // 材质0：一次调用绘制多个物体
  pass.setPipeline(pipelines[0]);
  pass.multiDrawIndexedIndirect(opaqueCmdBuffers[0], 0, MAX_DRAWS);
}
```

### Fallback实现

```javascript
// 检测特性支持
const hasMultiDraw = device.features.has('indirect-first-instance');

function renderOpaque(pass) {
  pass.setBindGroup(0, globalBindGroup);
  pass.setVertexBuffer(0, vertexBuffer);
  pass.setIndexBuffer(indexBuffer, 'uint32');

  if (hasMultiDraw) {
    // 使用multiDraw
    pass.setPipeline(pipelines[0]);
    pass.multiDrawIndexedIndirect(opaqueCmdBuffers[0], 0, MAX_DRAWS);
  } else {
    // 循环fallback
    pass.setPipeline(pipelines[0]);
    for (let i = 0; i < MAX_DRAWS; i++) {
      pass.drawIndexedIndirect(opaqueCmdBuffers[0], i * 20);
    }
  }
}
```

## 完整渲染流程

```javascript
function renderFrame() {
  const encoder = device.createCommandEncoder();

  // 1. 计算着色器生成命令
  const computePass = encoder.beginComputePass();
  computePass.setPipeline(cullingPipeline);
  computePass.setBindGroup(0, cullingBindGroup);
  computePass.dispatchWorkgroups(Math.ceil(objectCount / 64));
  computePass.end();

  // 2. 排序透明物体
  const sortPass = encoder.beginComputePass();
  sortPass.setPipeline(sortPipeline);
  sortPass.setBindGroup(0, sortBindGroup);
  sortPass.dispatchWorkgroups(Math.ceil(MAX_TRANSPARENT / 1024));
  sortPass.end();

  // 3. 生成批次
  const batchPass = encoder.beginComputePass();
  batchPass.setPipeline(batchPipeline);
  batchPass.setBindGroup(0, batchBindGroup);
  batchPass.dispatchWorkgroups(Math.ceil(MAX_TRANSPARENT / 64));
  batchPass.end();

  // 4. 渲染
  const renderPass = encoder.beginRenderPass({
    colorAttachments: [{...}],
    depthStencilAttachment: {...}
  });

  // 不透明物体
  renderOpaque(renderPass);

  // 透明物体
  renderTransparent(renderPass);

  renderPass.end();

  // 提交
  device.queue.submit([encoder.finish()]);
}
```

## 命令缓冲管理

### 双缓冲策略

```javascript
// 双缓冲命令缓冲
const cmdBuffers = [
  {
    opaque: createCmdBuffer(),
    transparent: createCmdBuffer()
  },
  {
    opaque: createCmdBuffer(),
    transparent: createCmdBuffer()
  }
];

let currentFrame = 0;

function renderFrame() {
  const buffers = cmdBuffers[currentFrame % 2];

  // 使用当前缓冲
  const computePass = encoder.beginComputePass();
  computePass.setBindGroup(0, createBindGroup(buffers));
  // ...
  computePass.end();

  const renderPass = encoder.beginRenderPass({...});
  renderPass.setBindGroup(0, createBindGroup(buffers));
  // ...
  renderPass.end();

  device.queue.submit([encoder.finish()]);
  currentFrame++;
}
```

### 命令缓冲复用

```javascript
// 重置计数器（无需重新创建缓冲）
function resetCounters() {
  device.queue.writeBuffer(opaqueCounter, 0, new Uint32Array([0]));
  device.queue.writeBuffer(transparentCounter, 0, new Uint32Array([0]));
}
```

## 性能优化

### 1. 批量绘制优化

```wgsl
// 在计算着色器中合并小批次
fn mergeSmallBatches() {
  // 将相同材质的小物体合并为一个绘制命令
  // 减少draw call数量
}
```

### 2. 实例化扩展

```wgsl
// 扩展命令结构支持实例化
struct DrawIndexedIndirectInstanced {
  indexCount: u32,
  instanceCount: u32,  // >1表示实例化
  firstIndex: u32,
  vertexOffset: i32,
  baseInstance: u32,
};
```

### 3. 条件渲染

```javascript
// 使用条件渲染避免绘制空命令
const querySet = device.createQuerySet({
  type: 'occlusion',
  count: MAX_DRAWS
});

// 在计算着色器中设置查询
// 在渲染时检查查询结果
```

## 常见问题

| 问题 | 解决方案 |
|------|---------|
| multiDraw不可用 | 检测`indirect-first-instance`特性，使用循环fallback |
| 命令缓冲不足 | 增加MAX_DRAWS常量，或实现动态扩容 |
| 绘制结果空白 | 检查命令生成逻辑，确保indexCount不为0 |
| 性能未提升 | 确认实际使用multiDraw而非循环draw |

---

## 相关文档

| 文档 | 说明 |
|------|------|
| [00-架构概览](./00-architecture.md) | 整体架构和设计原则 |
| [02-透明渲染](./03-transparent-rendering.md) | 透明物体渲染（下一阶段） |
| [03-剔除系统](./05-culling.md) | 视锥和遮挡剔除 |
| [07-API参考](./16-api-reference.md) | 核心 API 详细说明 |
| [08-代码示例](./17-examples.md) | 代码示例和模板 |
| [快速开始指南](./QUICKSTART.md) | 5分钟入门 |

---

> 最后更新：2026-04-20
