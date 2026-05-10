import { RenderPipeline, Sampler, Submit, Texture } from '@feng3d/render-api';
import { WebGPU } from '@feng3d/webgpu';
import { loadImage } from '../../utils/loadImage';

import { vertexShader, fragmentShader } from './shaders/shader';

// 辅助函数：初始化画布大小
function initCanvasSize(canvas: HTMLCanvasElement)
{
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
}

document.addEventListener('DOMContentLoaded', async () =>
{
    const vertexWgsl = vertexShader.toWGSL();
    const fragmentWgsl = fragmentShader.toWGSL(vertexShader);

    const devicePixelRatio = window.devicePixelRatio || 1;

    // 初始化WebGPU
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    initCanvasSize(canvas);
    const webgpu = await new WebGPU({ canvasId: 'canvas' }).init();

    // 加载图像
    const image = await loadImage('./images/Di-3d.png');

    // 纹理
    const texture: Texture = {
        descriptor: {
            size: [image.width, image.height],
            format: 'rgba8unorm',
        },
        sources: [{ image, flipY: true }],
    };

    const sampler: Sampler = {
        minFilter: 'linear',
        magFilter: 'linear',
    };

    // 渲染管线
    const pipeline: RenderPipeline = {
        vertex: {
            wgsl: vertexWgsl,
        },
        fragment: {
            wgsl: fragmentWgsl,
        },
        primitive: { topology: 'triangle-list' },
    };

    // 渲染提交
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
                            pipeline,
                            bindingResources: {
                                diffuse: { texture, sampler } as any,
                                u_imageSize: { value: [image.width, image.height] },
                            },
                            draw: { __type__: 'DrawVertex', vertexCount: 4 },
                        }],
                    },
                ],
            },
        ],
    };

    // 执行渲染
    webgpu.submit(submit);
});
