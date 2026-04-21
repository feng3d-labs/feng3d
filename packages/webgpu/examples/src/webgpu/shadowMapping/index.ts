import { reactive } from '@feng3d/reactivity';
import { BindingResources, Buffer, RenderPassDescriptor, RenderPipeline, Submit, Texture, VertexAttributes } from '@feng3d/webgpu';
import { WebGPU } from '@feng3d/webgpu';
import { mat4, vec3 } from 'wgpu-matrix';

import { mesh } from '../../meshes/stanfordDragon';

import fragmentWGSL from './fragment.wgsl';
import vertexWGSL from './vertex.wgsl';
import vertexShadowWGSL from './vertexShadow.wgsl';

const shadowDepthTextureSize = 1024;

const init = async (canvas: HTMLCanvasElement) =>
{
    const devicePixelRatio = window.devicePixelRatio || 1;

    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    const aspect = canvas.width / canvas.height;

    const webgpu = await new WebGPU().init();

    // Create the model vertex buffer.
    const vertexBuffer = new Float32Array(mesh.positions.length * 3 * 2);

    for (let i = 0; i < mesh.positions.length; ++i)
    {
        vertexBuffer.set(mesh.positions[i], 6 * i);
        vertexBuffer.set(mesh.normals[i], 6 * i + 3);
    }

    const vertices: VertexAttributes = {
        position: { data: vertexBuffer, format: 'float32x3', offset: 0, arrayStride: Float32Array.BYTES_PER_ELEMENT * 6 },
        normal: { data: vertexBuffer, format: 'float32x3', offset: Float32Array.BYTES_PER_ELEMENT * 3, arrayStride: Float32Array.BYTES_PER_ELEMENT * 6 },
    };

    // Create the model index buffer.
    const indexCount = mesh.triangles.length * 3;
    const indexBuffer = new Uint16Array(indexCount);

    for (let i = 0; i < mesh.triangles.length; ++i)
    {
        indexBuffer.set(mesh.triangles[i], 3 * i);
    }

    // Create the depth texture for rendering/sampling the shadow map.
    const shadowDepthTexture: Texture = {
        descriptor: {
            size: [shadowDepthTextureSize, shadowDepthTextureSize, 1],
            format: 'depth32float',
        },
    };

    // Create some common descriptors used for both the shadow pipeline
    // and the color rendering pipeline.
    const primitive: GPUPrimitiveState = {
        topology: 'triangle-list',
        cullMode: 'back',
    };

    const shadowPipeline: RenderPipeline = {
        vertex: {
            code: vertexShadowWGSL,
        },
        primitive,
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less',
        },
    };

    // Create a bind group layout which holds the scene uniforms and
    // the texture+sampler for depth. We create it manually because the WebPU
    // implementation doesn't infer this from the shader (yet).
    const pipeline: RenderPipeline = {
        vertex: {
            code: vertexWGSL,
        },
        fragment: {
            code: fragmentWGSL,
            constants: {
                shadowDepthTextureSize,
            },
        },
        primitive,
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less',
        },
    };

    const depthTexture: Texture = {
        descriptor: {
            size: [canvas.width, canvas.height],
            format: 'depth24plus-stencil8',
        },
    };

    const renderPassDescriptor: RenderPassDescriptor = {
        colorAttachments: [
            {
                view: { texture: { context: { canvasId: canvas.id } } },
                clearValue: [0.5, 0.5, 0.5, 1.0],
            },
        ],
        depthStencilAttachment: {
            view: { texture: depthTexture },

            depthClearValue: 1.0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
            stencilClearValue: 0,
            stencilLoadOp: 'clear',
            stencilStoreOp: 'store',
        },
    };

    const modelUniformBuffer = new Uint8Array(4 * 16);

    // Two 4x4 viewProj matrices,
    // one for the camera and one for the light.
    // Then a vec3 for the light position.
    // Rounded to the nearest multiple of 16.
    const sceneUniformBuffer = new Uint8Array(2 * 4 * 16 + 4 * 4);

    const sceneBindGroupForShadow: BindingResources = {
        scene: {
            bufferView: sceneUniformBuffer,
        },
    };

    const sceneBindGroupForRender: BindingResources = {
        scene: {
            bufferView: sceneUniformBuffer,
        },
        shadowMap: { texture: shadowDepthTexture },
        shadowSampler: {
            compare: 'less',
        },
    };

    const modelBindGroup: BindingResources = {
        model: {
            bufferView: modelUniformBuffer,
        },
    };

    const eyePosition = vec3.fromValues(0, 50, -100);
    const upVector = vec3.fromValues(0, 1, 0);
    const origin = vec3.fromValues(0, 0, 0);

    const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 1, 2000.0);

    const viewMatrix = mat4.lookAt(eyePosition, origin, upVector);

    const lightPosition = vec3.fromValues(50, 100, -100);
    const lightViewMatrix = mat4.lookAt(lightPosition, origin, upVector);

    const lightProjectionMatrix = mat4.create();

    {
        const left = -80;
        const right = 80;
        const bottom = -80;
        const top = 80;
        const near = -200;
        const far = 300;

        mat4.ortho(left, right, bottom, top, near, far, lightProjectionMatrix);
    }

    const lightViewProjMatrix = mat4.multiply(
        lightProjectionMatrix,
        lightViewMatrix,
    );

    const viewProjMatrix = mat4.multiply(projectionMatrix, viewMatrix);

    // Move the model so it's centered.
    const modelMatrix = mat4.translation([0, -45, 0]);

    // The camera/light aren't moving, so write them into buffers now.
    {
        const lightMatrixData = lightViewProjMatrix as Float32Array;
        const cameraMatrixData = viewProjMatrix as Float32Array;
        const lightData = lightPosition as Float32Array;

        reactive(Buffer.getBuffer(sceneUniformBuffer.buffer)).writeBuffers = [
            { bufferOffset: 0, data: lightMatrixData },
            { bufferOffset: 64, data: cameraMatrixData },
            { bufferOffset: 128, data: lightData },
        ];

        const modelData = modelMatrix as Float32Array;

        reactive(Buffer.getBuffer(modelUniformBuffer.buffer)).writeBuffers = [{ data: modelData }];
    }

    // Rotates the camera around the origin based on time.
    function getCameraViewProjMatrix()
    {
        const eyePosition = vec3.fromValues(0, 50, -100);

        const rad = Math.PI * (Date.now() / 2000);
        const rotation = mat4.rotateY(mat4.translation(origin), rad);

        vec3.transformMat4(eyePosition, rotation, eyePosition);

        const viewMatrix = mat4.lookAt(eyePosition, origin, upVector);

        mat4.multiply(projectionMatrix, viewMatrix, viewProjMatrix);

        return viewProjMatrix as Float32Array;
    }

    const shadowPassDescriptor: RenderPassDescriptor = {
        colorAttachments: [],
        depthStencilAttachment: {
            view: { texture: shadowDepthTexture },

            depthClearValue: 1,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
        },
    };

    const submit: Submit = {
        commandEncoders: [
            {
                passEncoders: [
                    {
                        descriptor: shadowPassDescriptor,
                        renderPassObjects: [
                            {
                                pipeline: shadowPipeline,
                                bindingResources: {
                                    ...sceneBindGroupForShadow,
                                    ...modelBindGroup,
                                },
                                vertices,
                                indices: indexBuffer,
                                draw: { __type__: 'DrawIndexed', indexCount },
                            },
                        ],
                    },
                    {
                        descriptor: renderPassDescriptor,
                        renderPassObjects: [
                            {
                                pipeline: pipeline,
                                bindingResources: {
                                    ...sceneBindGroupForRender,
                                    ...modelBindGroup,
                                },
                                vertices,
                                indices: indexBuffer,
                                draw: { __type__: 'DrawIndexed', indexCount },
                            },
                        ],
                    },
                ],
            },
        ],
    };

    function frame()
    {
        const cameraViewProj = getCameraViewProjMatrix();
        const writeBuffers = Buffer.getBuffer(sceneUniformBuffer.buffer).writeBuffers || [];

        writeBuffers.push({ bufferOffset: 64, data: cameraViewProj });
        reactive(Buffer.getBuffer(sceneUniformBuffer.buffer)).writeBuffers = writeBuffers;

        webgpu.submit(submit);

        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
};

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;

init(webgpuCanvas);
