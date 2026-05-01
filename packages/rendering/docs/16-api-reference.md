# API 参考文档

本文档提供全GPU驱动渲染系统使用的核心 API 参考。

## 目录

- [数据类型](#数据类型)
- [计算着色器](#计算着色器)
- [渲染管线](#渲染管线)
- [扩展 API](#扩展-api)

---

## 数据类型

### Object

物体数据结构，存储在 GPU 缓冲中。

```wgsl
struct Object {
  worldMat: mat4x4f,       // 世界矩阵（4x4）
  materialIndex: u32,      // 材质索引
  indexOffset: u32,        // 索引起始偏移
  indexCount: u32,         // 索引数量
  visible: u32,            // 显隐标记
};
```

**字段说明**：
| 字段 | 类型 | 说明 |
|------|------|------|
| worldMat | mat4x4f | 物体的世界变换矩阵 |
| materialIndex | u32 | 材质缓冲中的索引 |
| indexOffset | u32 | 索引缓冲中的起始位置 |
| indexCount | u32 | 索引数量 |
| visible | u32 | 0=隐藏, 1=显示, 2=自动剔除 |

---

### DrawIndexedIndirect

间接绘制命令结构。

```wgsl
struct DrawIndexedIndirect {
  indexCount: u32,      // 索引数量
  instanceCount: u32,   // 实例数量
  firstIndex: u32,      // 起始索引
  vertexOffset: i32,    // 顶点偏移
  baseInstance: u32,    // 基础实例ID
};
```

**用途**：GPU 生成绘制命令，存储在 Indirect Buffer 中。

---

### Material

材质数据结构。

```wgsl
struct Material {
  albedo: vec4f,           // 基础颜色
  roughness: f32,          // 粗糙度
  metalness: f32,          // 金属度
  samplerIndices: u32[3],  // 采样器索引
  textureIndices: u32[3],  // 纹理索引
};
```

---

### Camera

相机数据结构。

```wgsl
struct Camera {
  viewMat: mat4x4f,        // 视图矩阵
  projMat: mat4x4f,        // 投影矩阵
  viewProjMat: mat4x4f,    // 视图投影矩阵
  pos: vec3f,              // 相机位置
  frustumPlanes: vec4f[6], // 视锥平面
};
```

---

## 计算着色器

### generateCommands

命令生成计算着色器。

```wgsl
@group(0) @binding(0) var<storage, read> objects: array<Object>;
@group(0) @binding(1) var<storage, read_write> commands: array<DrawIndexedIndirect>;

@compute @workgroup_size(64)
fn generateCommands(@builtin(global_invocation_id) gid: vec3u) {
  let objIdx = gid.x;
  let obj = objects[objIdx];
  
  // 生成绘制命令
  commands[objIdx] = DrawIndexedIndirect(
    obj.indexCount,
    1,
    obj.indexOffset,
    0,
    objIdx
  );
}
```

**参数**：
- workgroup_size: 建议使用 64（平衡性能和硬件利用率）

---

### bitonicSort

Bitonic 排序着色器（透明物体使用）。

```wgsl
@compute @workgroup_size(1024)
fn bitonicSort(@builtin(global_invocation_id) gid: vec3u) {
  // 排序逻辑
}
```

---

## 渲染管线

### 不透明渲染管线

```typescript
const opaquePipeline: RenderPipeline = {
  vertex: {
    code: vertexShader,
    entryPoint: 'vs'
  },
  fragment: {
    code: fragmentShader,
    entryPoint: 'fs',
    targets: [{ format: 'bgra8unorm' }]
  },
  depthStencil: {
    depthWriteEnabled: true,
    depthCompare: 'less',
    format: 'depth24plus-stencil8'
  }
};
```

### 透明渲染管线

```typescript
const transparentPipeline: RenderPipeline = {
  // ... 同上
  depthStencil: {
    depthWriteEnabled: false,  // 关键：关闭深度写入
    depthCompare: 'less',
    format: 'depth24plus-stencil8'
  },
  // ... 需要配置 alpha 混合
};
```

---

## 扩展 API

### @feng3d/webgpu 扩展

#### DrawIndexedIndirect 数据类型

```typescript
export interface DrawIndexedIndirect {
  __type__: 'DrawIndexedIndirect';
  indexCount: number;
  instanceCount: number;
  firstIndex: number;
  baseVertex: number;
  firstInstance: number;
}
```

#### IndirectBuffer

```typescript
export interface IndirectBuffer {
  buffer: GPUBuffer;
  offset?: number;
}
```

#### 使用示例

```typescript
const renderObject: RenderObject = {
  pipeline: opaquePipeline,
  indirectDraw: {
    buffer: commandBuffer,
    drawCount: objectCount
  }
};
```

---

## 工具函数

### createIndirectBuffer

创建间接绘制缓冲区。

```typescript
function createIndirectBuffer(
  device: GPUDevice,
  count: number
): GPUBuffer {
  return device.createBuffer({
    size: count * 20,  // DrawIndexedIndirect = 20 字节
    usage: GPUBufferUsage.INDIRECT | GPUBufferUsage.STORAGE
  });
}
```

### createStorageBuffer

创建可读写存储缓冲区。

```typescript
function createStorageBuffer<T>(
  device: GPUDevice,
  data: T[]
): GPUBuffer {
  const size = data.length * sizeof(T);
  return device.createBuffer({
    size,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });
}
```

---

## 常量

| 常量 | 值 | 说明 |
|------|-----|------|
| MAX_OBJECTS | 65536 | 最大物体数量 |
| MAX_TRANSPARENT | 4096 | 最大透明物体数量 |
| MAX_BATCHES | 1024 | 最大批次数量 |
| CLUSTER_DISTANCE | 0.5 | 深度聚类间距（米） |

---

## 类型定义

### IndicesDataTypes

```typescript
type IndicesDataTypes = Uint16Array | Uint32Array;
```

### IDraw

```typescript
type IDraw = DrawVertex | DrawIndexed | DrawIndexedIndirect;
```

---

> 更多 API 详情请参考源码和 [08-代码示例](./17-examples.md)

> 最后更新：2026-04-20
