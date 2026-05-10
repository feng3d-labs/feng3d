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
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    const webgpu = await new WebGPU({ canvasId: 'canvas' }).init();

    const renderObject = {
        vertices: {
            position: {
                data: new Float32Array([
                    -1, 0,
                    0, -1,
                    1, 1,
                ]),
                format: 'float32x2' as const,
            },
        },
        draw: { __type__: 'DrawVertex' as const, vertexCount: 3 },
        bindingResources: { color: { value: [1, 0, 0, 1] } },
        pipeline: {
            vertex: {
                wgsl: vertexWgsl,
            },
            fragment: {
                wgsl: fragmentWgsl,
            },
        },
    };

    function draw()
    {
        canvas.width = canvas.clientWidth * devicePixelRatio;
        canvas.height = canvas.clientHeight * devicePixelRatio;

        const submit: Submit = {
            commandEncoders: [{
                passEncoders: [
                    {
                        descriptor: {
                            colorAttachments: [{ clearValue: [0, 0, 0, 1] }],
                            depthStencilAttachment: { depthClearValue: 1 },
                        },
                        renderPassObjects: [renderObject],
                    },
                ],
            }],
        };

        webgpu.submit(submit);

        requestAnimationFrame(draw);
    }
    draw();
});

