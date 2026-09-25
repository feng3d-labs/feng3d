import { Submit } from '@feng3d/webgpu';
import { WebGPU } from '@feng3d/webgpu';

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
                                position: { data: new Float32Array([0.0, 0.5, -0.5, -0.5, 0.5, -0.5]), format: 'float32x2' }, // 顶点坐标数据
                            },
                            indices: new Uint16Array([0, 1, 2]), // 顶点索引数据
                            draw: { __type__: 'DrawIndexed', indexCount: 3 }, // 绘制命令
                            bindingResources: { color: { value: [1, 0, 0, 0] } }, // Uniform 颜色值。
                        }],
                    },
                ],
            },
        ],
    };

    function frame()
    {
        webgpu.submit(submit);
        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);

    // webgpu.submit(submit); // 提交GPU执行
};

let webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;

if (!webgpuCanvas)
{
    webgpuCanvas = document.createElement('canvas');
    webgpuCanvas.id = 'webgpu';
    webgpuCanvas.style.width = '400px';
    webgpuCanvas.style.height = '300px';
    document.body.appendChild(webgpuCanvas);
}
init(webgpuCanvas);
