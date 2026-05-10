import { RenderPassDescriptor, Submit } from '@feng3d/render-api';
import { WebGPU } from '@feng3d/webgpu';

import { fragmentShader, vertexShader } from './shaders/shader';

document.addEventListener('DOMContentLoaded', async () =>
{
    // 使用函数式方式定义着色器生成着色器代码
    // shaderType 作为第一个参数，必须提供；entry 作为第二个参数，可选（对应 vertex("main", ...) 和 fragment("main", ...) 中的函数名）
    const vertexWgsl = vertexShader.toWGSL();
    const fragmentWgsl = fragmentShader.toWGSL();

    const devicePixelRatio = window.devicePixelRatio || 1;

    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    const webgpu = await new WebGPU({ canvasId: 'canvas' }).init();

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
                                position: { data: new Float32Array([0.0, 0.5, -0.5, -0.5, 0.5, -0.5]), format: 'float32x2' },
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

    webgpu.submit(submit);
});
