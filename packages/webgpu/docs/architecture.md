# 架构说明

## 项目结构

```
src/
├── caches/         # WebGPU 对象缓存
├── data/           # 数据结构和 polyfills
│   └── polyfills/  # WebAPI polyfills
├── internal/       # 内部渲染逻辑
│   └── renderobject/ # 渲染对象执行器
├── types/          # 类型定义
├── utils/          # 工具函数
├── ReactiveObject.ts
├── index.ts
└── WebGPU.ts
```

## 核心组件

### WebGPU 类

主入口类，负责：
- 初始化 WebGPU 设备
- 管理渲染上下文
- 创建渲染通道
- 提交命令缓冲

### 缓存系统 (`caches/`)

所有 WebGPU 资源的缓存封装类：

- `WGPUBuffer` - GPU 缓冲区
- `WGPUTexture` - GPU 纹理
- `WGPUSampler` - 采样器
- `WGPUShaderModule` - 着色器模块
- `WGPURenderPipeline` - 渲染管线
- `WGPUComputePipeline` - 计算管线
- `WGPUBindGroup` - 绑定组
- `WGPUBindGroupLayout` - 绑定组布局
- `WGPUPipelineLayout` - 管线布局

### 数据结构 (`data/`)

- `ComputeObject` - 计算对象
- `ComputePass` - 计算通道
- `RenderBundle` - 渲染束
- `TimestampQuery` - 时间戳查询
- `VideoTexture` - 视频纹理

### 内部渲染逻辑 (`internal/`)

- `runCommandEncoder.ts` - 命令编码器执行
- `runRenderPass.ts` - 渲染通道执行
- `runComputePass.ts` - 计算通道执行
- `runRenderObject.ts` - 渲染对象执行
- `renderobject/` - 渲染对象详细执行逻辑

## 渲染流程

```
1. 创建 WebGPU 实例
   └── 初始化设备和上下文

2. 创建资源
   ├── Buffer（顶点数据、索引数据、uniform 数据）
   ├── Texture（纹理、渲染目标）
   └── Sampler（采样器）

3. 创建管线
   ├── ShaderModule（着色器）
   ├── BindGroupLayout（绑定组布局）
   ├── PipelineLayout（管线布局）
   └── RenderPipeline/ComputePipeline

4. 创建渲染对象
   ├── 设置管线
   ├── 设置绑定组
   ├── 设置缓冲区
   └── 绘制

5. 执行渲染
   ├── 开始渲染通道
   ├── 执行渲染对象
   └── 结束渲染通道
```

## 响应式系统

基于 `@feng3d/reactivity` 的响应式对象：

```typescript
class ReactiveObject {
  // 响应式属性
  // 当属性变化时自动更新 GPU 资源
}
```

## 与其他包的关系

```
@feng3d/webgpu
├── @feng3d/tsl          # 着色器语言
├── @feng3d/render-api   # 渲染 API 抽象
├── @feng3d/reactivity   # 响应式系统
└── @webgpu/types        # WebGPU 类型
```
