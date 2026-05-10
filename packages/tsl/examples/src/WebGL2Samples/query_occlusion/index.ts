import { OcclusionQuery, RenderObject, RenderPass, RenderPipeline, Submit, VertexAttributes } from '@feng3d/render-api';
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

    // 前景三角形（遮挡物）- 深度较小（更靠近观察者）
    const foregroundPositions = new Float32Array([
        -0.3, 0.0, 0.5,
        0.3, 0.0, 0.5,
        0.0, 0.5, 0.5,
    ]);

    // 背景三角形（被遮挡）- 深度较大（远离观察者）
    const backgroundPositions = new Float32Array([
        -0.2, -0.3, 0.8,
        0.2, -0.3, 0.8,
        0.0, 0.0, 0.8,
    ]);

    const foregroundVertices: VertexAttributes = {
        pos: { data: foregroundPositions, format: 'float32x3' },
    };

    const backgroundVertices: VertexAttributes = {
        pos: { data: backgroundPositions, format: 'float32x3' },
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
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less',
        },
    };

    // 遮挡查询
    const occlusionQuery: OcclusionQuery = {
        __type__: 'OcclusionQuery',
        renderObjects: [],
    } as any;

    // 前景渲染对象（遮挡物）
    const foregroundRenderObject: RenderObject = {
        pipeline,
        vertices: foregroundVertices,
        draw: { __type__: 'DrawVertex', vertexCount: 3 },
    };

    // 背景渲染对象（被遮挡）- 添加遮挡查询
    const backgroundRenderObject: RenderObject = {
        pipeline,
        vertices: backgroundVertices,
        draw: { __type__: 'DrawVertex', vertexCount: 3 },
        occlusionQuery,
    } as any;

    // 渲染通道
    const renderPass: RenderPass = {
        descriptor: {
            colorAttachments: [{
                clearValue: [0.0, 0.0, 0.0, 1.0],
                loadOp: 'clear',
            }],
            depthStencilAttachment: {
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
            } as any,
        },
        renderPassObjects: [foregroundRenderObject, backgroundRenderObject],
    };

    // 渲染提交
    const submit: Submit = {
        commandEncoders: [
            {
                passEncoders: [renderPass],
            },
        ],
    };

    // 执行渲染
    webgpu.submit(submit);

    // 注意：遮挡查询结果的读取需要在渲染后异步进行
    // WebGPU 的遮挡查询结果需要通过 GPU 缓冲区读取
});
