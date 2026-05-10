import { RenderPassObject, RenderPipeline, Sampler, Submit, Texture, VertexAttributes } from '@feng3d/render-api';
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

// 视口角落枚举
const Corners = {
    TOP_LEFT: 0,
    TOP_RIGHT: 1,
    BOTTOM_RIGHT: 2,
    BOTTOM_LEFT: 3,
    MAX: 4,
};

document.addEventListener('DOMContentLoaded', async () =>
{
    // TSL 生成着色器代码
    const vertexGlsl = vertexShader.toGLSL(2);
    const fragmentGlsl = fragmentShader.toGLSL(2);
    const vertexWgsl = vertexShader.toWGSL();
    const fragmentWgsl = fragmentShader.toWGSL(vertexShader);

    // 初始化 WebGPU
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    initCanvasSize(canvas);
    const webgpu = await new WebGPU({ canvasId: 'canvas' }).init();

    // 计算视口
    const windowSize = {
        x: canvas.width,
        y: canvas.height,
    };

    const viewport: { x: number, y: number, width: number, height: number }[] = new Array(Corners.MAX);

    viewport[Corners.BOTTOM_LEFT] = {
        x: 0,
        y: 0,
        width: windowSize.x / 2,
        height: windowSize.y / 2,
    };

    viewport[Corners.BOTTOM_RIGHT] = {
        x: windowSize.x / 2,
        y: 0,
        width: windowSize.x / 2,
        height: windowSize.y / 2,
    };

    viewport[Corners.TOP_RIGHT] = {
        x: windowSize.x / 2,
        y: windowSize.y / 2,
        width: windowSize.x / 2,
        height: windowSize.y / 2,
    };

    viewport[Corners.TOP_LEFT] = {
        x: 0,
        y: windowSize.y / 2,
        width: windowSize.x / 2,
        height: windowSize.y / 2,
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

    // 初始化采样器 - 4 种不同的过滤配置
    const samplers: Sampler[] = [];

    // 左上角：NEAREST 过滤（最近邻，不使用 mipmap）
    samplers[Corners.TOP_LEFT] = {
        minFilter: 'nearest',
        magFilter: 'nearest',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
        addressModeW: 'clamp-to-edge',
    };

    // 右上角：LINEAR 过滤（线性，不使用 mipmap）
    samplers[Corners.TOP_RIGHT] = {
        minFilter: 'linear',
        magFilter: 'linear',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
        addressModeW: 'clamp-to-edge',
    };

    // 右下角：LINEAR + NEAREST_MIPMAP（线性 + 最近邻 Mipmap）
    samplers[Corners.BOTTOM_RIGHT] = {
        minFilter: 'linear',
        magFilter: 'linear',
        mipmapFilter: 'nearest',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
        addressModeW: 'clamp-to-edge',
    };

    // 左下角：LINEAR + LINEAR_MIPMAP（三线性过滤）
    samplers[Corners.BOTTOM_LEFT] = {
        minFilter: 'linear',
        magFilter: 'linear',
        mipmapFilter: 'linear',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
        addressModeW: 'clamp-to-edge',
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

        // MVP 矩阵（单位矩阵）
        const matrix = new Float32Array([
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
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

        // 创建 4 个渲染对象，每个使用不同的视口和采样器
        const renderObjects: RenderPassObject[] = [];
        for (let i = 0; i < Corners.MAX; ++i)
        {
            renderObjects.push({
                pipeline: program,
                vertices,
                viewport: viewport[i],
                bindingResources: {
                    mvp: { value: matrix },
                    diffuse: { texture, sampler: samplers[i] } as any,
                },
                draw: { __type__: 'DrawVertex', vertexCount: 6, instanceCount: 1 },
            });
        }

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
