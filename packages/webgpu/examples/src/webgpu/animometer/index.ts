import { reactive } from '@feng3d/reactivity';
import { RenderObject, RenderPass, RenderPassDescriptor, RenderPipeline, Submit } from '@feng3d/webgpu';
import { RenderBundle, WebGPU } from '@feng3d/webgpu';
import { GUI } from 'dat.gui';

import animometerWGSL from './animometer.wgsl';

const init = async (canvas: HTMLCanvasElement, gui: GUI) =>
{
    const perfDisplayContainer = document.createElement('div');

    perfDisplayContainer.style.color = 'white';
    perfDisplayContainer.style.background = 'black';
    perfDisplayContainer.style.position = 'absolute';
    perfDisplayContainer.style.top = '10px';
    perfDisplayContainer.style.left = '10px';

    const perfDisplay = document.createElement('pre');

    perfDisplayContainer.appendChild(perfDisplay);
    canvas.parentNode.appendChild(perfDisplayContainer);

    const params = new URLSearchParams(window.location.search);
    const maxTriangles = 200000;
    const settings = {
        numTriangles: Number(params.get('numTriangles')) || 20000,
        renderBundles: Boolean(params.get('renderBundles')),
    };

    const devicePixelRatio = window.devicePixelRatio || 1;

    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;

    const webgpu = await new WebGPU().init();

    const vec4Size = 4 * Float32Array.BYTES_PER_ELEMENT;

    const pipelineDesc: RenderPipeline = {
        vertex: {
            code: animometerWGSL,
        },
        fragment: {
            code: animometerWGSL,
        },
        primitive: {
            frontFace: 'ccw',
        },
    };

    const pipeline: RenderPipeline = {
        ...pipelineDesc,
    };

    const vertexBuffer = new Float32Array([
        // position data  /**/ color data
        0, 0.1, 0, 1, /**/ 1, 0, 0, 1,
        -0.1, -0.1, 0, 1, /**/ 0, 1, 0, 1,
        0.1, -0.1, 0, 1, /**/ 0, 0, 1, 1,
    ]);

    const renderObject: RenderObject = {
        pipeline: pipeline,
        bindingResources: {},
        vertices: {
            position: { data: vertexBuffer, format: 'float32x4', offset: 0, arrayStride: 2 * vec4Size },
            color: { data: vertexBuffer, format: 'float32x4', offset: vec4Size, arrayStride: 2 * vec4Size },
        },
        draw: { __type__: 'DrawVertex', vertexCount: 3, instanceCount: 1 },
    };

    const uniformBytes = 5 * Float32Array.BYTES_PER_ELEMENT;
    const alignedUniformBytes = Math.ceil(uniformBytes / 256) * 256;
    const alignedUniformFloats = alignedUniformBytes / Float32Array.BYTES_PER_ELEMENT;
    const uniformBuffer = new Float32Array(
        maxTriangles * alignedUniformBytes + Float32Array.BYTES_PER_ELEMENT,
    );

    for (let i = 0; i < maxTriangles; ++i)
    {
        uniformBuffer[alignedUniformFloats * i + 0] = Math.random() * 0.2 + 0.2; // scale
        uniformBuffer[alignedUniformFloats * i + 1] = 0.9 * 2 * (Math.random() - 0.5); // offsetX
        uniformBuffer[alignedUniformFloats * i + 2] = 0.9 * 2 * (Math.random() - 0.5); // offsetY
        uniformBuffer[alignedUniformFloats * i + 3] = Math.random() * 1.5 + 0.5; // scalar
        uniformBuffer[alignedUniformFloats * i + 4] = Math.random() * 10; // scalarOffset
    }

    const timeOffset = maxTriangles * alignedUniformBytes;

    const time = {
        bufferView: new Float32Array(uniformBuffer.buffer, timeOffset, 1),
        value: { value: 0 },
    };

    const renderObjects0: RenderObject[] = [];

    for (let i = 0; i < maxTriangles; ++i)
    {
        renderObjects0[i] = {
            ...renderObject,
            bindingResources: {
                time,
                uniforms: {
                    bufferView: new Float32Array(uniformBuffer.buffer, i * alignedUniformBytes, 5),
                },
            },
        };
    }

    const renderPassDescriptor: RenderPassDescriptor = {
        colorAttachments: [
            {
                view: { texture: { context: { canvasId: canvas.id } } },
                clearValue: [0.0, 0.0, 0.0, 1.0],
            },
        ],
    };

    function configure()
    {
        const numTriangles = settings.numTriangles;

        const renderObjects = renderObjects0.slice(0, numTriangles);

        let startTime: number;
        const uniformTime = new Float32Array([0]);

        const renderBundleObject: RenderBundle = {
            __type__: 'RenderBundle',
            renderObjects,
        };

        const renderPasss: RenderPass[] = [];
        const submit: Submit = {
            commandEncoders: [
                {
                    passEncoders: renderPasss,
                },
            ],
        };

        const renderBundlesPass: RenderPass = {
            descriptor: renderPassDescriptor,
            renderPassObjects: [renderBundleObject],
        };

        const renderPass: RenderPass = {
            descriptor: renderPassDescriptor,
            renderPassObjects: renderObjects,
        };

        return function doDraw(timestamp: number)
        {
            if (startTime === undefined)
            {
                startTime = timestamp;
            }
            uniformTime[0] = (timestamp - startTime) / 1000;

            reactive(time.value).value = uniformTime[0];

            if (settings.renderBundles)
            {
                renderPasss[0] = renderBundlesPass;
            }
            else
            {
                renderPasss[0] = renderPass;
            }

            webgpu.submit(submit);
        };
    }

    let doDraw = configure();

    const updateSettings = () =>
    {
        doDraw = configure();
    };

    gui
        .add(settings, 'numTriangles', 0, maxTriangles)
        .step(1)
        .onFinishChange(updateSettings);
    gui.add(settings, 'renderBundles');

    let previousFrameTimestamp: number;
    let jsTimeAvg: number;
    let frameTimeAvg: number;
    let updateDisplay = true;

    function frame(timestamp: number)
    {
        let frameTime = 0;

        if (previousFrameTimestamp !== undefined)
        {
            frameTime = timestamp - previousFrameTimestamp;
        }
        previousFrameTimestamp = timestamp;

        const start = performance.now();

        doDraw(timestamp);
        const jsTime = performance.now() - start;

        if (frameTimeAvg === undefined)
        {
            frameTimeAvg = frameTime;
        }
        if (jsTimeAvg === undefined)
        {
            jsTimeAvg = jsTime;
        }

        const w = 0.2;

        frameTimeAvg = (1 - w) * frameTimeAvg + w * frameTime;
        jsTimeAvg = (1 - w) * jsTimeAvg + w * jsTime;

        if (updateDisplay)
        {
            perfDisplay.innerHTML = `Avg Javascript: ${jsTimeAvg.toFixed(
                2,
            )} ms\nAvg Frame: ${frameTimeAvg.toFixed(2)} ms`;
            updateDisplay = false;
            setTimeout(() =>
            {
                updateDisplay = true;
            }, 100);
        }
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
};

const panel = new GUI({ width: 310 });
const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;

init(webgpuCanvas, panel);
