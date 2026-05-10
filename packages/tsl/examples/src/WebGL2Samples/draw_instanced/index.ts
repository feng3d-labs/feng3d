import { RenderObject, RenderPipeline, Submit, VertexAttributes } from '@feng3d/render-api';
import { WebGPU } from '@feng3d/webgpu';

import { vertexShader, fragmentShader } from './shaders/shader';

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

    // 顶点数据
    const positions = new Float32Array([
        -0.3, -0.3,
        0.3, -0.3,
        0.3, 0.3,
        0.3, 0.3,
        -0.3, 0.3,
        -0.3, -0.3,
    ]);

    // 两种颜色（红色和蓝色）
    const colors = new Float32Array([
        1.0, 0.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
    ]);

    const vertices: VertexAttributes = {
        pos: { data: positions, format: 'float32x2' },
        color: { data: colors, format: 'float32x4', stepMode: 'instance' },
    };

    // 渲染管线
    const pipeline: RenderPipeline = {
        vertex: {
            wgsl: vertexWgsl,
        },
        fragment: {
            wgsl: fragmentWgsl,
        },
        primitive: { topology: 'triangle-list' },
    };

    // 渲染对象（2个实例）
    const renderObject: RenderObject = {
        pipeline,
        vertices,
        draw: { __type__: 'DrawVertex', vertexCount: 6, instanceCount: 2 },
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
                        renderPassObjects: [renderObject],
                    },
                ],
            },
        ],
    };

    // 执行渲染
    webgpu.submit(submit);
});
