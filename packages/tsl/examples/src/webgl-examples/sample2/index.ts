import { RenderPassDescriptor, Submit } from '@feng3d/render-api';
import { WebGPU } from '@feng3d/webgpu';
import { mat4 } from 'gl-matrix';

import { vertexShader, fragmentShader } from './shaders/shader';

document.addEventListener('DOMContentLoaded', async () =>
{
    // 使用 TSL 生成着色器代码
    const vertexWgsl = vertexShader.toWGSL();
    const fragmentWgsl = fragmentShader.toWGSL();

    const devicePixelRatio = window.devicePixelRatio || 1;

    // 初始化 WebGPU
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    const webgpu = await new WebGPU(
        { canvasId: 'canvas' },
    ).init();

    // 创建投影矩阵和模型视图矩阵
    const { projectionMatrix, modelViewMatrix } = createMatrices(canvas);

    // 创建提交对象
    const submit: Submit = {
        commandEncoders: [
            {
                passEncoders: [
                    {
                        descriptor: {
                            colorAttachments: [{
                                clearValue: [0, 0, 0, 1],
                                loadOp: 'clear',
                            }],
                            depthStencilAttachment: {
                                depthClearValue: 1.0,
                                depthLoadOp: 'clear',
                                depthStoreOp: 'store',
                            },
                        },
                        renderPassObjects: [
                            {
                                pipeline: {
                                    vertex: {
                                        wgsl: vertexWgsl,
                                    },
                                    fragment: {
                                        wgsl: fragmentWgsl,
                                    },
                                    primitive: { topology: 'triangle-strip' },
                                    depthStencil: { depthCompare: 'less-equal' },
                                },
                                vertices: {
                                    aVertexPosition: {
                                        format: 'float32x2',
                                        data: new Float32Array([
                                            1.0, 1.0,
                                            -1.0, 1.0,
                                            1.0, -1.0,
                                            -1.0, -1.0,
                                        ]),
                                    },
                                },
                                draw: { __type__: 'DrawVertex', firstVertex: 0, vertexCount: 4 },
                                bindingResources: {
                                    uProjectionMatrix: { value: projectionMatrix as Float32Array },
                                    uModelViewMatrix: { value: modelViewMatrix as Float32Array },
                                },
                            },
                        ],
                    },
                ],
            },
        ],
    };

    // 提交渲染命令
    webgpu.submit(submit);
});

/**
 * 创建投影矩阵和模型视图矩阵
 */
function createMatrices(canvas: HTMLCanvasElement)
{
    // 创建透视投影矩阵
    const fieldOfView = 45 * Math.PI / 180; // 弧度
    const aspect = canvas.clientWidth / canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    mat4.perspective(projectionMatrix,
        fieldOfView,
        aspect,
        zNear,
        zFar);

    // 创建模型视图矩阵
    const modelViewMatrix = mat4.create();

    // 将绘制位置移动到场景中心
    mat4.translate(modelViewMatrix,
        modelViewMatrix,
        [-0.0, 0.0, -6.0]);

    return { projectionMatrix, modelViewMatrix };
}

