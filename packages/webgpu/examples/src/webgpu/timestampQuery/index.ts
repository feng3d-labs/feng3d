import { effect, reactive } from '@feng3d/reactivity';
import { CanvasContext, RenderObject, RenderPassDescriptor, RenderPipeline, Submit, Texture, VertexAttributes } from '@feng3d/webgpu';
import { TimestampQuery, WebGPU } from '@feng3d/webgpu';

import { mat4, vec3 } from 'wgpu-matrix';

import { cubePositionOffset, cubeUVOffset, cubeVertexArray, cubeVertexCount, cubeVertexSize } from '../../meshes/cube';

import basicVertWGSL from '../../shaders/basic.vert.wgsl';
import fragmentWGSL from '../../shaders/black.frag.wgsl';

import PerfCounter from './PerfCounter';

const init = async (canvas: HTMLCanvasElement) =>
{
    const renderPassDurationCounter = new PerfCounter();
    // GPU-side timer and the CPU-side counter where we accumulate statistics:
    // NB: Look for 'timestampQueryManager' in this file to locate parts of this
    // snippets that are related to timestamps. Most of the logic is in
    // TimestampQueryManager.ts.
    const timestampQuery: TimestampQuery = {};

    effect(() =>
    {
        reactive(timestampQuery).isSupports;

        const isSupports = timestampQuery.isSupports;

        if (isSupports === undefined) return;

        if (!isSupports)
        {
            perfDisplay.innerHTML = 'Timestamp queries are not supported';
        }
    });

    effect(() =>
    {
        reactive(timestampQuery).result;

        const result = timestampQuery.result;

        if (result === undefined) return;

        // Show the last successfully downloaded elapsed time.
        // Convert from nanoseconds to milliseconds:
        const elapsedMs = Number(result.elapsedNs) * 1e-6;

        renderPassDurationCounter.addSample(elapsedMs);
        perfDisplay.innerHTML = `Render Pass duration: ${renderPassDurationCounter
            .getAverage()
            .toFixed(3)} ms ± ${renderPassDurationCounter.getStddev().toFixed(3)} ms`;
    });

    //
    const devicePixelRatio = window.devicePixelRatio || 1;

    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;

    const webgpu = await new WebGPU().init();
    //
    const context: CanvasContext = { canvasId: canvas.id };

    const perfDisplay = document.querySelector('#info pre');

    // Create a vertex buffer from the cube data.
    const vertices: VertexAttributes = {
        position: { data: cubeVertexArray, format: 'float32x4', offset: cubePositionOffset, arrayStride: cubeVertexSize },
        uv: { data: cubeVertexArray, format: 'float32x2', offset: cubeUVOffset, arrayStride: cubeVertexSize },
    };

    const uniforms = { value: { modelViewProjectionMatrix: null as Float32Array } };

    const pipeline: RenderPipeline = {
        vertex: {
            code: basicVertWGSL,
        },
        fragment: {
            code: fragmentWGSL,
        },
        primitive: {
            topology: 'triangle-list',

            // Backface culling since the cube is solid piece of geometry.
            // Faces pointing away from the camera will be occluded by faces
            // pointing toward the camera.
            cullFace: 'back',
        },
        // Enable depth testing so that the fragment closest to the camera
        // is rendered in front.
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less',
        },
    };

    const depthTexture: Texture = {
        descriptor: {
            size: [canvas.width, canvas.height],
            format: 'depth24plus',
        },
    };

    const renderPassDescriptor: RenderPassDescriptor = {
        colorAttachments: [
            {
                view: { texture: { context } }, // Assigned later

                clearValue: [0.95, 0.95, 0.95, 1.0],
                loadOp: 'clear',
                storeOp: 'store',
            },
        ],
        depthStencilAttachment: {
            view: { texture: depthTexture },

            depthClearValue: 1.0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
        },
        // 开启时间戳查询
        timestampQuery,
    };

    const renderObject: RenderObject = {
        pipeline: pipeline,
        bindingResources: {
            uniforms,
        },
        vertices,
        draw: { __type__: 'DrawVertex', vertexCount: cubeVertexCount },
    };

    const submit: Submit = {
        commandEncoders: [
            {
                passEncoders: [
                    {
                        descriptor: renderPassDescriptor, renderPassObjects: [renderObject],
                    },
                ],
            },
        ],
    };

    const aspect = canvas.width / canvas.height;
    const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 1, 100.0);
    const modelViewProjectionMatrix = mat4.create();

    function getTransformationMatrix()
    {
        const viewMatrix = mat4.identity();

        mat4.translate(viewMatrix, vec3.fromValues(0, 0, -4), viewMatrix);
        const now = Date.now() / 1000;

        mat4.rotate(
            viewMatrix,
            vec3.fromValues(Math.sin(now), Math.cos(now), 0),
            1,
            viewMatrix,
        );

        mat4.multiply(projectionMatrix, viewMatrix, modelViewProjectionMatrix);

        return modelViewProjectionMatrix;
    }

    function frame()
    {
        const transformationMatrix = getTransformationMatrix();

        reactive(uniforms.value).modelViewProjectionMatrix = transformationMatrix.subarray();

        webgpu.submit(submit);

        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
};

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;

init(webgpuCanvas);
