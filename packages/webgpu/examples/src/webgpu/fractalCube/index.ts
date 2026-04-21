import { reactive } from '@feng3d/reactivity';
import { CanvasContext, CopyTextureToTexture, RenderObject, RenderPassDescriptor, Sampler, Submit, Texture } from '@feng3d/webgpu';
import { WebGPU } from '@feng3d/webgpu';
import { mat4, vec3 } from 'wgpu-matrix';

import { cubePositionOffset, cubeUVOffset, cubeVertexArray, cubeVertexCount, cubeVertexSize } from '../../meshes/cube';

import basicVertWGSL from '../../shaders/basic.vert.wgsl';
import sampleSelfWGSL from './sampleSelf.frag.wgsl';

const init = async (canvas: HTMLCanvasElement) =>
{
    const devicePixelRatio = window.devicePixelRatio || 1;

    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

    const webgpu = await new WebGPU().init();

    // We will copy the frame's rendering results into this texture and
    // sample it on the next frame.
    const cubeTexture: Texture = {
        descriptor: {
            size: [canvas.width, canvas.height],
            format: presentationFormat,
        },
    };

    // Create a sampler with linear filtering for smooth interpolation.
    const sampler: Sampler = {
        magFilter: 'linear',
        minFilter: 'linear',
    };

    const aspect = canvas.width / canvas.height;
    const projectionMatrix = mat4.perspective(
        (2 * Math.PI) / 5,
        aspect,
        1,
        100.0,
    );
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

        return modelViewProjectionMatrix as Float32Array;
    }

    const context: CanvasContext = {
        canvasId: canvas.id,
        configuration: {
            usage: GPUTextureUsage.COPY_SRC | GPUTextureUsage.RENDER_ATTACHMENT,
        },
    };

    const renderPass: RenderPassDescriptor = {
        colorAttachments: [
            {
                view: { texture: { context } },
                clearValue: [0.5, 0.5, 0.5, 1.0],
            },
        ],
        depthStencilAttachment: {
            depthClearValue: 1,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
        },
    };

    const uniforms = {
        value: { modelViewProjectionMatrix: new Float32Array(16) as Float32Array },
    };

    const renderObject: RenderObject = {
        pipeline: {
            vertex: { code: basicVertWGSL }, fragment: { code: sampleSelfWGSL },
            primitive: {
                cullFace: 'back',
            },
        },
        vertices: {
            position: { data: cubeVertexArray, format: 'float32x4', offset: cubePositionOffset, arrayStride: cubeVertexSize },
            uv: { data: cubeVertexArray, format: 'float32x2', offset: cubeUVOffset, arrayStride: cubeVertexSize },
        },
        draw: { __type__: 'DrawVertex', vertexCount: cubeVertexCount },
        bindingResources: {
            uniforms: uniforms,
            mySampler: sampler,
            myTexture: { texture: cubeTexture },
        },
    };

    const copyTextureToTexture: CopyTextureToTexture = {
        __type__: 'CopyTextureToTexture',
        source: { texture: { context } },
        destination: { texture: cubeTexture },
        copySize: [canvas.width, canvas.height],
    };

    function frame()
    {
        const transformationMatrix = getTransformationMatrix();

        reactive(uniforms.value).modelViewProjectionMatrix = transformationMatrix.subarray();

        const data: Submit = {
            commandEncoders: [
                {
                    passEncoders: [
                        { descriptor: renderPass, renderPassObjects: [renderObject] },
                        copyTextureToTexture,
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
