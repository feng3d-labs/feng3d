# @feng3d/webgpu

feng3d引擎的WebGPU渲染器，可以让用户无需直接接触WebGPU的API，只需提供渲染所需数据，组织好数据结构便可使用WebGPU渲染，并且支持动态修改数据从而实现动态渲染。

## 架构速览

> 本包是「纯数据 → GPU 对象 → 命令提交」的翻译层，独占 `GPUDevice`，以 `submit()` 为唯一提交入口。
> 引擎侧的架构与演进规划见 [docs/ARCHITECTURE_V2.md](../../docs/ARCHITECTURE_V2.md)。

### 目录结构

```
src/
├── WebGPU.ts           # 入口类：设备初始化、submit、读取回传
├── index.ts            # 公开导出面
├── ReactiveObject.ts   # 响应式包装基类
├── caches/             # WGPU* 缓存类（35 个）：数据对象 → GPU 对象的映射与缓存
├── data/               # 纯数据描述（Submit / RenderPass / RenderObject / Buffer / Texture …）
├── internal/           # 命令编码执行器
│   ├── runSubmit.ts            # 提交入口：挂起变更计数 → 编码 → 拉取上传 → queue.submit
│   ├── runCommandEncoder.ts    # 命令编码器分发
│   ├── runRenderPass.ts        # 渲染通道
│   └── renderobject/           # 单次绘制的状态设置（pipeline / bindGroup / vertex / index / draw）
├── consts/             # 常量（顶点格式映射等）
├── types/              # 类型定义（TypedArray / VertexFormat）
└── utils/              # ChainMap / GPUDeviceStats / GpuResourceReleaser / renderState
```

### 四个核心机制

1. **身份键缓存**：每个数据对象对应一个 `WGPU*` 包装类，经 `getInstance(device, 数据对象, …附加身份)` + `static map = new ChainMap(...)` 查表。缓存键是**数据对象身份**（如 `(device, texture)`、`(device, buffer, TypeInfo)`），同一数据对象复用同一 GPU 资源。
2. **按需呈现**：`View` 把全局变更计数写入 `Submit.version`；`WebGPU.submit` 比对上次已提交版本，相同则**直接返回**（不编码、不提交），画布保持最后呈现帧（`WebGPU.ts:114`）。
3. **pull 式上传**：uniform/顶点的差异上传不在写入时 push，而在 `runSubmit` 编码完成后统一拉取（版本号判定，无变化不上传），保证 `writeBuffer` 排队先于本次命令缓冲执行。
4. **命令编码缓存**：`WGPURenderPass` 按「renderPassObjects 元素身份序列」把连续段录成 RenderBundle，序列不变则重放；带 blend（透明排序敏感）的对象不进 bundle。

### 公开 API

`WebGPU` 类对外方法（`src/WebGPU.ts`）：

| 方法 | 说明 |
|---|---|
| `init(options?, descriptor?)` | 初始化设备与画布上下文 |
| `submit(submit)` | 提交一次 GPU 执行（按需呈现生效处） |
| `readPixels(gpuReadPixels)` | 回读像素 |
| `readBuffer(buffer, byteOffset?, byteLength?)` | 回读缓冲区 |
| `copyDepthTexture(source, target)` | 拷贝深度纹理 |
| `textureInvertYPremultiplyAlpha(texture, options)` | 纹理翻转 Y / 预乘 alpha |
| `destoryTexture(texture)` | 销毁纹理（**方法名拼写如此**，非 `destroyTexture`） |
| `destroy()` | 销毁设备与上下文 |

`src/index.ts` 公开导出：`Submit` 及全部 `data/*` 描述类型、`utils/*` 工具（`ChainMap` / `GPUDeviceStats` / `GpuResourceReleaser`）、`types/*`。
**注意**：`caches/` 下的 35 个 `WGPU*` 类中，仅 `WGPURenderBundle` 被导出（供 benchmark 统计）。其余为内部实现，**不承诺 API 稳定性**。

### 依赖

```
@feng3d/webgpu
├── @feng3d/reactivity   # 响应式系统（缓存失效驱动）
├── @feng3d/watcher      # 属性监听
├── wgsl_reflect         # WGSL 反射（推导绑定与顶点布局）
└── @webgpu/types        # WebGPU 类型
```

## 示例

[@feng3d/webgpu示例](https://feng3d.com/webgpu/)

这里完整实现了webgpu的[官方示例](https://github.com/webgpu/webgpu-samples)。

## 安装
```
npm install @feng3d/webgpu
```

## 如何使用
```typescript
import { Submit, WebGPU } from "@feng3d/webgpu";

const init = async (canvas: HTMLCanvasElement) =>
{
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;

    const webgpu = await new WebGPU().init(); // 初始化WebGPU

    const submit: Submit = { // 一次GPU提交
        commandEncoders: [ // 命令编码列表
            {
                passEncoders: [ // 通道编码列表
                    { // 渲染通道
                        descriptor: { // 渲染通道描述
                            colorAttachments: [{ // 颜色附件
                                view: { texture: { context: { canvasId: canvas.id } } }, // 绘制到canvas上
                                clearValue: [0.0, 0.0, 0.0, 1.0], // 渲染前填充颜色
                            }],
                        },
                        renderPassObjects: [{ // 渲染对象
                            pipeline: { // 渲染管线
                                vertex: { // 顶点着色器
                                    code: `
                                    @vertex
                                    fn main(
                                        @location(0) position: vec2<f32>,
                                    ) -> @builtin(position) vec4<f32> {
                                        return vec4<f32>(position, 0.0, 1.0);
                                    }
                                    ` },
                                fragment: { // 片段着色器
                                    code: `
                                        @binding(0) @group(0) var<uniform> color : vec4<f32>;
                                        @fragment
                                        fn main() -> @location(0) vec4f {
                                            return color;
                                        }
                                    ` },
                            },
                            vertices: {
                                position: { data: new Float32Array([0.0, 0.5, -0.5, -0.5, 0.5, -0.5]), format: "float32x2" }, // 顶点坐标数据
                            },
                            indices: new Uint16Array([0, 1, 2]), // 顶点索引数据
                            bindingResources: { color: { value: [1, 0, 0, 1] } }, // Uniform 颜色值
                            draw: { __type__: "DrawIndexed", indexCount: 3 }, // 绘制命令
                        }]
                    },
                ]
            }
        ],
    };

    webgpu.submit(submit); // 提交GPU执行
};

let webgpuCanvas = document.getElementById("webgpu") as HTMLCanvasElement;
if (!webgpuCanvas)
{
    webgpuCanvas = document.createElement("canvas");
    webgpuCanvas.id = "webgpu";
    webgpuCanvas.style.width = "400px";
    webgpuCanvas.style.height = "300px";
    document.body.appendChild(webgpuCanvas);
}
init(webgpuCanvas);
```

[![在 StackBlitz 中打开](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/feng3d-labs/webgpu/tree/master/examples)

## 参考
1. https://github.com/webgpu/webgpu-samples
2. https://www.orillusion.com/zh/webgpu.html
3. https://www.orillusion.com/zh/wgsl.html
4. https://gpuweb.github.io/gpuweb/
5. https://gpuweb.github.io/gpuweb/wgsl/
6. https://github.com/Orillusion/orillusion/tree/main/src/gfx/graphics/webGpu
7. https://github.com/mrdoob/three.js/tree/dev/examples/jsm/renderers/webgpu
8. https://github.com/regl-project/regl
9. https://github.com/regl-project/regl/blob/master/example/basic.js
10. https://github.com/stackgpu/Simple-GPU
11. https://github.com/antvis/G/blob/next/packages/g-plugin-webgpu-device/src/platform/Program.ts
12. https://github.com/dtysky/webgpu-renderer
13. WGSL反射。 https://github.com/brendan-duncan/wgsl_reflect
14. https://github.com/greggman/webgpu-avoid-redundant-state-setting
    1.  避免调用WebGPU中的冗余状态。
15. https://github.com/greggman/webgpu-utils
    1.  webgpu一些工具。
16. https://github.com/GEngine-js/GEngine
