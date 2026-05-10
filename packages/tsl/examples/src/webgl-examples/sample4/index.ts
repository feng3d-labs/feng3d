import { RenderPass, RenderPassDescriptor, Submit } from '@feng3d/render-api';
import { reactive } from '@feng3d/reactivity';
import { WebGPU } from '@feng3d/webgpu';
import { mat4 } from 'gl-matrix';

import { vertexShader, fragmentShader } from './shaders/shader';

let squareRotation = 0.0;

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
    const { projectionMatrix, modelViewMatrix } = drawScene(canvas, 0);

    // 创建渲染对象
    const renderObject = {
        pipeline: {
            vertex: {
                wgsl: vertexWgsl,
            },
            fragment: {
                wgsl: fragmentWgsl,
            },
            depthStencil: { depthCompare: 'less-equal' as const },
            primitive: { topology: 'triangle-strip' as const },
        },
        vertices: {
            aVertexPosition: {
                format: 'float32x2' as const,
                data: new Float32Array([
                    1.0, 1.0,
                    -1.0, 1.0,
                    1.0, -1.0,
                    -1.0, -1.0,
                ]),
            },
            aVertexColor: {
                format: 'float32x4' as const,
                data: new Float32Array([
                    1.0, 1.0, 1.0, 1.0, // white
                    1.0, 0.0, 0.0, 1.0, // red
                    0.0, 1.0, 0.0, 1.0, // green
                    0.0, 0.0, 1.0, 1.0, // blue
                ]),
            },
        },
        draw: { __type__: 'DrawVertex' as const, firstVertex: 0, vertexCount: 4 },
        bindingResources: {
            uProjectionMatrix: { value: projectionMatrix as Float32Array },
            uModelViewMatrix: { value: modelViewMatrix as Float32Array },
        },
    };

    const renderPass: RenderPass = {
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
        renderPassObjects: [renderObject],
    };

    let then = 0;

    // 绘制场景
    function render(now: number)
    {
        now *= 0.001; // 转换为秒
        const deltaTime = now - then;
        then = now;

        const { projectionMatrix, modelViewMatrix } = drawScene(canvas, deltaTime);

        const bindingResources = reactive(renderObject.bindingResources);
        bindingResources.uProjectionMatrix = { value: projectionMatrix as Float32Array };
        bindingResources.uModelViewMatrix = { value: modelViewMatrix as Float32Array };

        const submit: Submit = {
            commandEncoders: [{
                passEncoders: [renderPass],
            }],
        };

        webgpu.submit(submit);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
});

/**
 * 绘制场景
 */
function drawScene(canvas: HTMLCanvasElement, deltaTime: number)
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

    // 旋转
    squareRotation += deltaTime;
    mat4.rotate(modelViewMatrix,
        modelViewMatrix,
        squareRotation,
        [0, 0, 1]);

    return { projectionMatrix, modelViewMatrix };
}

