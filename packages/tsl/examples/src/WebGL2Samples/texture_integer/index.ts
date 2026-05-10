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

    const texCoords = new Float32Array([
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
        texcoord: { data: texCoords, format: 'float32x2' },
    };

    // 加载纹理图像
    loadImage('./images/Di-3d.png', (image) =>
    {
        // 创建整数纹理（rgba8uint）
        const texture: Texture = {
            descriptor: {
                size: [image.width, image.height],
                format: 'rgba8uint',
            },
            sources: [{
                mipLevel: 0, image, flipY: false,
            }],
        };

        // 创建采样器（整数纹理只支持 nearest 过滤）
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

