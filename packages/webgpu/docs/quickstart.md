# 快速开始

## 安装

```bash
npm install @feng3d/webgpu
```

## 基础用法

### 初始化 WebGPU

```typescript
import { WebGPU } from '@feng3d/webgpu';

// 创建 WebGPU 实例
const webgpu = new WebGPU({
  canvas: document.querySelector('canvas'),
});

// 获取设备和上下文
const device = webgpu.device;
const context = webgpu.context;
```

### 创建缓冲区

```typescript
import { WGPUBuffer } from '@feng3d/webgpu';

// 创建顶点缓冲区
const vertexBuffer = new WGPUBuffer({
  device,
  size: 3 * 2 * 4, // 3 个顶点，每个 2 个 float32
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

// 写入数据
vertexBuffer.write(new Float32Array([
  -0.5, -0.5,
   0.5, -0.5,
   0.0,  0.5,
]));
```

### 创建渲染管线

```typescript
import { WGPURenderPipeline } from '@feng3d/webgpu';

const pipeline = new WGPURenderPipeline({
  device,
  vertex: {
    module: device.createShaderModule({
      code: vertexShaderWGSL,
    }),
    entryPoint: 'main',
  },
  fragment: {
    module: device.createShaderModule({
      code: fragmentShaderWGSL,
    }),
    entryPoint: 'main',
    targets: [{ format: 'bgra8unorm' }],
  },
  primitive: {
    topology: 'triangle-list',
  },
});
```

### 渲染

```typescript
// 开始渲染通道
const renderPass = webgpu.createRenderPass({
  colorAttachments: [{
    view: context.getCurrentTexture().createView(),
    clearValue: { r: 0, g: 0, b: 0, a: 1 },
    loadOp: 'clear',
    storeOp: 'store',
  }],
});

// 设置管线和绘制
renderPass.setPipeline(pipeline);
renderPass.setVertexBuffer(0, vertexBuffer);
renderPass.draw(3);

// 结束渲染通道
renderPass.end();
```

## 运行示例

```bash
# 克隆仓库
git clone https://github.com/feng3d-labs/webgpu.git

# 安装依赖
npm install

# 运行示例
npm run examples:dev
```

## 下一步

- [架构说明](architecture.md) - 了解项目架构
- [API 参考](api.md) - 查看完整 API 文档
