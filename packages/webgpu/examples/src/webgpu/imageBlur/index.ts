import { reactive } from '@feng3d/reactivity';
import { BindingResources, Buffer, RenderPass, RenderPassDescriptor, RenderPipeline, Sampler, Submit, Texture } from '@feng3d/webgpu';
import { ComputePass, ComputePipeline, WebGPU } from '@feng3d/webgpu';
import { GUI } from 'dat.gui';

import fullscreenTexturedQuadWGSL from '../../shaders/fullscreenTexturedQuad.wgsl';
import blurWGSL from './blur.wgsl';

// Contants from the blur.wgsl shader.
const tileDim = 128;
const batch = [4, 4];

const init = async (canvas: HTMLCanvasElement, gui: GUI) =>
{
    const devicePixelRatio = window.devicePixelRatio || 1;

    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;

    const webgpu = await new WebGPU().init();

    const blurPipeline: ComputePipeline = {
        compute: {
            code: blurWGSL,
        },
    };

    const fullscreenQuadPipeline1: RenderPipeline = {
        vertex: {
            code: fullscreenTexturedQuadWGSL,
        },
        fragment: {
            code: fullscreenTexturedQuadWGSL,
        },
    };

    const sampler: Sampler = {
        magFilter: 'linear',
        minFilter: 'linear',
    };

    const img = document.createElement('img');

    img.src = new URL(
        '../../../assets/img/Di-3d.png',
        import.meta.url,
    ).toString();
    await img.decode();
    const imageBitmap = await createImageBitmap(img);

    const [srcWidth, srcHeight] = [imageBitmap.width, imageBitmap.height];
    const cubeTexture1: Texture = {
        descriptor: {
            size: [imageBitmap.width, imageBitmap.height],
            format: 'rgba8unorm',
        },
        sources: [{ image: imageBitmap }],
    };

    const textures: Texture[] = [0, 1].map(() => ({
        descriptor: {
            size: [srcWidth, srcHeight],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
        },
    } as Texture));

    const buffer0 = new Uint32Array([0]);

    const buffer1 = new Uint32Array([1]);

    const blurParamsBuffer = new Uint8Array(8);

    const computeConstants: BindingResources = {
        samp: sampler,
        params: {
            bufferView: blurParamsBuffer,
        },
    };

    const computeBindGroup0: BindingResources = {
        inputTex: { texture: cubeTexture1 },
        outputTex: { texture: textures[0] },
        flip: {
            bufferView: buffer0,
        },
    };

    const computeBindGroup1: BindingResources = {
        inputTex: { texture: textures[0] },
        outputTex: { texture: textures[1] },
        flip: {
            bufferView: buffer1,
        },
    };

    const computeBindGroup2: BindingResources = {
        inputTex: { texture: textures[1] },
        outputTex: { texture: textures[0] },
        flip: {
            bufferView: buffer0,
        },
    };

    const showResultBindGroup1: BindingResources = {
        mySampler: sampler,
        myTexture: { texture: textures[1] },
    };

    const settings = {
        filterSize: 15,
        iterations: 2,
    };

    // 是否需要更新编码器。
    let needUpdateEncoder = true;
    let blockDim: number;
    const updateSettings = () =>
    {
        blockDim = tileDim - (settings.filterSize - 1);
        if (Buffer.getBuffer(blurParamsBuffer.buffer).writeBuffers)
        {
            Buffer.getBuffer(blurParamsBuffer.buffer).writeBuffers.push({ data: new Uint32Array([settings.filterSize, blockDim]) });
        }
        else
        {
            reactive(Buffer.getBuffer(blurParamsBuffer.buffer)).writeBuffers = [{ data: new Uint32Array([settings.filterSize, blockDim]) }];
        }
        needUpdateEncoder = true;
    };

    gui.add(settings, 'filterSize', 1, 33).step(2).onChange(updateSettings);
    gui.add(settings, 'iterations', 1, 10).step(1).onChange(() =>
    {
        needUpdateEncoder = true;
    });

    updateSettings();

    const renderPassDescriptor: RenderPassDescriptor = {
        colorAttachments: [
            {
                view: { texture: { context: { canvasId: canvas.id } } },
                clearValue: [0.0, 0.0, 0.0, 1.0],
            },
        ],
    };

    const gpuRenderPassEncoder: RenderPass = {
        descriptor: renderPassDescriptor,
        renderPassObjects: [{
            pipeline: fullscreenQuadPipeline1,
            bindingResources: showResultBindGroup1,
            draw: { __type__: 'DrawVertex', vertexCount: 6, instanceCount: 1, firstVertex: 0, firstInstance: 0 },
        }],
    };

    const gpuComputePassEncoder: ComputePass = { __type__: 'ComputePass', computeObjects: [] };
    const submit: Submit = {
        commandEncoders: [
            {
                passEncoders: [
                    gpuComputePassEncoder,
                    gpuRenderPassEncoder,
                ],
            },
        ],
    };

    const bindingResources0: BindingResources = {
        ...computeConstants,
        ...computeBindGroup0,
    };
    const bindingResources1: BindingResources = {
        ...computeConstants,
        ...computeBindGroup1,
    };
    const bindingResources2: BindingResources = {
        ...computeConstants,
        ...computeBindGroup2,
    };

    function updateComputePassEncoder()
    {
        if (!gpuComputePassEncoder) return;

        gpuComputePassEncoder.computeObjects = [
            {
                pipeline: blurPipeline,
                bindingResources: bindingResources0,
                workgroups: { workgroupCountX: Math.ceil(srcWidth / blockDim), workgroupCountY: Math.ceil(srcHeight / batch[1]) },
            },
            {
                pipeline: blurPipeline,
                bindingResources: bindingResources1,
                workgroups: { workgroupCountX: Math.ceil(srcHeight / blockDim), workgroupCountY: Math.ceil(srcWidth / batch[1]) },
            },
        ];

        for (let i = 0; i < settings.iterations - 1; ++i)
        {
            gpuComputePassEncoder.computeObjects.push(
                {
                    pipeline: blurPipeline,
                    bindingResources: bindingResources2,
                    workgroups: { workgroupCountX: Math.ceil(srcWidth / blockDim), workgroupCountY: Math.ceil(srcHeight / batch[1]) },
                },
            );

            gpuComputePassEncoder.computeObjects.push(
                {
                    pipeline: blurPipeline,
                    bindingResources: bindingResources1,
                    workgroups: { workgroupCountX: Math.ceil(srcHeight / blockDim), workgroupCountY: Math.ceil(srcWidth / batch[1]) },
                },
            );
        }
    }

    function frame()
    {
        if (needUpdateEncoder)
        {
            updateComputePassEncoder();
        }

        webgpu.submit(submit);

        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
};

const panel = new GUI({ width: 310 });
const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;

init(webgpuCanvas, panel);
