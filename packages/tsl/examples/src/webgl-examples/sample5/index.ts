import { RenderPass, Submit } from '@feng3d/render-api';
import { reactive } from '@feng3d/reactivity';
import { WebGPU } from '@feng3d/webgpu';
import { mat4 } from 'gl-matrix';

import { vertexShader, fragmentShader } from './shaders/shader';

let cubeRotation = 0.0;

document.addEventListener('DOMContentLoaded', async () =>
{
    // 使用 TSL 生成着色器代码
    const vertexWgsl = vertexShader.toWGSL();
    const fragmentWgsl = fragmentShader.toWGSL(vertexShader);

    const devicePixelRatio = window.devicePixelRatio || 1;

    // 初始化 WebGPU
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    const webgpu = await new WebGPU({ canvasId: 'canvas' }).init();

    // 初始化缓冲区
    const buffers = initBuffers();

    // 创建渲染对象
    const renderObject = {
        pipeline: {
            vertex: {
                wgsl: vertexWgsl,
            },
            fragment: {
                wgsl: fragmentWgsl,
            },
            primitive: { topology: 'triangle-list' as const },
            depthStencil: { depthCompare: 'less-equal' as const },
        },
        vertices: {
            aVertexPosition: {
                format: 'float32x3' as const,
                data: buffers.position,
            },
            aVertexColor: {
                format: 'float32x4' as const,
                data: buffers.color,
            },
        },
        indices: buffers.indices,
        draw: { __type__: 'DrawIndexed' as const, firstIndex: 0, indexCount: 36 },
        bindingResources: {
            uProjectionMatrix: { value: new Float32Array(16) },
            uModelViewMatrix: { value: new Float32Array(16) },
        },
    };

    const renderPass: RenderPass = {
        descriptor: {
            colorAttachments: [{
                clearValue: [0.0, 0.0, 0.0, 1.0],
                loadOp: 'clear',
            }],
            depthStencilAttachment: {
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
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

        reactive(renderObject.bindingResources).uProjectionMatrix = { value: projectionMatrix as Float32Array<ArrayBuffer> };
        reactive(renderObject.bindingResources).uModelViewMatrix = { value: modelViewMatrix as Float32Array<ArrayBuffer> };

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
 * 初始化缓冲区
 */
function initBuffers()
{
    // 立方体顶点位置
    const positions = [
        // Front face
        -1.0, -1.0, 1.0,
        1.0, -1.0, 1.0,
        1.0, 1.0, 1.0,
        -1.0, 1.0, 1.0,

        // Back face
        -1.0, -1.0, -1.0,
        -1.0, 1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, -1.0, -1.0,

        // Top face
        -1.0, 1.0, -1.0,
        -1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, -1.0,

        // Bottom face
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0, 1.0,
        -1.0, -1.0, 1.0,

        // Right face
        1.0, -1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, 1.0, 1.0,
        1.0, -1.0, 1.0,

        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0, 1.0,
        -1.0, 1.0, 1.0,
        -1.0, 1.0, -1.0,
    ];

    // 立方体每个面的颜色
    const faceColors = [
        [1.0, 1.0, 1.0, 1.0], // Front face: white
        [1.0, 0.0, 0.0, 1.0], // Back face: red
        [0.0, 1.0, 0.0, 1.0], // Top face: green
        [0.0, 0.0, 1.0, 1.0], // Bottom face: blue
        [1.0, 1.0, 0.0, 1.0], // Right face: yellow
        [1.0, 0.0, 1.0, 1.0], // Left face: purple
    ];

    // 将颜色数组转换为顶点颜色表
    let colors: number[] = [];

    for (let j = 0; j < faceColors.length; ++j)
    {
        const c = faceColors[j];

        // 每个面的四个顶点使用相同的颜色
        colors = colors.concat(c, c, c, c);
    }

    // 立方体的索引
    const indices = [
        0, 1, 2, 0, 2, 3, // front
        4, 5, 6, 4, 6, 7, // back
        8, 9, 10, 8, 10, 11, // top
        12, 13, 14, 12, 14, 15, // bottom
        16, 17, 18, 16, 18, 19, // right
        20, 21, 22, 20, 22, 23, // left
    ];

    return {
        position: new Float32Array(positions),
        color: new Float32Array(colors),
        indices: new Uint16Array(indices),
    };
}

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

    // 旋转立方体
    cubeRotation += deltaTime;
    mat4.rotate(modelViewMatrix,
        modelViewMatrix,
        cubeRotation,
        [0, 0, 1]); // Z 轴
    mat4.rotate(modelViewMatrix,
        modelViewMatrix,
        cubeRotation * 0.7,
        [0, 1, 0]); // Y 轴
    mat4.rotate(modelViewMatrix,
        modelViewMatrix,
        cubeRotation * 0.3,
        [1, 0, 0]); // X 轴

    return { projectionMatrix, modelViewMatrix };
}

