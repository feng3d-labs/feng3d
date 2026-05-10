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

    // 顶点数据
    const positions = new Float32Array([
        -0.5, -0.5,
        0.5, -0.5,
        0.5, 0.5,
        0.5, 0.5,
        -0.5, 0.5,
        -0.5, -0.5,
    ]);

    const normals = new Float32Array([
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
    ]);

    const colors = new Float32Array([
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
    ]);

    const vertices: VertexAttributes = {
        position: { data: positions, format: 'float32x2' },
        normal: { data: normals, format: 'float32x3' },
        color: { data: colors, format: 'float32x4' },
    };

    // MVP 矩阵（单位矩阵）
    const mvp = new Float32Array([
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0,
    ]);

    // 法线矩阵（单位矩阵）
    const mnormal = new Float32Array([
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0,
    ]);

    // MV 矩阵（单位矩阵）
    const mv = new Float32Array([
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0,
    ]);

    // 材质参数
    const ambient = new Float32Array([0.2, 0.2, 0.2]);
    const diffuse = new Float32Array([0.8, 0.8, 0.8]);
    const specular = new Float32Array([0.5, 0.5, 0.5]);
    const shininess = 32.0;

    // 光源位置
    const lightPosition = new Float32Array([0.0, 0.0, 1.0]);

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

    // 渲染对象
    const renderObject: RenderObject = {
        pipeline,
        bindingResources: {
            perDraw: {
                transform: {
                    P: { value: mvp },
                    MV: { value: mv },
                    Mnormal: { value: mnormal },
                },
            } as any,
            perScene: {
                material: {
                    ambient: { value: ambient },
                    diffuse: { value: diffuse },
                    specular: { value: specular },
                    shininess: { value: shininess },
                },
            } as any,
            perPass: {
                light: {
                    position: { value: lightPosition },
                },
            } as any,
        },
        vertices,
        draw: { __type__: 'DrawVertex', vertexCount: 6 },
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
