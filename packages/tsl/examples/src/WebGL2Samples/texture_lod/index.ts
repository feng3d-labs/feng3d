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
    const vertexWgsl = vertexShader.toWGSL({ convertDepth: true });
    const fragmentWgsl = fragmentShader.toWGSL(vertexShader);

    // 初始化 WebGPU
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    initCanvasSize(canvas);
    const webgpu = await new WebGPU({ canvasId: 'canvas' }).init();

    // 鼠标交互控制缩放
    let scale = 1.0;
    let mouseDown = false;
    let lastMouseY = 0;

    window.onmousedown = function (event)
    {
        mouseDown = true;
        lastMouseY = event.clientY;
    };
    window.onmouseup = function ()
    {
        mouseDown = false;
    };
    window.onmousemove = function (event)
    {
        if (!mouseDown)
        {
            return;
        }
        const newY = event.clientY;
        const deltaY = newY - lastMouseY;
        scale += deltaY / 100;
        lastMouseY = newY;
    };

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

    // 初始化采样器 - 4 种不同的 LOD 配置
    const samplers: Sampler[] = [];
    const textures: Texture[] = [];

    // 加载纹理图像
    loadImage('./images/Di-3d.png', (img) =>
    {
        // 左上角：默认 LOD（lodMinClamp: 0, lodMaxClamp: 无限）
        textures[Corners.TOP_LEFT] = {
            descriptor: {
                size: [img.width, img.height],
                format: 'rgba8unorm',
                generateMipmap: true,
            },
            sources: [{ image: img, mipLevel: 0 }],
        };
        samplers[Corners.TOP_LEFT] = {
            minFilter: 'linear',
            magFilter: 'linear',
            mipmapFilter: 'linear',
        };

        // 右上角：LOD 固定为 3.0（lodMinClamp: 3, lodMaxClamp: 3）
        textures[Corners.TOP_RIGHT] = {
            descriptor: {
                size: [img.width, img.height],
                format: 'rgba8unorm',
                generateMipmap: true,
            },
            sources: [{ image: img, mipLevel: 0 }],
        };
        samplers[Corners.TOP_RIGHT] = {
            minFilter: 'linear',
            magFilter: 'linear',
            mipmapFilter: 'linear',
            lodMinClamp: 3.0,
            lodMaxClamp: 3.0,
        };

        // 左下角：LOD bias = 3.5
        textures[Corners.BOTTOM_LEFT] = {
            descriptor: {
                size: [img.width, img.height],
                format: 'rgba8unorm',
                generateMipmap: true,
            },
            sources: [{ image: img, mipLevel: 0 }],
        };
        samplers[Corners.BOTTOM_LEFT] = {
            minFilter: 'linear',
            magFilter: 'linear',
            mipmapFilter: 'linear',
            lodMinClamp: 0.0,
            lodMaxClamp: 10.0,
        };

        // 右下角：LOD bias = 4.0
        textures[Corners.BOTTOM_RIGHT] = {
            descriptor: {
                size: [img.width, img.height],
                format: 'rgba8unorm',
                generateMipmap: true,
            },
            sources: [{ image: img, mipLevel: 0 }],
        };
        samplers[Corners.BOTTOM_RIGHT] = {
            minFilter: 'linear',
            magFilter: 'linear',
            mipmapFilter: 'linear',
            lodMinClamp: 0.0,
            lodMaxClamp: 10.0,
        };

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

        // LOD bias 数组
        const lodBiasArray = [0.0, 0.0, 3.5, 4.0];

        function render()
        {
            // MVP 矩阵（缩放）
            const matrix = new Float32Array([
                scale, 0.0, 0.0, 0.0,
                0.0, scale, 0.0, 0.0,
                0.0, 0.0, scale, 0.0,
                0.0, 0.0, 0.0, 1.0,
            ]);

            // 创建 4 个渲染对象，每个使用不同的视口和 LOD 配置
            const renderObjects: RenderPassObject[] = [];
            for (let i = 0; i < Corners.MAX; ++i)
            {
                renderObjects.push({
                    pipeline: program,
                    vertices,
                    viewport: viewport[i],
                    bindingResources: {
                        mvp: { value: matrix },
                        lodBias: { value: lodBiasArray[i] },
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

            requestAnimationFrame(render);
        }

        render();
    });
});

