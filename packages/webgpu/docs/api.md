# API 参考

## 主入口

### WebGPU

主入口类，提供 WebGPU 设备和渲染上下文。

```typescript
import { WebGPU } from '@feng3d/webgpu';

const webgpu = new WebGPU(options: WebGPUOptions);
```

**选项**：
- `canvas: HTMLCanvasElement` - 画布元素
- `device?: GPUDevice` - 现有设备（可选）

**属性**：
- `device: GPUDevice` - WebGPU 设备
- `context: GPUCanvasContext` - 渲染上下文
- `format: GPUTextureFormat` - 纹理格式

**方法**：
- `createRenderPass(descriptor)` - 创建渲染通道
- `createComputePass(descriptor)` - 创建计算通道
- `submit(commandBuffer)` - 提交命令

## 缓存系统

### WGPUBuffer

GPU 缓冲区封装。

```typescript
const buffer = new WGPUBuffer({
  device,
  size,
  usage,
});
```

### WGPUTexture

GPU 纹理封装。

```typescript
const texture = new WGPUTexture({
  device,
  size,
  format,
  usage,
});
```

### WGPUSampler

采样器封装。

```typescript
const sampler = new WGPUSampler({
  device,
  ...options,
});
```

### WGPURenderPipeline

渲染管线封装。

```typescript
const pipeline = new WGPURenderPipeline({
  device,
  vertex,
  fragment,
  primitive,
  ...options,
});
```

### WGPUComputePipeline

计算管线封装。

```typescript
const pipeline = new WGPUComputePipeline({
  device,
  compute,
});
```

### WGPUBindGroup

绑定组封装。

```typescript
const bindGroup = new WGPUBindGroup({
  device,
  layout,
  entries,
});
```

## 渲染对象

### RenderObject

渲染对象基类。

### ComputeObject

计算对象。

```typescript
const computeObject = new ComputeObject({
  pipeline,
  bindGroups,
  workgroups,
});
```

## 工具函数

### getGPUDevice

获取 WebGPU 设备。

```typescript
import { getGPUDevice } from '@feng3d/webgpu';

const device = await getGPUDevice();
```

### quitIfWebGPUNotAvailable

检查 WebGPU 可用性，不可用时退出。

```typescript
import { quitIfWebGPUNotAvailable } from '@feng3d/webgpu';

quitIfWebGPUNotAvailable();
```

### readPixels

从纹理读取像素数据。

```typescript
import { readPixels } from '@feng3d/webgpu';

const pixels = await readPixels(device, texture);
```

## 类型定义

### TextureType

纹理类型枚举。

### VertexFormat

顶点格式类型。

## 导出

```typescript
// 主入口
export { WebGPU } from './WebGPU';

// 响应式对象
export { ReactiveObject } from './ReactiveObject';

// 缓存
export * from './caches';

// 数据
export * from './data';

// 工具
export * from './utils';

// 类型
export * from './types';
```
