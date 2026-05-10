import { Submit } from '@feng3d/render-api';
import { WebGPU } from '@feng3d/webgpu';

import { vertexShader, fragmentShader } from './shaders/shader';

document.addEventListener('DOMContentLoaded', async () =>
{
    // 使用 TSL 生成着色器代码
    const vertexWgsl = vertexShader.toWGSL();
    const fragmentWgsl = fragmentShader.toWGSL();

    const devicePixelRatio = window.devicePixelRatio || 1;

    // 初始化 WebGPU
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    const webgpu = await new WebGPU({ canvasId: 'canvas' }).init();

    // 创建提交对象
    const submit: Submit = {
        commandEncoders: [
            {
                passEncoders: [
                    {
                        descriptor: {
                            colorAttachments: [{
                                clearValue: [0.0, 0.0, 0.0, 1.0],
                                loadOp: 'clear',
                            }],
                        },
                        renderPassObjects: [{
                            pipeline: {
                                vertex: {
                                    wgsl: vertexWgsl,
                                },
                                fragment: {
                                    wgsl: fragmentWgsl,
                                },
                            },
                            vertices: {
                                position: {
                                    data: new Float32Array([0.0, 0.5, -0.5, -0.5, 0.5, -0.5]),
                                    format: 'float32x2',
                                },
                            },
                            indices: new Uint16Array([0, 1, 2]),
                            draw: { __type__: 'DrawIndexed', indexCount: 3 },
                            bindingResources: { color: { value: [1, 0, 0, 1] } },
                        }],
                    },
                ],
            },
        ],
    };

    // 提交渲染命令
    webgpu.submit(submit);
});

