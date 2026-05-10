import { RenderPassObject, RenderPipeline, Sampler, Submit, Texture, VertexAttributes } from '@feng3d/render-api';
import { WebGPU } from '@feng3d/webgpu';

import { fragmentShaderBicubic, fragmentShaderOffset, vertexShader } from './shaders/shader';

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

// 视口枚举
const Corners = {
    LEFT: 0,
    RIGHT: 1,
    MAX: 2,
};

document.addEventListener('DOMContentLoaded', async () =>
{
    // TSL 生成着色器代码

    const vertexWgsl = vertexShader.toWGSL({ convertDepth: true });
    const fragmentOffsetWgsl = fragmentShaderOffset.toWGSL(vertexShader);
    const fragmentBicubicWgsl = fragmentShaderBicubic.toWGSL(vertexShader);

    // 初始化 WebGPU
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    initCanvasSize(canvas);
    const webgpu = await new WebGPU({ canvasId: 'canvas' }).init();

    // 计算视口
    const viewports: { x: number, y: number, width: number, height: number }[] = [];

    viewports[Corners.LEFT] = {
        x: 0,
        y: 0,
        width: canvas.width / 2,
        height: canvas.height,
    };

    viewports[Corners.RIGHT] = {
        x: canvas.width / 2,
        y: 0,
        width: canvas.width / 2,
        height: canvas.height,
    };

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
    loadImage('./images/Di-3d.png', (img) =>
    {
        // 创建纹理
        const texture: Texture = {
            descriptor: {
                size: [img.width, img.height],
                format: 'rgba8unorm',
            },
            sources: [{ image: img, mipLevel: 0, flipY: false }],
        };

        // 创建采样器
        const sampler: Sampler = {
            minFilter: 'nearest',
            magFilter: 'nearest',
            addressModeU: 'clamp-to-edge',
            addressModeV: 'clamp-to-edge',
        };

        // MVP 矩阵（单位矩阵）
        const matrix = new Float32Array([
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0,
        ]);

        // 偏移量
        const offset = new Int32Array([100, -80]);

        // 带偏移的着色器程序
        const programOffset: RenderPipeline = {
            vertex: {
                wgsl: vertexWgsl,
            },
            fragment: {
                wgsl: fragmentOffsetWgsl,
                targets: [{ blend: {} }],
            },
            primitive: { topology: 'triangle-list' },
        };

        // 无偏移的着色器程序（使用 texelFetchOffset）
        const programBicubic: RenderPipeline = {
            vertex: {
                wgsl: vertexWgsl,
            },
            fragment: {
                wgsl: fragmentBicubicWgsl,
                targets: [{ blend: {} }],
            },
            primitive: { topology: 'triangle-list' },
        };

        // 创建渲染对象
        const renderObjects: RenderPassObject[] = [];

        // 左侧：带偏移
        renderObjects.push({
            pipeline: programOffset,
            vertices,
            viewport: viewports[Corners.LEFT],
            bindingResources: {
                MVP: { value: matrix },
                diffuse: { texture, sampler } as any,
                offset: { value: offset },
            },
            draw: { __type__: 'DrawVertex', vertexCount: 6, instanceCount: 1 },
        });

        // 右侧：无偏移
        renderObjects.push({
            pipeline: programBicubic,
            vertices,
            viewport: viewports[Corners.RIGHT],
            bindingResources: {
                MVP: { value: matrix },
                diffuse: { texture, sampler } as any,
            },
            draw: { __type__: 'DrawVertex', vertexCount: 6, instanceCount: 1 },
        });

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
                            renderPassObjects: renderObjects,
                        },
                    ],
                },
            ],
        };

        // 执行渲染
        webgpu.submit(submit);
    });
});

