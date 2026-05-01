/**
 * DrawIndexedIndirect 示例
 *
 * 间接绘制命令允许从 GPU 缓冲区读取绘制参数，而不是在 CPU 端指定。
 * 这对于 GPU 驱动的渲染系统特别有用，例如视锥体剔除可以在 GPU 端
 * 决定绘制哪些对象，并将绘制参数写入间接缓冲区。
 *
 * 间接缓冲区中每个绘制命令占用 5 个 uint32 值（20 字节）：
 * - indexCount: 索引数量
 * - instanceCount: 实例数量
 * - firstIndex: 起始索引
 * - baseVertex: 顶点偏移
 * - firstInstance: 起始实例
 */

import { RenderObject, RenderPassDescriptor, Submit, Buffer } from '@feng3d/webgpu';
import { WebGPU } from '@feng3d/webgpu';
import { reactive } from '@feng3d/reactivity';
import { mat4, vec3 } from 'wgpu-matrix';

import { cubePositionOffset, cubeUVOffset, cubeVertexArray, cubeVertexCount, cubeVertexSize } from '../../meshes/cube';
import basicVertWGSL from '../../shaders/basic.vert.wgsl';
import vertexPositionColorWGSL from '../../shaders/vertexPositionColor.frag.wgsl';

const init = async (canvas: HTMLCanvasElement) =>
{
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;

    const webgpu = await new WebGPU().init();

    // 创建索引数据（立方体展开为三角形列表）
    const indexData = new Uint16Array(cubeVertexCount);
    for (let i = 0; i < cubeVertexCount; i++)
    {
        indexData[i] = i;
    }

    const renderPass: RenderPassDescriptor = {
        colorAttachments: [
            {
                view: { texture: { context: { canvasId: canvas.id } } },
                clearValue: [0.5, 0.5, 0.5, 1.0],
            },
        ],
        depthStencilAttachment: {
            depthClearValue: 1,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
        },
    };

    // 渲染管线
    const pipeline = {
        vertex: { code: basicVertWGSL },
        fragment: { code: vertexPositionColorWGSL },
        primitive: { cullFace: 'back' as const },
    };

    // 顶点数据
    const vertices = {
        position: { data: cubeVertexArray, format: 'float32x4' as const, offset: cubePositionOffset, arrayStride: cubeVertexSize },
        uv: { data: cubeVertexArray, format: 'float32x2' as const, offset: cubeUVOffset, arrayStride: cubeVertexSize },
    };

    // ============ 间接绘制缓冲区 ============
    // 每个绘制命令占用 20 字节（5 个 uint32）
    // 这里定义 3 个绘制命令，每个都绘制完整的立方体
    const INDIRECT_COMMAND_SIZE = 5 * 4; // 5 个 uint32 = 20 字节
    const DRAW_COUNT = 3;

    const indirectBuffer: Buffer = {
        size: DRAW_COUNT * INDIRECT_COMMAND_SIZE,
        data: new Uint32Array([
            // 命令 1: 绘制左边立方体
            cubeVertexCount, // indexCount
            1,                // instanceCount
            0,                // firstIndex
            0,                // baseVertex
            0,                // firstInstance
            // 命令 2: 绘制中间立方体
            cubeVertexCount,
            1,
            0,
            0,
            0,
            // 命令 3: 绘制右边立方体
            cubeVertexCount,
            1,
            0,
            0,
            0,
        ]).buffer,
    };

    // 三个立方体的位置
    const positions = [
        { x: -2, y: 0 },
        { x: 0, y: 0 },
        { x: 2, y: 0 },
    ];

    // 为每个立方体创建独立的 uniform 和渲染对象
    const uniformsList: Array<{ value: { modelViewProjectionMatrix: Float32Array } }> = [];
    const renderObjects: RenderObject[] = [];

    for (let i = 0; i < DRAW_COUNT; i++)
    {
        const uniforms = { value: { modelViewProjectionMatrix: new Float32Array(16) } };
        uniformsList.push(uniforms);

        renderObjects.push({
            pipeline,
            vertices,
            indices: indexData,
            bindingResources: { uniforms },
            // 使用间接绘制，从 indirectBuffer 的偏移位置读取绘制参数
            draw: {
                __type__: 'DrawIndexedIndirect',
                buffer: indirectBuffer,
                offset: i * INDIRECT_COMMAND_SIZE,
            },
        });
    }

    const data: Submit = {
        commandEncoders: [
            {
                passEncoders: [
                    {
                        __type__: 'RenderPass',
                        descriptor: renderPass,
                        renderPassObjects: renderObjects,
                    },
                ],
            },
        ],
    };

    // 矩阵计算
    const aspect = canvas.width / canvas.height;
    const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 1, 100);
    const modelViewProjectionMatrix = mat4.create();

    function getTransformationMatrix(x: number, y: number)
    {
        const viewMatrix = mat4.identity();
        mat4.translate(viewMatrix, vec3.fromValues(x, y, -6), viewMatrix);
        const now = Date.now() / 1000;
        mat4.rotate(viewMatrix, vec3.fromValues(0, 1, 0), now, viewMatrix);
        mat4.multiply(projectionMatrix, viewMatrix, modelViewProjectionMatrix);
        return modelViewProjectionMatrix as Float32Array;
    }

    // 动画循环
    function frame()
    {
        for (let i = 0; i < positions.length; i++)
        {
            const mvp = getTransformationMatrix(positions[i].x, positions[i].y);
            reactive(uniformsList[i].value).modelViewProjectionMatrix = new Float32Array(mvp);
        }

        webgpu.submit(data);
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
};

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
init(webgpuCanvas);
