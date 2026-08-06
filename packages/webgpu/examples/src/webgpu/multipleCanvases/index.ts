import { reactive } from '@feng3d/reactivity';
import { BindingResources, Buffer, CanvasContext, PassEncoder, RenderPassDescriptor, RenderPipeline, Submit, VertexAttributes } from '@feng3d/webgpu';
import { WebGPU } from '@feng3d/webgpu';
import { mat3, mat4 } from 'wgpu-matrix';

import { modelData } from './models';

type Model = {
    vertices: Float32Array;
    indices: Uint32Array;
    vertexAttributes: VertexAttributes,
};

function createVertexAndIndexBuffer(
    { vertices, indices }: { vertices: Float32Array; indices: Uint32Array },
): Model
{
    const vertexAttributes: VertexAttributes = {
        position: { data: vertices, format: 'float32x3', offset: 0, arrayStride: 6 * 4 },
        normal: { data: vertices, format: 'float32x3', offset: 3 * 4, arrayStride: 6 * 4 },
    };

    return {
        vertices,
        indices,
        vertexAttributes,
    };
}

const init = async () =>
{
    const webgpu = await new WebGPU().init();

    const models = Object.values(modelData).map((data) =>
        createVertexAndIndexBuffer(data),
    );

    function rand(min?: number, max?: number)
    {
        if (min === undefined)
        {
            max = 1;
            min = 0;
        }
        else if (max === undefined)
        {
            max = min;
            min = 0;
        }

        return Math.random() * (max - min) + min;
    }

    function randInt(min: number, max?: number)
    {
        return Math.floor(rand(min, max));
    }

    function randColor()
    {
        return [rand(), rand(), rand(), 1];
    }

    const module = {
        code: `
    struct Uniforms {
      worldViewProjectionMatrix: mat4x4f,
      worldMatrix: mat4x4f,
      color: vec4f,
    };

    struct Vertex {
      @location(0) position: vec4f,
      @location(1) normal: vec3f,
    };

    struct VSOut {
      @builtin(position) position: vec4f,
      @location(0) normal: vec3f,
    };

    @group(0) @binding(0) var<uniform> uni: Uniforms;

    @vertex fn vs(vin: Vertex) -> VSOut {
      var vOut: VSOut;
      vOut.position = uni.worldViewProjectionMatrix * vin.position;
      vOut.normal = (uni.worldMatrix * vec4f(vin.normal, 0)).xyz;
      return vOut;
    }

    @fragment fn fs(vin: VSOut) -> @location(0) vec4f {
      let lightDirection = normalize(vec3f(4, 10, 6));
      let light = dot(normalize(vin.normal), lightDirection) * 0.5 + 0.5;
      return vec4f(uni.color.rgb * light, uni.color.a);
    }
  `,
    };

    const pipeline: RenderPipeline = {
        label: 'our hardcoded red triangle pipeline',
        vertex: {
            ...module,
        },
        fragment: {
            ...module,
        },
        primitive: {
            cullFace: 'back',
        },
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less',
        },
    };

    const resizeObserver = new ResizeObserver((entries) =>
    {
        for (const entry of entries)
        {
            const canvas = entry.target as HTMLCanvasElement;
            const width = entry.contentBoxSize[0].inlineSize;
            const height = entry.contentBoxSize[0].blockSize;

            canvas.width = Math.max(
                1,
                Math.min(width, webgpu.device.limits.maxTextureDimension2D),
            );
            canvas.height = Math.max(
                1,
                Math.min(height, webgpu.device.limits.maxTextureDimension2D),
            );
        }
    });

    const visibleCanvasSet = new Set<HTMLCanvasElement>();
    const intersectionObserver = new IntersectionObserver((entries) =>
    {
        for (const { target, isIntersecting } of entries)
        {
            const canvas = target as HTMLCanvasElement;

            if (isIntersecting)
            {
                visibleCanvasSet.add(canvas);
            }
            else
            {
                visibleCanvasSet.delete(canvas);
            }
        }
    });

    type CanvasInfo = {
        context: CanvasContext;
        clearValue: [number, number, number, number];
        worldViewProjectionMatrixValue: Float32Array;
        worldMatrixValue: Float32Array;
        uniformValues: Float32Array;
        bindGroup: BindingResources;
        rotation: number;
        model: Model;
        renderPassDescriptor?: RenderPassDescriptor
    };

    const outerElem = document.querySelector('#outer');
    const canvasToInfoMap = new Map<HTMLCanvasElement, CanvasInfo>();
    const numProducts = 200;

    for (let i = 0; i < numProducts; ++i)
    {
        // making this
        // <div class="product size?">
        //   <canvas></canvas>
        //   <div>Product#: ?</div>
        // </div>
        const canvas = document.createElement('canvas');

        resizeObserver.observe(canvas);
        intersectionObserver.observe(canvas);

        const container = document.createElement('div');

        container.className = `product size${randInt(4)}`;

        const description = document.createElement('div');

        description.textContent = `product#: ${i + 1}`;

        container.appendChild(canvas);
        container.appendChild(description);
        outerElem.appendChild(container);

        // Get a WebGPU context and configure it.
        canvas.id = canvas.id || `gpuCanvas___${globalThis['gpuCanvasAutoID'] = ~~globalThis['gpuCanvasAutoID'] + 1}`;
        const context: CanvasContext = { canvasId: canvas.id };

        // Make a uniform buffer and type array views
        // for our uniforms.
        const uniformValues = new Float32Array(16 + 16 + 4);
        const kWorldViewProjectionMatrixOffset = 0;
        const kWorldMatrixOffset = 16;
        const kColorOffset = 32;
        const worldViewProjectionMatrixValue = uniformValues.subarray(
            kWorldViewProjectionMatrixOffset,
            kWorldViewProjectionMatrixOffset + 16,
        );
        const worldMatrixValue = uniformValues.subarray(
            kWorldMatrixOffset,
            kWorldMatrixOffset + 15,
        );
        const colorValue = uniformValues.subarray(kColorOffset, kColorOffset + 4);

        colorValue.set(randColor());

        // Make a bind group for this uniform
        const bindGroup = {
            uni: {
                bufferView: uniformValues,
                value: {
                    worldViewProjectionMatrix: undefined,
                    worldMatrix: undefined,
                    color: undefined,
                },
            },
        };
        // device.createBindGroup({
        //     layout: pipeline.getBindGroupLayout(0),
        //     entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
        // });

        canvasToInfoMap.set(canvas, {
            context,
            clearValue: randColor() as [number, number, number, number],
            worldViewProjectionMatrixValue,
            worldMatrixValue,
            uniformValues,
            bindGroup,
            rotation: rand(Math.PI * 2),
            model: models[randInt(models.length)],
        });
    }

    function render(time: number)
    {
        time *= 0.001; // convert to seconds;

        // make a command encoder to start encoding commands
        const passEncoders: PassEncoder[] = [];

        visibleCanvasSet.forEach((canvas) =>
        {
            const canvasInfo = canvasToInfoMap.get(canvas);
            const {
                context,
                uniformValues,
                worldViewProjectionMatrixValue,
                worldMatrixValue,
                bindGroup,
                clearValue,
                rotation,
                model: { vertexAttributes, indices },
            } = canvasInfo;

            // Get the current texture from the canvas context and
            // set it as the texture to render to.
            const renderPassDescriptor: RenderPassDescriptor = canvasInfo.renderPassDescriptor = canvasInfo.renderPassDescriptor || {
                label: 'our basic canvas renderPass',
                colorAttachments: [
                    {
                        view: { texture: { context } }, // <- to be filled out when we render
                        clearValue,
                        loadOp: 'clear',
                        storeOp: 'store',
                    },
                ],
                depthStencilAttachment: {
                    view: undefined, // <- to be filled out when we render
                    depthClearValue: 1.0,
                    depthLoadOp: 'clear',
                    depthStoreOp: 'store',
                },
            };

            const fov = (60 * Math.PI) / 180;
            const aspect = canvas.clientWidth / canvas.clientHeight;
            const projection = mat4.perspective(fov, aspect, 0.1, 100);

            const view = mat4.lookAt(
                [0, 30, 50], // eye
                [0, 0, 0], // target
                [0, 1, 0], // up
            );

            const viewProjection = mat4.multiply(projection, view);

            const world = mat4.rotationY(time * 0.1 + rotation);

            mat4.multiply(viewProjection, world, worldViewProjectionMatrixValue);
            mat3.fromMat4(world, worldMatrixValue);

            // Upload our uniform values.
            const buffer = Buffer.getBuffer(uniformValues.buffer);
            const writeBuffers = buffer.writeBuffers || [];

            writeBuffers.push({
                data: uniformValues,
            });
            reactive(buffer).writeBuffers = writeBuffers;

            // make a render pass encoder to encode render specific commands
            passEncoders.push({
                descriptor: renderPassDescriptor,
                renderPassObjects: [{
                    pipeline: pipeline,
                    bindingResources: bindGroup,
                    vertices: vertexAttributes,
                    indices,
                    draw: { __type__: 'DrawIndexed', indexCount: indices.length },
                }],
            });
        });

        const submit: Submit = {
            commandEncoders: [{
                passEncoders,
            }],
        };

        webgpu.submit(submit);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
};

init();
