import { RenderObject, RenderPass, RenderPassObject, RenderPipeline, Sampler, Submit, Texture, VertexAttributes } from '@feng3d/render-api';
import { WebGPU } from '@feng3d/webgpu';
import { snoise } from './third-party/noise3D';

// 导入 TSL 着色器
import { fragmentShader, fragmentShader3D, vertexShader, vertexShader3D } from './shaders/shader';

/**
 * 初始化画布尺寸
 */
function initCanvasSize(canvas: HTMLCanvasElement): void
{
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
}

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
 * 创建 3D 纹理数据（使用 simplex noise）
 */
function create3DTexture(): { texture3D: Texture, sampler3D: Sampler }
{
    // Note By @kenrussel: The sample was changed from R32F to R8 for best portability.
    // not all devices can render to floating-point textures
    // (and, further, this functionality is in a WebGL extension: EXT_color_buffer_float),
    // and renderability is a requirement for generating mipmaps.

    const SIZE = 32;
    const data = new Uint8Array(SIZE * SIZE * SIZE);
    for (let k = 0; k < SIZE; ++k)
    {
        for (let j = 0; j < SIZE; ++j)
        {
            for (let i = 0; i < SIZE; ++i)
            {
                data[i + j * SIZE + k * SIZE * SIZE] = snoise([i, j, k]) * 256;
            }
        }
    }

    const texture3D: Texture = {
        descriptor: {
            dimension: '3d',
            format: 'r8unorm',
            generateMipmap: true,
            mipLevelCount: Math.log2(SIZE),
            size: [SIZE, SIZE, SIZE],
        },
        sources: [{ __type__: 'TextureDataSource', size: [SIZE, SIZE, SIZE], data }],
    };
    const sampler3D: Sampler = {
        lodMinClamp: 0,
        lodMaxClamp: Math.log2(SIZE),
        minFilter: 'linear',
        magFilter: 'linear',
        mipmapFilter: 'linear',
    };

    return { texture3D, sampler3D };
}

// 视口枚举
const Corners = {
    LEFT: 0,
    RIGHT: 1,
    MAX: 2,
};

document.addEventListener('DOMContentLoaded', async () =>
{
    // TSL 生成着色器代码（变量名与导入的相同，便于调试切换）
    const vertexGlsl = vertexShader.toGLSL(2);
    const fragmentGlsl = fragmentShader.toGLSL(2);
    const vertexWgsl = vertexShader.toWGSL({ convertDepth: true });
    const fragmentWgsl = fragmentShader.toWGSL(vertexShader);

    const vertex3DGlsl = vertexShader3D.toGLSL(2);
    const fragment3DGlsl = fragmentShader3D.toGLSL(2);
    const vertex3DWgsl = vertexShader3D.toWGSL({ convertDepth: true });
    const fragment3DWgsl = fragmentShader3D.toWGSL(vertexShader3D);

    // 初始化 WebGPU
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    initCanvasSize(canvas);
    const webgpu = await new WebGPU({ canvasId: 'canvas' }).init();

    // 计算视口
    const windowSize = {
        x: canvas.width,
        y: canvas.height,
    };

    const viewports: { x: number, y: number, width: number, height: number }[] = new Array(Corners.MAX);

    viewports[Corners.LEFT] = {
        x: 0,
        y: windowSize.y / 4,
        width: windowSize.x / 2,
        height: windowSize.y / 2,
    };

    viewports[Corners.RIGHT] = {
        x: windowSize.x / 2,
        y: windowSize.y / 4,
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

    const texCoords = new Float32Array([
        0.0, 1.0,
        1.0, 1.0,
        1.0, 0.0,
        1.0, 0.0,
        0.0, 0.0,
        0.0, 1.0,
    ]);

    // 顶点属性 - 2D 纹理使用
    const vertices: VertexAttributes = {
        position: { data: positions, format: 'float32x2' },
        texcoord: { data: texCoords, format: 'float32x2' },
    };

    // 顶点属性 - 3D 纹理使用
    const vertices3D: VertexAttributes = {
        position: { data: positions, format: 'float32x2' },
        in_texcoord: { data: texCoords, format: 'float32x2' },
    };

    // 2D 纹理渲染管线
    const program: RenderPipeline = {
        vertex: {
            wgsl: vertexWgsl,
        },
        fragment: {
            wgsl: fragmentWgsl,
        },
        primitive: { topology: 'triangle-list' },
    };

    // 3D 纹理渲染管线
    const program3D: RenderPipeline = {
        vertex: {
            wgsl: vertex3DWgsl,
        },
        fragment: {
            wgsl: fragment3DWgsl,
        },
        primitive: { topology: 'triangle-list' },
    };

    // 创建 3D 纹理
    const { texture3D, sampler3D } = create3DTexture();

    // MVP 矩阵（单位矩阵）
    const matrix = new Float32Array([
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0,
    ]);

    // 加载 2D 纹理图像
    loadImage('./images/Di-3d.png', (image) =>
    {
        // 创建 2D 纹理
        const texture2D: Texture = {
            descriptor: {
                format: 'rgba8unorm',
                mipLevelCount: 1,
                size: [512, 512],
            },
            sources: [{
                image, flipY: false,
            }],
        };
        const sampler2D: Sampler = {
            minFilter: 'nearest',
            magFilter: 'linear',
            addressModeU: 'clamp-to-edge',
            addressModeV: 'clamp-to-edge',
        };

        // 基础渲染对象 - 2D 纹理
        const ro2D: RenderObject = {
            pipeline: program,
            bindingResources: {
                MVP: { value: matrix },
                diffuse: { texture: texture2D, sampler: sampler2D } as any,
            },
            vertices,
            draw: { __type__: 'DrawVertex', vertexCount: 6 },
        };

        // 基础渲染对象 - 3D 纹理
        const ro3D: RenderObject = {
            pipeline: program3D,
            bindingResources: {
                diffuse: { texture: texture3D, sampler: sampler3D } as any,
            },
            vertices: vertices3D,
            draw: { __type__: 'DrawVertex', vertexCount: 6 },
        };

        // 渲染对象列表
        const renderObjects: RenderPassObject[] = [
            // 左侧视口：2D 纹理
            {
                ...ro2D,
                viewport: viewports[Corners.LEFT],
            },
            // 右侧视口：3D 纹理
            {
                ...ro3D,
                viewport: viewports[Corners.RIGHT],
            },
        ];

        // 渲染通道
        const rp: RenderPass = {
            descriptor: {
                colorAttachments: [{
                    clearValue: [0.0, 0.0, 0.0, 1.0],
                    loadOp: 'clear',
                }],
            },
            renderPassObjects: renderObjects,
        };

        // 提交对象
        const submit: Submit = {
            commandEncoders: [{ passEncoders: [rp] }],
        };

        // 执行渲染
        webgpu.submit(submit);
    });
});

