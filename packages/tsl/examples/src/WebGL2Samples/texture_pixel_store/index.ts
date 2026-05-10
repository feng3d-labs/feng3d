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
    const vertexWgsl = vertexShader.toWGSL({ convertDepth: true });
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
        texcoord: { data: texcoords, format: 'float32x2' },
    };

    // 加载纹理图像
    loadImage('./images/Di-3d.png', (img) =>
    {
        // 使用 canvas 获取图像的像素数据数组
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const pixels = new Uint8Array(imageData.data.buffer);

        // 创建纹理 - 仅存储图像的中间部分（1/4 区域）
        // 使用 dataLayout.width 指定原始图像宽度（像素行跨度）
        // 使用 dataImageOrigin 指定从图像的哪个位置开始读取
        const texture: Texture = {
            descriptor: {
                size: [img.width / 2, img.height / 2],
                format: 'rgba8unorm',
            },
            sources: [{
                __type__: 'TextureDataSource',
                mipLevel: 0,
                size: [img.width / 2, img.height / 2],
                data: pixels,
                dataLayout: { width: img.width },
                dataImageOrigin: [img.width / 4, img.height / 4],
            }],
        };

        // 采样器
        const sampler: Sampler = {
            minFilter: 'nearest',
            magFilter: 'nearest',
        };

        // MVP 矩阵（缩放 0.5）
        const matrix = new Float32Array([
            0.5, 0.0, 0.0, 0.0,
            0.0, 0.5, 0.0, 0.0,
            0.0, 0.0, 0.5, 0.0,
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
                                    MVP: { value: matrix },
                                    diffuse: { texture, sampler } as any,
                                },
                                draw: { __type__: 'DrawVertex', vertexCount: 6 },
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

