/**
 * glsl_non_square_matrix 示例
 *
 * 演示使用 mat4x3 非方阵矩阵存储 MVP 变换。
 *
 * mat4x3 是 4 列 3 行的矩阵：
 * - mat4x3 * vec4 -> vec3（降维变换）
 * - MVP[3] 访问第四列（平移向量）
 * - 平移通过单独添加矩阵的第四列实现
 *
 * 此示例使用 WebGPU 渲染。
 */

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

    // 加载图像
    loadImage('./images/Di-3d.png', (img) =>
    {
        // 顶点数据：vec2 Position, vec2 Texcoord
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

        // 顶点数组
        const vertexArray: { vertices?: VertexAttributes } = {
            vertices: {
                position: { data: positions, format: 'float32x2' },
                texcoord: { data: texCoords, format: 'float32x2' },
            },
        };

        // 创建纹理资源
        const texture: Texture = {
            descriptor: {
                size: [img.width, img.height],
                format: 'rgba8unorm',
            },
            sources: [{ image: img, flipY: false }],
        };

        // 创建采样器
        const sampler: Sampler = {
            minFilter: 'nearest',
            magFilter: 'nearest',
        };

        // 渲染管线
        const program: RenderPipeline = {
            vertex: {
                wgsl: vertexWgsl,
            },
            fragment: {
                wgsl: fragmentWgsl,
            },
            primitive: { topology: 'triangle-list' },
        };

        // mat4x3 矩阵（4列3行，列主序，紧凑格式）
        // WebGPU 会自动将紧凑格式（12 float）转换为对齐格式（16 float）
        // 列 0: [0.5, 0.0, 0.0] - X 轴缩放
        // 列 1: [0.0, 0.5, 0.0] - Y 轴缩放
        // 列 2: [0.0, 0.0, 0.5] - Z 轴缩放
        // 列 3: [0.2, -0.2, 0.0] - 平移
        const matrix = new Float32Array([
            0.5, 0.0, 0.0,  // 列 0
            0.0, 0.5, 0.0,  // 列 1
            0.0, 0.0, 0.5,  // 列 2
            0.2, -0.2, 0.0, // 列 3（平移）
        ]);

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
                                vertices: vertexArray.vertices,
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
