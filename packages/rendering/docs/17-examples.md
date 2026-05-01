# 代码示例索引

本文档提供全GPU驱动渲染系统各功能的代码示例和参考实现。

## 目录

- [基础示例](#基础示例)
- [计算着色器](#计算着色器)
- [渲染管线](#渲染管线)
- [完整示例](#完整示例)
- [现有示例参考](#现有示例参考)

---

## 基础示例

### 创建 Indirect Buffer

```typescript
// 创建间接绘制命令缓冲区
function createIndirectBuffer(device: GPUDevice, maxDraws: number): GPUBuffer {
  return device.createBuffer({
    size: maxDraws * 20,  // DrawIndexedIndirect = 20 字节
    usage: GPUBufferUsage.INDIRECT | GPUBufferUsage.STORAGE
  });
}

// 使用
const indirectBuffer = createIndirectBuffer(device, 10000);
```

### 创建物体数据

```typescript
interface ObjectData {
  worldMat: Mat4;
  materialIndex: number;
  indexOffset: number;
  indexCount: number;
}

function createObjectBuffer(device: GPUDevice, objects: ObjectData[]): GPUBuffer {
  const bufferData = new Float32Array(objects.length * 20); // 4x4矩阵 + 4个u32
  const uintView = new Uint32Array(bufferData.buffer);
  
  objects.forEach((obj, i) => {
    const offset = i * 20;
    bufferData.set(obj.worldMat, offset);
    uintView[offset + 16] = obj.materialIndex;
    uintView[offset + 17] = obj.indexOffset;
    uintView[offset + 18] = obj.indexCount;
  });
  
  return device.createBuffer({
    size: bufferData.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });
}
```

---

## 计算着色器

### 命令生成着色器

```wgsl
// command_generation.wgsl

struct Object {
  worldMat: mat4x4f,
  materialIndex: u32,
  indexOffset: u32,
  indexCount: u32,
  visible: u32,
};

struct DrawIndexedIndirect {
  indexCount: u32,
  instanceCount: u32,
  firstIndex: u32,
  vertexOffset: i32,
  baseInstance: u32,
};

@group(0) @binding(0) var<storage, read> objects: array<Object>;
@group(0) @binding(1) var<storage, read_write> commands: array<DrawIndexedIndirect>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  let objIdx = gid.x;
  let obj = objects[objIdx];
  
  // 生成绘制命令
  var cmd: DrawIndexedIndirect;
  cmd.indexCount = obj.indexCount;
  cmd.instanceCount = 1;
  cmd.firstIndex = obj.indexOffset;
  cmd.vertexOffset = 0;
  cmd.baseInstance = objIdx;
  
  commands[objIdx] = cmd;
}
```

### 视锥剔除着色器

```wgsl
// frustum_culling.wgsl

struct Frustum {
  planes: vec4f[6],  // 左、右、上、下、近、远
};

fn isAABBInFrustum(aabb: vec4f[2], frustum: Frustum) -> bool {
  for (var i: u32 = 0; i < 6; i++) {
    let plane = frustum.planes[i];
    let p = vec3f(
      select(aabb[0].x, aabb[1].x, plane.x > 0.0),
      select(aabb[0].y, aabb[1].y, plane.y > 0.0),
      select(aabb[0].z, aabb[1].z, plane.z > 0.0)
    );
    if (dot(p, plane.xyz) + plane.w < 0.0) {
      return false;
    }
  }
  return true;
}
```

---

## 渲染管线

### 顶点着色器

```wgsl
// vertex.wgsl

struct VertexInput {
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) uv: vec2f,
};

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
  @location(1) normal: vec3f,
  @location(2) worldPos: vec3f,
};

struct Camera {
  viewProjMat: mat4x4f,
};

@group(0) @binding(0) var<uniform> camera: Camera;

@vertex
fn vs(input: VertexInput, @builtin(instance_index) instanceIdx: u32) -> VertexOutput {
  var output: VertexOutput;
  
  // 获取物体世界矩阵（从实例化数据中）
  let worldMat = objects[instanceIdx].worldMat;
  let worldPos = worldMat * vec4f(input.position, 1.0);
  
  output.position = camera.viewProjMat * worldPos;
  output.uv = input.uv;
  output.normal = (worldMat * vec4f(input.normal, 0.0)).xyz;
  output.worldPos = worldPos.xyz;
  
  return output;
}
```

### 片段着色器（PBR）

```wgsl
// fragment.wgsl

struct Material {
  albedo: vec4f,
  roughness: f32,
  metalness: f32,
};

@group(0) @binding(1) var<storage, read> materials: array<Material>;

@fragment
fn fs(@location(0) uv: vec2f, @location(1) normal: vec3f, @location(2) worldPos: vec3f) 
    -> @location(0) vec4f {
  let material = materials[instanceIdx];
  
  // 简单 PBR 光照
  let N = normalize(normal);
  let L = normalize(vec3f(1.0, 1.0, 1.0)); // 光方向
  
  let ambient = material.albedo * 0.1;
  let diffuse = material.albedo * max(dot(N, L), 0.0) * 0.8;
  
  return ambient + diffuse;
}
```

---

## 完整示例

### 最小化 GPU 驱动渲染

```typescript
// minimal-gpu-driven.ts

async function init() {
  const webgpu = await new WebGPU().init();
  
  // 1. 创建资源
  const objectBuffer = createObjectBuffer(device, sceneData.objects);
  const indirectBuffer = createIndirectBuffer(device, sceneData.objects.length);
  
  // 2. 创建计算管线（命令生成）
  const computePipeline = device.createComputePipeline({
    compute: {
      module: device.createShaderModule({ code: commandGenerationWGSL }),
      entryPoint: 'main'
    }
  });
  
  // 3. 创建渲染管线
  const renderPipeline = device.createRenderPipeline({
    // ... 管线配置
  });
  
  // 4. 每帧渲染
  function renderFrame() {
    const encoder = device.createCommandEncoder();
    
    // 计算着色器生成命令
    const computePass = encoder.beginComputePass();
    computePass.setPipeline(computePipeline);
    computePass.setBindGroup(0, computeBindGroup);
    computePass.dispatchWorkgroups(Math.ceil(objectCount / 64));
    computePass.end();
    
    // 渲染
    const renderPass = encoder.beginRenderPass({ ... });
    renderPass.setPipeline(renderPipeline);
    renderPass.setBindGroup(0, renderBindGroup);
    renderPass.drawIndexedIndirect(indirectBuffer, 0);
    renderPass.end();
    
    device.queue.submit([encoder.finish()]);
  }
  
  requestAnimationFrame(renderFrame);
}
```

---

## 现有示例参考

### 项目内示例

| 示例 | 位置 | 功能 |
|------|------|------|
| 实例化立方体 | `examples/src/webgpu/instancedCube/` | 基础实例化渲染 |
| Bitonic 排序 | `examples/src/webgpu/bitonicSort/` | GPU 排序算法 |
| 时间戳查询 | `examples/src/webgpu/timestampQuery/` | 性能监控 |
| 阴影映射 | `examples/src/webgpu/shadowMapping/` | 阴影渲染 |

### 外部参考

| 资源 | 链接 |
|------|------|
| WebGPU Samples | https://webgpu.github.io/webgpu-samples/ |
| WGSL Spec | https://www.w3.org/TR/WGSL/ |
| GPU Driven Rendering | https://advances.realtimerendering.com/ |
| Nanite Paper | Unreal Engine 5 技术论文 |

---

## 示例模板

### 计算着色器模板

```wgsl
// @group(0) @binding(N) 绑定资源
// @compute @workgroup_size(X) 计算配置
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  // 保护：检查索引边界
  let idx = gid.x;
  if (idx >= count) { return; }
  
  // 核心逻辑
  
  // 输出：写入结果
}
```

### 渲染管线模板

```typescript
const pipeline = device.createRenderPipeline({
  layout: 'auto',
  vertex: {
    module: shaderModule,
    entryPoint: 'vs',
    buffers: [vertexBufferLayout]
  },
  fragment: {
    module: shaderModule,
    entryPoint: 'fs',
    targets: [{ format: 'bgra8unorm' }]
  },
  primitive: {
    topology: 'triangle-list',
    cullMode: 'back'
  },
  depthStencil: {
    depthWriteEnabled: true,
    depthCompare: 'less',
    format: 'depth24plus-stencil8'
  }
});
```

---

> 更多示例请参考项目 examples 目录

> 最后更新：2026-04-20
