import { reactive } from '@feng3d/reactivity';
import { BufferBinding, RenderObject, RenderPassDescriptor, Sampler, Submit, Texture, TextureImageSource } from '@feng3d/webgpu';
import { WebGPU } from '@feng3d/webgpu';
import { mat4, vec3 } from 'wgpu-matrix';

import { cubePositionOffset, cubeUVOffset, cubeVertexArray, cubeVertexCount, cubeVertexSize } from '../../meshes/cube';
import basicVertWGSL from '../../shaders/basic.vert.wgsl';
import sampleCubemapWGSL from './sampleCubemap.frag.wgsl';

const init = async (canvas: HTMLCanvasElement) =>
{
    const devicePixelRatio = window.devicePixelRatio || 1;

    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;

    const webgpu = await new WebGPU().init();

    // Fetch the 6 separate images for negative/positive x, y, z axis of a cubemap
    // and upload it into a GPUTexture.
    let cubemapTexture: Texture;

    {
        // The order of the array layers is [+X, -X, +Y, -Y, +Z, -Z]
        const imgSrcs = [
            new URL(
                `../../../assets/img/cubemap/posx.jpg`,
                import.meta.url,
            ).toString(),
            new URL(
                `../../../assets/img/cubemap/negx.jpg`,
                import.meta.url,
            ).toString(),
            new URL(
                `../../../assets/img/cubemap/posy.jpg`,
                import.meta.url,
            ).toString(),
            new URL(
                `../../../assets/img/cubemap/negy.jpg`,
                import.meta.url,
            ).toString(),
            new URL(
                `../../../assets/img/cubemap/posz.jpg`,
                import.meta.url,
            ).toString(),
            new URL(
                `../../../assets/img/cubemap/negz.jpg`,
                import.meta.url,
            ).toString(),
        ];
        const promises = imgSrcs.map((src) =>
        {
            const img = document.createElement('img');

            img.src = src;

            return img.decode().then(() => createImageBitmap(img));
        });
        const imageBitmaps = await Promise.all(promises);
        const textureSource = imageBitmaps.map((v, i) =>
        {
            const item: TextureImageSource = {
                image: v, textureOrigin: [0, 0, i],
            };

            return item;
        });

        cubemapTexture = {
            descriptor: {
                size: [imageBitmaps[0].width, imageBitmaps[0].height, 6],
                dimension: 'cube',
                format: 'rgba8unorm',
            },
            sources: textureSource,
        };
    }

    const sampler: Sampler = {
        magFilter: 'linear',
        minFilter: 'linear',
    };

    const aspect = canvas.width / canvas.height;
    const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 1, 3000);

    const modelMatrix = mat4.scaling(vec3.fromValues(1000, 1000, 1000));
    const modelViewProjectionMatrix = mat4.create() as Float32Array;
    const viewMatrix = mat4.identity();

    const tmpMat4 = mat4.create();

    // Comppute camera movement:
    // It rotates around Y axis with a slight pitch movement.
    function updateTransformationMatrix()
    {
        const now = Date.now() / 800;

        mat4.rotate(
            viewMatrix,
            vec3.fromValues(1, 0, 0),
            (Math.PI / 10) * Math.sin(now),
            tmpMat4,
        );
        mat4.rotate(tmpMat4, vec3.fromValues(0, 1, 0), now * 0.2, tmpMat4);

        mat4.multiply(tmpMat4, modelMatrix, modelViewProjectionMatrix);
        mat4.multiply(
            projectionMatrix,
            modelViewProjectionMatrix,
            modelViewProjectionMatrix,
        );
    }

    const renderPass: RenderPassDescriptor = {
        colorAttachments: [
            {
                view: { texture: { context: { canvasId: canvas.id } } },
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
            vertex: { code: basicVertWGSL }, fragment: { code: sampleCubemapWGSL },
            primitive: {
                cullFace: 'none',
            },
        },
        bindingResources: {
            uniforms,
            mySampler: sampler,
            myTexture: { texture: cubemapTexture },
        },
        vertices: {
            position: { data: cubeVertexArray, format: 'float32x4', offset: cubePositionOffset, arrayStride: cubeVertexSize },
            uv: { data: cubeVertexArray, format: 'float32x2', offset: cubeUVOffset, arrayStride: cubeVertexSize },
        },
        draw: { __type__: 'DrawVertex', vertexCount: cubeVertexCount },
    };

    function frame()
    {
        updateTransformationMatrix();

        reactive(uniforms.value).modelViewProjectionMatrix = modelViewProjectionMatrix.subarray();

        const data: Submit = {
            commandEncoders: [
                {
                    passEncoders: [
                        { descriptor: renderPass, renderPassObjects: [renderObject] },
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
