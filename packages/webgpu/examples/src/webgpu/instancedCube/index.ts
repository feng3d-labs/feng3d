import { reactive } from '@feng3d/reactivity';
import { RenderObject, RenderPassDescriptor, Submit } from '@feng3d/webgpu';
import { WebGPU } from '@feng3d/webgpu';
import { Mat4, mat4, vec3 } from 'wgpu-matrix';

import { cubePositionOffset, cubeUVOffset, cubeVertexArray, cubeVertexCount, cubeVertexSize } from '../../meshes/cube';
import instancedVertWGSL from '../../shaders/instanced.vert.wgsl';
import vertexPositionColorWGSL from '../../shaders/vertexPositionColor.frag.wgsl';

const init = async (canvas: HTMLCanvasElement) =>
{
    const devicePixelRatio = window.devicePixelRatio || 1;

    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;

    const webgpu = await new WebGPU().init();

    const xCount = 4;
    const yCount = 4;
    const numInstances = xCount * yCount;
    const matrixFloatCount = 16; // 4x4 matrix

    const aspect = canvas.width / canvas.height;
    const projectionMatrix = mat4.perspective(
        (2 * Math.PI) / 5,
        aspect,
        1,
        100.0,
    );

    const modelMatrices = new Array<Mat4>(numInstances);
    let mvpMatricesData: Float32Array[] = [];

    const step = 4.0;

    // Initialize the matrix data for every instance.
    let m = 0;

    for (let x = 0; x < xCount; x++)
    {
        for (let y = 0; y < yCount; y++)
        {
            modelMatrices[m] = mat4.translation(
                vec3.fromValues(
                    step * (x - xCount / 2 + 0.5),
                    step * (y - yCount / 2 + 0.5),
                    0,
                ),
            );
            m++;
        }
    }

    const viewMatrix = mat4.translation(vec3.fromValues(0, 0, -12));

    const tmpMat4 = mat4.create();

    // Update the transformation matrix data for each instance.
    function updateTransformationMatrix()
    {
        const now = Date.now() / 1000;

        let m = 0;
        let i = 0;

        for (let x = 0; x < xCount; x++)
        {
            for (let y = 0; y < yCount; y++)
            {
                mat4.rotate(
                    modelMatrices[i],
                    vec3.fromValues(
                        Math.sin((x + 0.5) * now),
                        Math.cos((y + 0.5) * now),
                        0,
                    ),
                    1,
                    tmpMat4,
                );

                mat4.multiply(viewMatrix, tmpMat4, tmpMat4);
                mat4.multiply(projectionMatrix, tmpMat4, tmpMat4);

                // Update the matrix data.
                reactive(mvpMatricesData)[i] = tmpMat4.slice();

                i++;
                m += matrixFloatCount;
            }
        }
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

    const renderObject: RenderObject = {
        pipeline: {
            vertex: { code: instancedVertWGSL }, fragment: { code: vertexPositionColorWGSL },
            primitive: {
                cullFace: 'back',
            },
        },
        vertices: {
            position: { data: cubeVertexArray, format: 'float32x4', offset: cubePositionOffset, arrayStride: cubeVertexSize },
            uv: { data: cubeVertexArray, format: 'float32x2', offset: cubeUVOffset, arrayStride: cubeVertexSize },
        },
        draw: { __type__: 'DrawVertex', vertexCount: cubeVertexCount, instanceCount: numInstances },
        bindingResources: {
            uniforms: {
                value: { modelViewProjectionMatrix: mvpMatricesData },
            },
        },
    };

    const data: Submit = {
        commandEncoders: [
            {
                passEncoders: [
                    { descriptor: renderPass, renderPassObjects: [renderObject] },
                ],
            },
        ],
    };

    function frame()
    {
        // Update the matrix data.
        updateTransformationMatrix();

        webgpu.submit(data);

        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
};

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;

init(webgpuCanvas);
