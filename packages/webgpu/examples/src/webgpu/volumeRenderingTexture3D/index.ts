import { reactive } from '@feng3d/reactivity';
import { BindingResources, RenderPassDescriptor, RenderPipeline, Sampler, Submit, Texture } from '@feng3d/webgpu';
import { WebGPU } from '@feng3d/webgpu';
import { GUI } from 'dat.gui';
import { mat4 } from 'wgpu-matrix';

import volumeWGSL from './volume.wgsl';

const gui = new GUI();

const init = async (canvas: HTMLCanvasElement) =>
{
    const devicePixelRatio = window.devicePixelRatio || 1;

    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;

    const webgpu = await new WebGPU().init();

    // GUI parameters
    const params: { rotateCamera: boolean; near: number; far: number } = {
        rotateCamera: true,
        near: 2.0,
        far: 7.0,
    };

    gui.add(params, 'rotateCamera', true);
    gui.add(params, 'near', 2.0, 7.0);
    gui.add(params, 'far', 2.0, 7.0);

    const sampleCount = 4;

    const pipeline: RenderPipeline = {
        vertex: {
            code: volumeWGSL,
        },
        fragment: {
            code: volumeWGSL,
        },
        primitive: {
            topology: 'triangle-list',
            cullFace: 'back',
        },
    };

    const uniformBuffer = {
        inverseModelViewProjectionMatrix: new Float32Array(16) as Float32Array,
    };

    // Fetch the image and upload it into a GPUTexture.
    let volumeTexture: Texture;

    {
        const width = 180;
        const height = 216;
        const depth = 180;
        const format: GPUTextureFormat = 'r8unorm';
        const blockLength = 1;
        const bytesPerBlock = 1;
        const blocksWide = Math.ceil(width / blockLength);
        const blocksHigh = Math.ceil(height / blockLength);
        const bytesPerRow = blocksWide * bytesPerBlock;
        const dataPath
            = '../../../assets/img/volume/t1_icbm_normal_1mm_pn0_rf0_180x216x180_uint8_1x1.bin-gz';

        // Fetch the compressed data
        const response = await fetch(dataPath);
        const compressedArrayBuffer = await response.arrayBuffer();

        // Decompress the data using DecompressionStream for gzip format
        const decompressionStream = new DecompressionStream('gzip');
        const decompressedStream = new Response(
            compressedArrayBuffer,
        ).body.pipeThrough(decompressionStream);
        const decompressedArrayBuffer = await new Response(
            decompressedStream,
        ).arrayBuffer();
        const byteArray = new Uint8Array(decompressedArrayBuffer);

        volumeTexture = {
            descriptor: {
                dimension: '3d',
                size: [width, height, depth],
                format,
            },
            sources: [{
                __type__: 'TextureDataSource',
                data: byteArray,
                dataLayout: { width, height },
                size: [width, height, depth],
            }],
        };
    }

    // Create a sampler with linear filtering for smooth interpolation.
    const sampler: Sampler = {
        magFilter: 'linear',
        minFilter: 'linear',
        mipmapFilter: 'linear',
        maxAnisotropy: 16,
    };

    const uniformBindGroup: BindingResources = {
        uniforms: { value: uniformBuffer },
        mySampler: sampler,
        myTexture: { texture: volumeTexture },
    };

    const renderPassDescriptor: RenderPassDescriptor = {
        colorAttachments: [
            {
                view: { texture: { context: { canvasId: canvas.id } } }, // Assigned later

                clearValue: [0.5, 0.5, 0.5, 1.0],
                loadOp: 'clear',
                storeOp: 'discard',
            },
        ],
        sampleCount,
    };

    let rotation = 0;

    function getInverseModelViewProjectionMatrix(deltaTime: number)
    {
        const viewMatrix = mat4.identity();

        mat4.translate(viewMatrix, [0, 0, -4], viewMatrix);
        if (params.rotateCamera)
        {
            rotation += deltaTime;
        }
        mat4.rotate(
            viewMatrix,
            [Math.sin(rotation), Math.cos(rotation), 0],
            1,
            viewMatrix,
        );

        const aspect = canvas.width / canvas.height;
        const projectionMatrix = mat4.perspective(
            (2 * Math.PI) / 5,
            aspect,
            params.near,
            params.far,
        );
        const modelViewProjectionMatrix = mat4.multiply(projectionMatrix, viewMatrix);

        return mat4.invert(modelViewProjectionMatrix);
    }

    let lastFrameMS = Date.now();

    const submit: Submit = {
        commandEncoders: [{
            passEncoders: [{
                descriptor: renderPassDescriptor,
                renderPassObjects: [{
                    pipeline,
                    bindingResources: uniformBindGroup,
                    draw: { __type__: 'DrawVertex', vertexCount: 3 },
                }],
            }],
        }],
    };

    function frame()
    {
        const now = Date.now();
        const deltaTime = (now - lastFrameMS) / 1000;

        lastFrameMS = now;

        const inverseModelViewProjection
            = getInverseModelViewProjectionMatrix(deltaTime);

        reactive(uniformBuffer).inverseModelViewProjectionMatrix = inverseModelViewProjection;

        webgpu.submit(submit);

        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
};

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;

init(webgpuCanvas);
