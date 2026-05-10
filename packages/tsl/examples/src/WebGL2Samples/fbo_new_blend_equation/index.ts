import { RenderObject, RenderPass, RenderPassObject, RenderPipeline, Sampler, Texture, VertexAttributes, Viewport } from '@feng3d/render-api';
import { WebGPU } from '@feng3d/webgpu';

// 导入TSL着色器
import { fragmentShader, vertexShader } from './shaders/shader';

// 辅助函数：加载图像
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

// 辅助函数：初始化画布大小
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
    // 初始化 WebGPU
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    initCanvasSize(canvas);
    const webgpu = await new WebGPU({ canvasId: 'canvas' }).init();

    // 生成着色器代码
    const vertexGlsl = vertexShader.toGLSL(2);
    const fragmentGlsl = fragmentShader.toGLSL(2);
    const vertexWgsl = vertexShader.toWGSL();
    const fragmentWgsl = fragmentShader.toWGSL(vertexShader);

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

    // 窗口大小
    const windowSize = {
        x: canvas.width,
        y: canvas.height,
    };

    // 分割视口
    const viewports = new Array(Corners.MAX);

    viewports[Corners.BOTTOM_LEFT] = {
        x: 0,
        y: 0,
        width: windowSize.x / 2,
        height: windowSize.y / 2,
    };

    viewports[Corners.BOTTOM_RIGHT] = {
        x: windowSize.x / 2,
        y: 0,
        width: windowSize.x / 2,
        height: windowSize.y / 2,
    };

    viewports[Corners.TOP_RIGHT] = {
        x: windowSize.x / 2,
        y: windowSize.y / 2,
        width: windowSize.x / 2,
        height: windowSize.y / 2,
    };

    viewports[Corners.TOP_LEFT] = {
        x: 0,
        y: windowSize.y / 2,
        width: windowSize.x / 2,
        height: windowSize.y / 2,
    };

    // 加载纹理
    loadImage('./images/Di-3d.png', (image) =>
    {
        const texture: Texture = {
            descriptor: {
                size: [image.width, image.height],
                format: 'rgba8unorm',
                generateMipmap: true,
            },
            sources: [{ image, mipLevel: 0 }],
        };

        const sampler: Sampler = {
            minFilter: 'linear',
            magFilter: 'linear',
        };

        // MVP 矩阵（单位矩阵）
        const matrix = new Float32Array([
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0,
        ]);

        // 基础渲染对象
        const renderObject: RenderObject = {
            pipeline: program,
            bindingResources: { mvp: { value: matrix }, diffuse: { texture, sampler } as any },
            vertices,
            draw: { __type__: 'DrawVertex', vertexCount: 6 },
        };

        const renderObjects: RenderPassObject[] = [];

        for (let i = 0; i < Corners.MAX; ++i)
        {
            const viewport: Viewport = viewports[i];

            if (i === Corners.TOP_LEFT)
            {
                // 左上角：只显示背景，不渲染
                // pass
            }
            else if (i === Corners.TOP_RIGHT)
            {
                // 右上角：正常混合，显示原图
                renderObjects.push({
                    ...renderObject,
                    viewport,
                });
            }
            else if (i === Corners.BOTTOM_RIGHT)
            {
                // 右下角：MIN 混合
                renderObjects.push({
                    ...renderObject,
                    viewport,
                    pipeline: {
                        ...program,
                        fragment: {
                            ...program.fragment,
                            targets: [{
                                ...program.fragment!.targets![0],
                                blend: {
                                    ...program.fragment!.targets![0].blend,
                                    color: { ...program.fragment!.targets![0].blend!.color, operation: 'min' },
                                    alpha: { ...program.fragment!.targets![0].blend!.alpha, operation: 'min' },
                                },
                            }],
                        },
                    },
                });
            }
            else if (i === Corners.BOTTOM_LEFT)
            {
                // 左下角：MAX 混合
                renderObjects.push({
                    ...renderObject,
                    viewport,
                    pipeline: {
                        ...program,
                        fragment: {
                            ...program.fragment,
                            targets: [{
                                ...program.fragment!.targets![0],
                                blend: {
                                    ...program.fragment!.targets![0].blend,
                                    color: { ...program.fragment!.targets![0].blend!.color, operation: 'max' },
                                    alpha: { ...program.fragment!.targets![0].blend!.alpha, operation: 'max' },
                                },
                            }],
                        },
                    },
                });
            }
        }

        // 渲染通道
        const renderPass: RenderPass = {
            descriptor: {
                colorAttachments: [{
                    clearValue: [0.5, 0.0, 0.0, 1.0],
                    loadOp: 'clear',
                }],
            },
            renderPassObjects: renderObjects,
        };

        // 提交渲染命令
        const submit = {
            commandEncoders: [{
                passEncoders: [renderPass],
            }],
        };

        webgpu.submit(submit);
    });
});
