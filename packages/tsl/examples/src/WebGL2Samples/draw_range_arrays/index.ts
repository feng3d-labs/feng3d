import { RenderObject, RenderPipeline, Submit, VertexAttributes } from '@feng3d/render-api';
import { WebGPU } from '@feng3d/webgpu';

import { fragmentShader, vertexShader } from './shaders/shader';

// 辅助函数：初始化画布大小
function initCanvasSize(canvas: HTMLCanvasElement)
{
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
}

document.addEventListener('DOMContentLoaded', async () =>
{
    // 初始化WebGPU
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    initCanvasSize(canvas);
    const webgpu = await new WebGPU({ canvasId: 'canvas' }).init();

    // 使用 TSL 生成着色器代码
    const vertexWgsl = vertexShader.toWGSL();
    const fragmentWgsl = fragmentShader.toWGSL(vertexShader);

    // 顶点数据（四个矩形，分别在不同位置）
    const positions = new Float32Array([
        // 第一个矩形（左上）
        -0.8, 0.2,
        -0.6, 0.2,
        -0.6, 0.4,
        -0.8, 0.4,
        // 第二个矩形（右上）
        0.6, 0.2,
        0.8, 0.2,
        0.8, 0.4,
        0.6, 0.4,
        // 第三个矩形（左下）
        -0.8, -0.4,
        -0.6, -0.4,
        -0.6, -0.2,
        -0.8, -0.2,
        // 第四个矩形（右下）
        0.6, -0.4,
        0.8, -0.4,
        0.8, -0.2,
        0.6, -0.2,
    ]);

    const vertices: VertexAttributes = {
        position: { data: positions, format: 'float32x2' },
    };

    // 索引数据（每个矩形使用相同的索引模式）
    const indices = new Uint16Array([
        0, 1, 2, 3,  // 第一个矩形
    ]);

    // 渲染管线
    const pipeline: RenderPipeline = {
        vertex: {
            wgsl: vertexWgsl,
        },
        fragment: {
            wgsl: fragmentWgsl,
        },
        primitive: { topology: 'triangle-strip' },
    };

    // 创建四个渲染对象，每个绘制不同的矩形
    const renderObjects: RenderObject[] = [];
    for (let i = 0; i < 4; i++)
    {
        renderObjects.push({
            pipeline,
            vertices,
            draw: {
                __type__: 'DrawIndexed',
                indexCount: 4,
            } as any,
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
