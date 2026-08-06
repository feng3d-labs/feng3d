import { reactive } from '@feng3d/reactivity';
import { BindingResources, RenderObject, RenderPass, RenderPassDescriptor, RenderPipeline, Submit, VertexAttributes } from '@feng3d/webgpu';
import { WebGPU } from '@feng3d/webgpu';

import { GUI } from 'dat.gui';
import { mat4 } from 'wgpu-matrix';
import { modelData } from './models';
import solidColorLitWGSL from './solidColorLit.wgsl';
import { randColor, randElement } from './utils';
import wireframeWGSL from './wireframe.wgsl';

const init = async (canvas: HTMLCanvasElement, gui: GUI) =>
{
    const devicePixelRatio = window.devicePixelRatio || 1;

    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;

    const webgpu = await new WebGPU().init();

    const settings = {
        barycentricCoordinatesBased: false,
        thickness: 2,
        alphaThreshold: 0.5,
        animate: true,
        lines: true,
        depthBias: 1,
        depthBiasSlopeScale: 0.5,
        models: true,
    };

    type Model = {
        vertices: Float32Array;
        indices: Uint32Array;
        vertexAttributes: VertexAttributes
    };

    const models = Object.values(modelData).map((v) =>
    {
        const model: Model = {
            vertices: v.vertices,
            indices: v.indices,
            vertexAttributes: {
                position: { data: v.vertices, format: 'float32x3', offset: 0, arrayStride: 6 * 4 },
                normal: { data: v.vertices, format: 'float32x3', offset: 3 * 4, arrayStride: 6 * 4 },
            },
        };

        return model;
    });

    let litPipeline: RenderPipeline;

    function rebuildLitPipeline()
    {
        litPipeline = {
            label: 'lit pipeline',
            vertex: {
                code: solidColorLitWGSL,
            },
            fragment: {
                code: solidColorLitWGSL,
            },
            primitive: {
                cullFace: 'back',
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                // Applying a depth bias can prevent aliasing from z-fighting with the
                // wireframe lines. The depth bias has to be applied to the lit meshes
                // rather that the wireframe because depthBias isn't considered when
                // drawing line or point primitives.
                depthBias: settings.depthBias,
                depthBiasSlopeScale: settings.depthBiasSlopeScale,
            },
        };
    }
    rebuildLitPipeline();

    const wireframePipeline: RenderPipeline = {
        label: 'wireframe pipeline',
        vertex: {
            code: wireframeWGSL,
            entryPoint: 'vsIndexedU32',
        },
        fragment: {
            code: wireframeWGSL,
            entryPoint: 'fs',
        },
        primitive: {
            topology: 'line-list',
        },
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less-equal',
        },
    };

    const barycentricCoordinatesBasedWireframePipeline: RenderPipeline = {
        label: 'barycentric coordinates based wireframe pipeline',
        vertex: {
            code: wireframeWGSL,
            entryPoint: 'vsIndexedU32BarycentricCoordinateBasedLines',
        },
        fragment: {
            code: wireframeWGSL,
            entryPoint: 'fsBarycentricCoordinateBasedLines',
            targets: [
                {
                    blend: {
                        color: {
                            srcFactor: 'one',
                            dstFactor: 'one-minus-src-alpha',
                        },
                        alpha: {
                            srcFactor: 'one',
                            dstFactor: 'one-minus-src-alpha',
                        },
                    },
                },
            ],
        },
        primitive: {
            topology: 'triangle-list',
        },
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less-equal',
        },
    };

    type ObjectInfo = {
        uniformBuffer: {
            value: {
                worldViewProjectionMatrix?: Float32Array;
                worldMatrix?: Float32Array;
                color?: number[];
            };
        };
        lineUniformValues: Float32Array;
        lineUniformBuffer: {
            readonly bufferView: Float32Array;
            stride: number;
            thickness: number;
            alphaThreshold: number;
        };
        litBindGroup: BindingResources;
        wireframeBindGroups: BindingResources[];
        model: Model;
    };

    const objectInfos: ObjectInfo[] = [];

    const numObjects = 200;

    for (let i = 0; i < numObjects; ++i)
    {
        // Make a uniform buffer and type array views
        // for our uniforms.
        const uniformValues = new Float32Array(16 + 16 + 4);
        const uniformBuffer: {
            value: {
                worldViewProjectionMatrix?: Float32Array;
                worldMatrix?: Float32Array;
                color?: number[];
            };
        } = {
            value: {
                color: randColor(),
            },
        };

        const model = randElement(models);

        // Make a bind group for this uniform
        const litBindGroup: BindingResources = {
            uni: uniformBuffer,
        };

        // Note: We're making one lineUniformBuffer per object.
        // This is only because stride might be different per object.
        // In this sample stride is the same across all objects so
        // we could have made just a single shared uniform buffer for
        // these settings.
        const lineUniformValues = new Float32Array(3 + 1);
        const lineUniformValuesAsU32 = new Uint32Array(lineUniformValues.buffer);
        const lineUniformBuffer = {
            bufferView: lineUniformValues,
            stride: undefined as number,
            thickness: undefined as number,
            alphaThreshold: undefined as number,
        };

        lineUniformValuesAsU32[0] = 6; // the array stride for positions for this model.

        // We're creating 2 bindGroups, one for each pipeline.
        // We could create just one since they are identical. To do
        // so we'd have to manually create a bindGroupLayout.
        const wireframeBindGroup: BindingResources = {
            uni: uniformBuffer,
            positions: { bufferView: model.vertices },
            indices: { bufferView: model.indices },
            line: lineUniformBuffer,
        };

        const barycentricCoordinatesBasedWireframeBindGroup: BindingResources = {
            uni: uniformBuffer,
            positions: { bufferView: model.vertices },
            indices: { bufferView: model.indices },
            line: lineUniformBuffer,
        };

        objectInfos.push({
            uniformBuffer,
            lineUniformValues,
            lineUniformBuffer,
            litBindGroup,
            wireframeBindGroups: [
                wireframeBindGroup,
                barycentricCoordinatesBasedWireframeBindGroup,
            ],
            model,
        });
    }

    const renderPassDescriptor: RenderPassDescriptor = {
        label: 'our basic canvas renderPass',
        colorAttachments: [
            {
                view: { texture: { context: { canvasId: canvas.id } } }, // <- to be filled out when we render
                clearValue: [0.3, 0.3, 0.3, 1],
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

    gui.add(settings, 'barycentricCoordinatesBased').onChange(addRemoveGUI);
    gui.add(settings, 'lines').onChange(updateObjects);
    gui.add(settings, 'models').onChange(updateObjects);
    gui.add(settings, 'animate');

    const guis = [];

    const renderPass: RenderPass = {
        descriptor: renderPassDescriptor,
    };

    const submit: Submit = {
        commandEncoders: [{
            passEncoders: [renderPass],
        }],
    };

    function addRemoveGUI()
    {
        guis.forEach((g) => g.remove());
        guis.length = 0;
        if (settings.barycentricCoordinatesBased)
        {
            guis.push(
                gui.add(settings, 'thickness', 0.0, 10).onChange(updateThickness),
                gui.add(settings, 'alphaThreshold', 0, 1).onChange(updateThickness),
            );
        }
        else
        {
            guis.push(
                gui.add(settings, 'depthBias', -3, 3, 1).onChange(rebuildLitPipeline),
                gui
                    .add(settings, 'depthBiasSlopeScale', -1, 1, 0.05)
                    .onChange(rebuildLitPipeline),
            );
        }
        updateObjects();
    }
    addRemoveGUI();

    function updateThickness()
    {
        objectInfos.forEach(({ lineUniformBuffer, lineUniformValues }) =>
        {
            lineUniformBuffer.thickness = settings.thickness;
            lineUniformBuffer.alphaThreshold = settings.alphaThreshold;
        });
    }
    updateThickness();

    function updateObjects()
    {
        const renderObjects: RenderObject[] = [];

        objectInfos.forEach(
            (
                {
                    uniformBuffer,
                    litBindGroup,
                    model: { vertexAttributes, indices },
                },
                i,
            ) =>
            {
                if (settings.models)
                {
                    renderObjects.push({
                        pipeline: litPipeline,
                        bindingResources: litBindGroup,
                        vertices: vertexAttributes,
                        indices,
                        draw: { __type__: 'DrawIndexed', indexCount: indices.length },
                    });
                }
            },
        );

        if (settings.lines)
        {
            // Note: If we're using the line-list based pipeline then we need to
            // multiply the vertex count by 2 since we need to emit 6 vertices
            // for each triangle (3 edges).
            const [bindGroupNdx, countMult, pipeline]
                = settings.barycentricCoordinatesBased
                    ? [1, 1, barycentricCoordinatesBasedWireframePipeline]
                    : [0, 2, wireframePipeline];

            objectInfos.forEach(({ wireframeBindGroups, model: { indices } }) =>
            {
                renderObjects.push({
                    pipeline,
                    bindingResources: wireframeBindGroups[bindGroupNdx],
                    draw: { __type__: 'DrawVertex', vertexCount: indices.length * countMult },
                });
            });
        }

        reactive(renderPass).renderPassObjects = renderObjects;
    }
    updateObjects();

    let time = 0.0;

    function render(ts: number)
    {
        if (settings.animate)
        {
            time = ts * 0.001; // convert to seconds;
        }

        const fov = (60 * Math.PI) / 180;
        const aspect = canvas.clientWidth / canvas.clientHeight;
        const projection = mat4.perspective(fov, aspect, 0.1, 1000);

        const view = mat4.lookAt(
            [-300, 0, 300], // eye
            [0, 0, 0], // target
            [0, 1, 0], // up
        );

        const viewProjection = mat4.multiply(projection, view);

        objectInfos.forEach(
            (
                {
                    uniformBuffer,
                    litBindGroup,
                    model: { vertexAttributes, indices },
                },
                i,
            ) =>
            {
                const world = mat4.identity();

                mat4.translate(
                    world,
                    [0, 0, Math.sin(i * 3.721 + time * 0.1) * 200],
                    world,
                );
                mat4.rotateX(world, i * 4.567, world);
                mat4.rotateY(world, i * 2.967, world);
                mat4.translate(
                    world,
                    [0, 0, Math.sin(i * 9.721 + time * 0.1) * 200],
                    world,
                );
                mat4.rotateX(world, time * 0.53 + i, world);

                const worldViewProjectionMatrixValue = uniformBuffer.value.worldViewProjectionMatrix || new Float32Array(16);

                mat4.multiply(viewProjection, world, worldViewProjectionMatrixValue);

                // Upload our uniform values.
                reactive(uniformBuffer.value).worldViewProjectionMatrix = worldViewProjectionMatrixValue.subarray();
                reactive(uniformBuffer.value).worldMatrix = world;
            },
        );

        webgpu.submit(submit);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
};

const panel = new GUI({ width: 310 });
const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;

init(webgpuCanvas, panel);
