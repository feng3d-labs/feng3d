/**
 * DrawIndexedIndirect 示例
 *
 * 演示如何使用间接绘制命令从 GPU 缓冲区读取绘制参数
 */

import { reactive } from '@feng3d/reactivity';
import { RenderObject, RenderPassDescriptor, Submit } from '@feng3d/webgpu';
import { WebGPU } from '@feng3d/webgpu';
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

    const uniformsList: Array<{ value: { modelViewProjectionMatrix: Float32Array } }> = [];

    const renderObjectBase: RenderObject = {
        pipeline: {
            vertex: { code: basicVertWGSL },
            fragment: { code: vertexPositionColorWGSL },
            primitive: {
                cullFace: 'back',
            },
        },
        vertices: {
            position: {
                data: cubeVertexArray,
                format: 'float32x4',
                offset: cubePositionOffset,
                arrayStride: cubeVertexSize,
            },
            uv: {
                data: cubeVertexArray,
                format: 'float32x2',
                offset: cubeUVOffset,
                arrayStride: cubeVertexSize,
            },
        },
    };

    const aspect = canvas.width / canvas.height;
    const projectionMatrix = mat4.perspective(
        (2 * Math.PI) / 5,
        aspect,
        1,
        100.0,
    );
    const modelViewProjectionMatrix = mat4.create();

    function getTransformationMatrix(offsetX: number, offsetY: number)
    {
        const viewMatrix = mat4.identity();

        mat4.translate(viewMatrix, vec3.fromValues(offsetX, offsetY, -6), viewMatrix);

        const now = Date.now() / 1000;
        mat4.rotate(
            viewMatrix,
            vec3.fromValues(0, 1, 0),
            now,
            viewMatrix,
        );

        mat4.multiply(projectionMatrix, viewMatrix, modelViewProjectionMatrix);

        return modelViewProjectionMatrix as Float32Array;
    }

    // 创建间接绘制缓冲区
    // 每个绘制命令包含 5 个 32 位值：
    // indexCount, instanceCount, firstIndex, baseVertex, firstInstance
    const drawCount = 3;
    const indirectBuffer = webgpu.device.createBuffer({
        size: drawCount * 20, // 每个命令 20 字节
        usage: GPUBufferUsage.INDIRECT | GPUBufferUsage.COPY_DST,
    });

    // 设置间接绘制命令
    const indirectData = new Uint32Array([
        // 第一个立方体 (left)
        cubeVertexCount,  // indexCount
        1,                // instanceCount
        0,                // firstIndex
        0,                // baseVertex
        0,                // firstInstance
        // 第二个立方体 (center)
        cubeVertexCount,
        1,
        0,
        0,
        0,
        // 第三个立方体 (right)
        cubeVertexCount,
        1,
        0,
        0,
        0,
    ]);
    webgpu.device.queue.writeBuffer(indirectBuffer, 0, indirectData);

    // 创建多个渲染对象，每个使用不同的间接缓冲区偏移
    const positions = [
        { x: -2, y: 0 },
        { x: 0, y: 0 },
        { x: 2, y: 0 },
    ];

    function frame()
    {
        const renderObjects: RenderObject[] = [];

        for (let i = 0; i < drawCount; i++)
        {
            const uniforms = { value: { modelViewProjectionMatrix: getTransformationMatrix(positions[i].x, positions[i].y) } };
            uniformsList.push(uniforms);

            const renderObj: RenderObject = {
                ...renderObjectBase,
                bindingResources: { uniforms },
                draw: {
                    __type__: 'DrawIndexedIndirect',
                    buffer: indirectBuffer,
                    offset: i * 20, // 每个命令 20 字节
                },
            };
            renderObjects.push(reactive(renderObj));
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

        webgpu.submit(data);

        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
};

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;

init(webgpuCanvas);
