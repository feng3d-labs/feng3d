import { RenderPipeline, Sampler, Submit, Texture, VertexAttributes } from '@feng3d/render-api';
import { WebGPU } from '@feng3d/webgpu';

import { fragmentShader, vertexShader } from './shaders/shader';

/**
 * 加载图像
 */
function loadImage(url: string, onload: (img: HTMLImageElement) => void): HTMLImageElement
{
    const img = new Image();
    img.onload = function ()
    {
        onload(img);
    };
    img.src = url;

    return img;
}

/**
 * 初始化画布尺寸
 */
function initCanvasSize(canvas: HTMLCanvasElement)
{
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
}

document.addEventListener('DOMContentLoaded', async () =>
{
    // TSL 生成着色器代码
    const vertexWgsl = vertexShader.toWGSL();
    const fragmentWgsl = fragmentShader.toWGSL(vertexShader);

    // 初始化 WebGPU
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    initCanvasSize(canvas);
    const webgpu = await new WebGPU({ canvasId: 'canvas' }).init();

    // 顶点数据
    const positions = new Float32Array([
        -1.0, -1.0,
        1.0, -1.0,
        1.0, 1.0,
        1.0, 1.0,
        -1.0, 1.0,
        -1.0, -1.0,
    ]);

    const texcoords = new Float32Array([
        0.0, 1.0,
        1.0, 1.0,
        1.0, 0.0,
        1.0, 0.0,
        0.0, 0.0,
        0.0, 1.0,
    ]);

    // 顶点属性
    const vertices: VertexAttributes = {
        position: { data: positions, format: 'float32x2' },
        textureCoordinates: { data: texcoords, format: 'float32x2' },
    };

    // 采样器 A：Nearest 过滤
    const samplerA: Sampler = {
        minFilter: 'nearest',
        magFilter: 'nearest',
        mipmapFilter: 'nearest',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
        addressModeW: 'clamp-to-edge',
        lodMinClamp: -1000.0,
        lodMaxClamp: 1000.0,
    };

    // 采样器 B：Linear 过滤
    const samplerB: Sampler = {
        minFilter: 'linear',
        magFilter: 'linear',
        mipmapFilter: 'linear',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
        addressModeW: 'clamp-to-edge',
        lodMinClamp: -1000.0,
        lodMaxClamp: 1000.0,
    };

    // 加载纹理图像
    loadImage('./images/Di-3d.png', (img) =>
    {
        const texture: Texture = {
            descriptor: {
                size: [img.width, img.height],
                format: 'rgba8unorm',
                generateMipmap: true,
            },
            sources: [{ image: img, mipLevel: 0 }],
        };

        // MVP 矩阵（缩放 0.8）
        const matrix = new Float32Array([
            0.8, 0.0, 0.0, 0.0,
            0.0, 0.8, 0.0, 0.0,
            0.0, 0.0, 0.8, 0.0,
            0.0, 0.0, 0.0, 1.0,
        ]);

        // 渲染管线
        const program: RenderPipeline = {
            vertex: {
                wgsl: vertexWgsl,
            },
            fragment: {
                wgsl: fragmentWgsl,
                targets: [{ blend: {} }],
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
                                pipeline: program,
                                vertices,
                                bindingResources: {
                                    mvp: { value: matrix },
                                    materialDiffuse0: { texture, sampler: samplerA } as any,
                                    materialDiffuse1: { texture, sampler: samplerB } as any,
                                },
                                draw: { __type__: 'DrawVertex', vertexCount: 6, instanceCount: 1 },
                            }],
                        },
                    ],
                },
            ],
        };

        // 执行渲染
        webgpu.submit(submit);
    });
});
