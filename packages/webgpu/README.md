# @feng3d/webgpu

feng3d引擎的WebGPU渲染器，可以让用户无需直接接触WebGPU的API，只需提供渲染所需数据，组织好数据结构便可使用WebGPU渲染，并且支持动态修改数据从而实现动态渲染。

## 示例

[@feng3d/webgpu示例](https://feng3d.com/webgpu/)

这里完整实现了webgpu的[官方示例](https://github.com/webgpu/webgpu-samples)。

## 安装
```
npm install @feng3d/webgpu
```

## 如何使用
```typescript
import { Submit } from "@feng3d/render-api";
import { WebGPU } from "@feng3d/webgpu";

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