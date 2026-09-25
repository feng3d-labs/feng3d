import { RenderObject, RenderPassDescriptor, Sampler, Submit } from '@feng3d/webgpu';
import { WebGPU } from '@feng3d/webgpu';

import fullscreenTexturedQuadWGSL from '../../shaders/fullscreenTexturedQuad.wgsl';
import sampleExternalTextureWGSL from '../../shaders/sampleExternalTexture.frag.wgsl';

const init = async (canvas: HTMLCanvasElement) =>
{
    // Set video element
    const video = document.createElement('video');

    video.loop = true;
    video.autoplay = true;
    video.muted = true;
    video.src = new URL(
        '../../../assets/video/pano.webm',
        import.meta.url,
    ).toString();
    await video.play();

    const devicePixelRatio = window.devicePixelRatio || 1;

    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;

    const webgpu = await new WebGPU().init();

    const sampler: Sampler = {
        magFilter: 'linear',
        minFilter: 'linear',
    };

    const renderPass: RenderPassDescriptor = {
        colorAttachments: [
            {
                view: { texture: { context: { canvasId: canvas.id } } },
                clearValue: [0.0, 0.0, 0.0, 1.0],
            },
        ],
    };

    const renderObject: RenderObject = {
        pipeline: {
            vertex: { code: fullscreenTexturedQuadWGSL }, fragment: { code: sampleExternalTextureWGSL },
        },
        bindingResources: {
            mySampler: sampler,
            myTexture: {
                source: video,
            },
        },
        draw: { __type__: 'DrawVertex', vertexCount: 6 },
    };

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
        webgpu.submit(data);

        if ('requestVideoFrameCallback' in video)
        {
            video.requestVideoFrameCallback(frame);
        }
        else
        {
            requestAnimationFrame(frame);
        }
    }

    if ('requestVideoFrameCallback' in video)
    {
        video.requestVideoFrameCallback(frame);
    }
    else
    {
        requestAnimationFrame(frame);
    }
};

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;

init(webgpuCanvas);
