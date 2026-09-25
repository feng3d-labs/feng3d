import { reactive } from '@feng3d/reactivity';
import { RenderObject, RenderPassDescriptor, RenderPipeline, Sampler, Submit, Texture, VertexAttributes } from '@feng3d/webgpu';
import { WebGPU } from '@feng3d/webgpu';
import { GUI } from 'dat.gui';
import { mat4 } from 'wgpu-matrix';

import distanceSizedPointsVertWGSL from './distance-sized-points.vert.wgsl';
import fixedSizePointsVertWGSL from './fixed-size-points.vert.wgsl';
import orangeFragWGSL from './orange.frag.wgsl';
import texturedFragWGSL from './textured.frag.wgsl';

// See: https://www.google.com/search?q=fibonacci+sphere
function createFibonacciSphereVertices({
    numSamples,
    radius,
}: {
    numSamples: number;
    radius: number;
})
{
    const vertices = [];
    const increment = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < numSamples; ++i)
    {
        const offset = 2 / numSamples;
        const y = i * offset - 1 + offset / 2;
        const r = Math.sqrt(1 - Math.pow(y, 2));
        const phi = (i % numSamples) * increment;
        const x = Math.cos(phi) * r;
        const z = Math.sin(phi) * r;

        vertices.push(x * radius, y * radius, z * radius);
    }

    return new Float32Array(vertices);
}

const init = async (canvas: HTMLCanvasElement, gui: GUI) =>
{
    // Get a WebGPU context from the canvas and configure it
    const devicePixelRatio = window.devicePixelRatio || 1;

    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;

    const webgpu = await new WebGPU().init();

    // Compile all 4 shaders
    const fragModules = [
        orangeFragWGSL,
        texturedFragWGSL,
    ];

    const vertModules = [
        distanceSizedPointsVertWGSL,
        fixedSizePointsVertWGSL,
    ];

    const depthFormat = 'depth24plus';

    // make pipelines for each combination
    const pipelines = vertModules.map((vertModule) =>
        fragModules.map((fragModule) => ({
            vertex: {
                code: vertModule,
                buffers: [
                    {
                        arrayStride: 3 * 4, // 3 floats, 4 bytes each
                        stepMode: 'instance',
                        attributes: [
                            { shaderLocation: 0, offset: 0, format: 'float32x3' }, // position
                        ],
                    },
                ],
            },
            fragment: {
                code: fragModule,
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
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: depthFormat,
            },
        } as RenderPipeline),
        ),
    );

    const vertexData = createFibonacciSphereVertices({
        radius: 1,
        numSamples: 1000,
    });
    const kNumPoints = vertexData.length / 3;

    const vertices: VertexAttributes = {
        position: { data: vertexData, format: 'float32x3', arrayStride: 12, stepMode: 'instance' },
    };

    // Use canvas 2d to make texture data
    const ctx = new OffscreenCanvas(64, 64).getContext('2d');

    ctx.font = '60px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🦋', 32, 32);

    const sampler: Sampler = {};
    const texture: Texture = {
        descriptor: {
            size: [ctx.canvas.width, ctx.canvas.height],
            format: 'rgba8unorm',
        },
        sources: [
            { image: ctx.canvas, flipY: true },
        ],
    };

    const bindingResources = {
        uni: {
            value: {
                matrix: undefined,
                resolution: undefined,
                size: undefined,
            },
        },
        s: sampler,
        t: { texture },
    };

    const renderPassDescriptor: RenderPassDescriptor = {
        label: 'our basic canvas renderPass',
        colorAttachments: [
            {
                view: { texture: { context: { canvasId: canvas.id } } },
                clearValue: [0.3, 0.3, 0.3, 1],
                loadOp: 'clear',
                storeOp: 'store',
            },
        ],
        depthStencilAttachment: {
            view: undefined, // to be filled out when we render
            depthClearValue: 1.0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
        },
    };

    const settings = {
        fixedSize: false,
        textured: false,
        size: 10,
    };

    gui.add(settings, 'fixedSize');
    gui.add(settings, 'textured');
    gui.add(settings, 'size', 0, 80);

    const ro: RenderObject = {
        pipeline: undefined,
        bindingResources: bindingResources,
        vertices,
        draw: { __type__: 'DrawVertex', vertexCount: 6, instanceCount: kNumPoints },
    };
    //
    const submit: Submit = {
        commandEncoders: [{
            passEncoders: [
                {
                    descriptor: renderPassDescriptor,
                    renderPassObjects: [ro],
                },
            ],
        }],
    };

    function render(time: number)
    {
        // Convert to seconds.
        time *= 0.001;

        const { size, fixedSize, textured } = settings;

        reactive(ro).pipeline = pipelines[fixedSize ? 1 : 0][textured ? 1 : 0];

        // Set the size in the uniform values
        reactive(bindingResources.uni.value).size = size;

        const fov = (90 * Math.PI) / 180;
        const aspect = canvas.clientWidth / canvas.clientHeight;
        const projection = mat4.perspective(fov, aspect, 0.1, 50);
        const view = mat4.lookAt(
            [0, 0, 1.5], // position
            [0, 0, 0], // target
            [0, 1, 0], // up
        );
        const viewProjection = mat4.multiply(projection, view);
        const matrixValue = new Float32Array(16);

        mat4.rotateY(viewProjection, time, matrixValue);
        mat4.rotateX(matrixValue, time * 0.1, matrixValue);
        // Copy the uniform values to the GPU
        reactive(bindingResources.uni.value).matrix = matrixValue;

        // Update the resolution in the uniform values
        reactive(bindingResources.uni.value).resolution = [canvas.width, canvas.height];

        webgpu.submit(submit);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
};

const panel = new GUI();
const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;

init(webgpuCanvas, panel);
