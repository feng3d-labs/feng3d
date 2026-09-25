import { reactive } from '@feng3d/reactivity';
import { BindingResources, Buffer, RenderPassDescriptor, RenderPassObject, RenderPipeline, Submit, Texture, VertexAttributes } from '@feng3d/webgpu';
import { WebGPU } from '@feng3d/webgpu';
import { mat4, vec3 } from 'wgpu-matrix';

import { cubePositionOffset, cubeUVOffset, cubeVertexArray, cubeVertexCount, cubeVertexSize } from '../../meshes/cube';
import basicVertWGSL from '../../shaders/basic.vert.wgsl';
import vertexPositionColorWGSL from '../../shaders/vertexPositionColor.frag.wgsl';
import { MsdfTextRenderer } from './msdfText';

const init = async (canvas: HTMLCanvasElement) =>
{
    const devicePixelRatio = window.devicePixelRatio || 1;

    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;

    const webgpu = await new WebGPU().init();

    const depthFormat = 'depth24plus';

    const textRenderer = new MsdfTextRenderer();
    const font = await textRenderer.createFont(
        new URL(
            '../../../assets/font/ya-hei-ascii-msdf.json',
            import.meta.url,
        ).toString(),
    );

    function getTextTransform(
        position: [number, number, number],
        rotation?: [number, number, number],
    )
    {
        const textTransform = mat4.create();

        mat4.identity(textTransform);
        mat4.translate(textTransform, position, textTransform);
        if (rotation && rotation[0] != 0)
        {
            mat4.rotateX(textTransform, rotation[0], textTransform);
        }
        if (rotation && rotation[1] != 0)
        {
            mat4.rotateY(textTransform, rotation[1], textTransform);
        }
        if (rotation && rotation[2] != 0)
        {
            mat4.rotateZ(textTransform, rotation[2], textTransform);
        }

        return textTransform;
    }

    const textTransforms = [
        getTextTransform([0, 0, 1.1]),
        getTextTransform([0, 0, -1.1], [0, Math.PI, 0]),
        getTextTransform([1.1, 0, 0], [0, Math.PI / 2, 0]),
        getTextTransform([-1.1, 0, 0], [0, -Math.PI / 2, 0]),
        getTextTransform([0, 1.1, 0], [-Math.PI / 2, 0, 0]),
        getTextTransform([0, -1.1, 0], [Math.PI / 2, 0, 0]),
    ];

    const titleText = textRenderer.formatText(font, `WebGPU`, {
        centered: true,
        pixelScale: 1 / 128,
    });
    const largeText = textRenderer.formatText(
        font,
        `
WebGPU exposes an API for performing operations, such as rendering
and computation, on a Graphics Processing Unit.

Graphics Processing Units, or GPUs for short, have been essential
in enabling rich rendering and computational applications in personal
computing. WebGPU is an API that exposes the capabilities of GPU
hardware for the Web. The API is designed from the ground up to
efficiently map to (post-2014) native GPU APIs. WebGPU is not related
to WebGL and does not explicitly target OpenGL ES.

WebGPU sees physical GPU hardware as GPUAdapters. It provides a
connection to an adapter via GPUDevice, which manages resources, and
the device's GPUQueues, which execute commands. GPUDevice may have
its own memory with high-speed access to the processing units.
GPUBuffer and GPUTexture are the physical resources backed by GPU
memory. GPUCommandBuffer and GPURenderBundle are containers for
user-recorded commands. GPUShaderModule contains shader code. The
other resources, such as GPUSampler or GPUBindGroup, configure the
way physical resources are used by the GPU.

GPUs execute commands encoded in GPUCommandBuffers by feeding data
through a pipeline, which is a mix of fixed-function and programmable
stages. Programmable stages execute shaders, which are special
programs designed to run on GPU hardware. Most of the state of a
pipeline is defined by a GPURenderPipeline or a GPUComputePipeline
object. The state not included in these pipeline objects is set
during encoding with commands, such as beginRenderPass() or
setBlendConstant().`,
        { pixelScale: 1 / 256 },
    );

    const text = [
        textRenderer.formatText(font, 'Front', {
            centered: true,
            pixelScale: 1 / 128,
            color: [1, 0, 0, 1],
        }),
        textRenderer.formatText(font, 'Back', {
            centered: true,
            pixelScale: 1 / 128,
            color: [0, 1, 1, 1],
        }),
        textRenderer.formatText(font, 'Right', {
            centered: true,
            pixelScale: 1 / 128,
            color: [0, 1, 0, 1],
        }),
        textRenderer.formatText(font, 'Left', {
            centered: true,
            pixelScale: 1 / 128,
            color: [1, 0, 1, 1],
        }),
        textRenderer.formatText(font, 'Top', {
            centered: true,
            pixelScale: 1 / 128,
            color: [0, 0, 1, 1],
        }),
        textRenderer.formatText(font, 'Bottom', {
            centered: true,
            pixelScale: 1 / 128,
            color: [1, 1, 0, 1],
        }),

        titleText,
        largeText,
    ];

    // Create a vertex buffer from the cube data.
    const verticesBuffer: VertexAttributes = {
        position: { data: cubeVertexArray, format: 'float32x4', offset: cubePositionOffset, arrayStride: cubeVertexSize },
        uv: { data: cubeVertexArray, format: 'float32x2', offset: cubeUVOffset, arrayStride: cubeVertexSize },
    };

    const pipeline: RenderPipeline = {
        vertex: {
            code: basicVertWGSL,
        },
        fragment: {
            code: vertexPositionColorWGSL,
        },
        primitive: {
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
            format: depthFormat,
        },
    };

    const uniformBuffer = new Float32Array(16);

    const uniformBindGroup: BindingResources = {
        uniforms: { bufferView: uniformBuffer },
    };

    const renderPassDescriptor: RenderPassDescriptor = {
        colorAttachments: [
            {
                view: { texture: { context: { canvasId: canvas.id } } }, // Assigned later

                clearValue: [0, 0, 0, 1],
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
    };

    const aspect = canvas.width / canvas.height;
    const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 1, 100.0);
    const modelViewProjectionMatrix = mat4.create();

    const start = Date.now();

    function getTransformationMatrix()
    {
        const now = Date.now() / 5000;
        const viewMatrix = mat4.identity();

        mat4.translate(viewMatrix, vec3.fromValues(0, 0, -5), viewMatrix);

        const modelMatrix = mat4.identity();

        mat4.translate(modelMatrix, vec3.fromValues(0, 2, -3), modelMatrix);
        mat4.rotate(
            modelMatrix,
            vec3.fromValues(Math.sin(now), Math.cos(now), 0),
            1,
            modelMatrix,
        );

        // Update the matrix for the cube
        mat4.multiply(projectionMatrix, viewMatrix, modelViewProjectionMatrix);
        mat4.multiply(
            modelViewProjectionMatrix,
            modelMatrix,
            modelViewProjectionMatrix,
        );

        // Update the projection and view matrices for the text
        textRenderer.updateCamera(projectionMatrix, viewMatrix);

        // Update the transform of all the text surrounding the cube
        const textMatrix = mat4.create();

        for (const [index, transform] of textTransforms.entries())
        {
            mat4.multiply(modelMatrix, transform, textMatrix);
            text[index].setTransform(textMatrix);
        }

        // Update the transform of the larger block of text
        const crawl = ((Date.now() - start) / 2500) % 14;

        mat4.identity(textMatrix);
        mat4.rotateX(textMatrix, -Math.PI / 8, textMatrix);
        mat4.translate(textMatrix, [0, crawl - 3, 0], textMatrix);
        titleText.setTransform(textMatrix);
        mat4.translate(textMatrix, [-3, -0.1, 0], textMatrix);
        largeText.setTransform(textMatrix);

        return modelViewProjectionMatrix;
    }

    function frame()
    {
        const transformationMatrix = getTransformationMatrix();

        const buffer = Buffer.getBuffer(uniformBuffer.buffer);
        const writeBuffers = buffer.writeBuffers || [];

        writeBuffers.push({
            data: transformationMatrix,
        });
        reactive(buffer).writeBuffers = writeBuffers;

        const renderObjects: RenderPassObject[] = [];

        renderObjects.push({
            pipeline: pipeline,
            bindingResources: uniformBindGroup,
            vertices: verticesBuffer,
            draw: { __type__: 'DrawVertex', vertexCount: cubeVertexCount, instanceCount: 1 },
        });

        textRenderer.render(renderObjects, ...text);

        const submit: Submit = {
            commandEncoders: [{
                passEncoders: [{
                    descriptor: renderPassDescriptor,
                    renderPassObjects: renderObjects,
                }],
            }],
        };

        webgpu.submit(submit);

        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
};

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;

init(webgpuCanvas);
