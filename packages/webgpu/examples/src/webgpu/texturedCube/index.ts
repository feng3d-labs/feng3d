import { reactive } from '@feng3d/reactivity';
import { RenderObject, RenderPassDescriptor, Sampler, Submit, Texture } from '@feng3d/webgpu';
import { WebGPU } from '@feng3d/webgpu';
import { mat4, vec3 } from 'wgpu-matrix';

import { cubePositionOffset, cubeUVOffset, cubeVertexArray, cubeVertexCount, cubeVertexSize } from '../../meshes/cube';
import basicVertWGSL from '../../shaders/basic.vert.wgsl';
import sampleTextureMixColorWGSL from '../../shaders/sampleTextureMixColor.frag.wgsl';

const init = async (canvas: HTMLCanvasElement) =>
{
    const devicePixelRatio = window.devicePixelRatio || 1;

    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;

    const webgpu = await new WebGPU().init();

    // Fetch the image and upload it into a GPUTexture.
    const img = document.createElement('img');

    img.src = new URL(
        '../../../assets/img/Di-3d.png',
        import.meta.url,
    ).toString();
    await img.decode();
    const imageBitmap = await createImageBitmap(img);
    const cubeTexture: Texture = {
        descriptor: {
            size: [imageBitmap.width, imageBitmap.height],
            format: 'rgba8unorm',
        },
        sources: [{ image: imageBitmap }],
    };

    // Create a sampler with linear filtering for smooth interpolation.
    const sampler: Sampler = {
        magFilter: 'linear',
        minFilter: 'linear',
    };

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

    const uniforms = {
        value: { modelViewProjectionMatrix: new Float32Array(16) as Float32Array },
    };

    const renderObject: RenderObject = {
        pipeline: {
            vertex: { code: basicVertWGSL }, fragment: { code: sampleTextureMixColorWGSL },
            primitive: {
                cullFace: 'back',
            },
        },
        bindingResources: {
            uniforms,
            mySampler: sampler,
            myTexture: { texture: cubeTexture },
        },
        vertices: {
            position: { data: cubeVertexArray, format: 'float32x4', offset: cubePositionOffset, arrayStride: cubeVertexSize },
            uv: { data: cubeVertexArray, format: 'float32x2', offset: cubeUVOffset, arrayStride: cubeVertexSize },
        },
        draw: { __type__: 'DrawVertex', vertexCount: cubeVertexCount },
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
        const transformationMatrix = getTransformationMatrix();

        // 重新设置uniforms
        reactive(uniforms.value).modelViewProjectionMatrix = transformationMatrix.subarray();

        webgpu.submit(data);

        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
};

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;

init(webgpuCanvas);
