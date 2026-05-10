import { RenderPassObject, RenderPipeline, Sampler, Submit, Texture, TextureFormat, VertexAttributes } from '@feng3d/render-api';
import { WebGPU } from '@feng3d/webgpu';

import { fragmentShaderNormalized, fragmentShaderUint, vertexShader } from './shaders/shader';

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

// 视口索引枚举
const Views = {
    BOTTOM_LEFT: 0,
    BOTTOM_CENTER: 1,
    BOTTOM_RIGHT: 2,
    MIDDLE_LEFT: 3,
    MIDDLE_CENTER: 4,
    MIDDLE_RIGHT: 5,
    TOP_LEFT: 6,
    TOP_CENTER: 7,
    TOP_RIGHT: 8,
    MAX: 9,
};

// 纹理类型枚举
const TextureTypes = {
    RGB: 0,
    RGB8: 1,
    RGBA: 2,
    RGB16F: 3,
    RGBA32F: 4,
    R16F: 5,
    RG16F: 6,
    RGB8UI: 7,
    RGBA8UI: 8,
    MAX: 9,
};

document.addEventListener('DOMContentLoaded', async () =>
{
    // TSL 生成着色器代码
    const vertexWgsl = vertexShader.toWGSL();
    const fragmentNormalizedWgsl = fragmentShaderNormalized.toWGSL(vertexShader);
    const fragmentUintWgsl = fragmentShaderUint.toWGSL(vertexShader);

    // 初始化 WebGPU
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    initCanvasSize(canvas);
    const webgpu = await new WebGPU({ canvasId: 'canvas' }).init();

    // 计算视口
    const windowSize = {
        x: canvas.width,
        y: canvas.height,
    };

    const viewport: { x: number, y: number, width: number, height: number }[] = new Array(Views.MAX);

    for (let i = 0; i < Views.MAX; ++i)
    {
        const row = Math.floor(i / 3);
        const col = i % 3;
        viewport[i] = {
            x: windowSize.x * col / 3.0,
            y: windowSize.y * row / 3.0,
            width: windowSize.x / 3.0,
            height: windowSize.y / 3.0,
        };
    }

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
        // 纹理格式配置
        const textureFormats: { format: TextureFormat }[] = new Array(TextureTypes.MAX);

        textureFormats[TextureTypes.RGB] = { format: 'rgba8unorm' };
        textureFormats[TextureTypes.RGB8] = { format: 'rgba8unorm' };
        textureFormats[TextureTypes.RGBA] = { format: 'rgba8unorm' };
        textureFormats[TextureTypes.RGB16F] = { format: 'rgba16float' };
        textureFormats[TextureTypes.RGBA32F] = { format: 'rgba32float' };
        textureFormats[TextureTypes.R16F] = { format: 'r16float' };
        textureFormats[TextureTypes.RG16F] = { format: 'rg16float' };
        textureFormats[TextureTypes.RGB8UI] = { format: 'rgba8uint' };
        textureFormats[TextureTypes.RGBA8UI] = { format: 'rgba8uint' };

        // 创建纹理和采样器
        const textures: Texture[] = new Array(TextureTypes.MAX);
        const samplers: Sampler[] = new Array(TextureTypes.MAX);

        for (let i = 0; i < TextureTypes.MAX; ++i)
        {
            textures[i] = {
                descriptor: {
                    size: [img.width, img.height],
                    format: textureFormats[i].format,
                },
                sources: [{
                    mipLevel: 0, image: img, flipY: false,
                }],
            };
            samplers[i] = {
                minFilter: 'nearest',
                magFilter: 'nearest',
                lodMinClamp: 0,
                lodMaxClamp: 0,
            };
        }

        // MVP 矩阵（单位矩阵）
        const matrix = new Float32Array([
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0,
        ]);

        // 渲染管线 - 普通纹理
        const programNormalized: RenderPipeline = {
            vertex: {
                wgsl: vertexWgsl,
            },
            fragment: {
                wgsl: fragmentNormalizedWgsl,
                targets: [{ blend: {} }],
            },
            primitive: { topology: 'triangle-list' },
        };

        // 渲染管线 - 无符号整数纹理
        const programUint: RenderPipeline = {
            vertex: {
                wgsl: vertexWgsl,
            },
            fragment: {
                wgsl: fragmentUintWgsl,
                targets: [{ blend: {} }],
            },
            primitive: { topology: 'triangle-list' },
        };

        // 创建渲染对象
        const renderObjects: RenderPassObject[] = [];

        // 前 7 个视口使用普通纹理采样器
        for (let i = 0; i < TextureTypes.RGB8UI; ++i)
        {
            renderObjects.push({
                pipeline: programNormalized,
                vertices,
                viewport: viewport[i],
                bindingResources: {
                    MVP: { value: matrix },
                    diffuse: { texture: textures[i], sampler: samplers[i] } as any,
                },
                draw: { __type__: 'DrawVertex', vertexCount: 6, instanceCount: 1 },
            });
        }

        // 后 2 个视口使用无符号整数纹理采样器
        for (let i = TextureTypes.RGB8UI; i < TextureTypes.MAX; ++i)
        {
            renderObjects.push({
                pipeline: programUint,
                vertices,
                viewport: viewport[i],
                bindingResources: {
                    MVP: { value: matrix },
                    diffuse: { texture: textures[i], sampler: samplers[i] } as any,
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

