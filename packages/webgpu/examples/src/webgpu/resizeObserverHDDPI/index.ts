import { GUI } from 'dat.gui';
import checkerWGSL from './checker.wgsl';

import { reactive } from '@feng3d/reactivity';
import { BindingResources, RenderPassDescriptor, RenderPipeline, Submit } from '@feng3d/webgpu';
import { WebGPU } from '@feng3d/webgpu';

const init = async (canvas: HTMLCanvasElement) =>
{
    const webgpu = await new WebGPU().init();

    const pipeline: RenderPipeline = {
        vertex: { code: checkerWGSL },
        fragment: {
            code: checkerWGSL,
        },
    };

    const uni = {
        color0: undefined,
        color1: undefined,
        size: undefined,
    };

    const bindGroup: BindingResources = {
        uni: { value: uni },
    };

    const settings = {
        color0: '#FF0000',
        color1: '#00FFFF',
        size: 1,
        resizable: false,
        fullscreen()
        {
            if (document.fullscreenElement)
            {
                document.exitFullscreen();
            }
            else
            {
                document.body.requestFullscreen();
            }
        },
    };

    const containerElem = document.querySelector('#container') as HTMLElement;

    const gui = new GUI();

    gui.addColor(settings, 'color0').onChange(frame);
    gui.addColor(settings, 'color1').onChange(frame);
    gui.add(settings, 'size', 1, 32, 1).name('checker size').onChange(frame);
    gui.add(settings, 'fullscreen');
    gui.add(settings, 'resizable').onChange(() =>
    {
        const { resizable } = settings;
        // Get these before we adjust the CSS because our canvas is sized in device pixels
        // and so will expand if we stop constraining it with CSS
        const width = containerElem.clientWidth;
        const height = containerElem.clientHeight;

        containerElem.classList.toggle('resizable', resizable);
        containerElem.classList.toggle('fit-container', !resizable);

        containerElem.style.width = resizable ? `${width}px` : '';
        containerElem.style.height = resizable ? `${height}px` : '';
    });

    // Given a CSS color, returns the color in 0 to 1 RGBA values.
    const cssColorToRGBA = (function ()
    {
        const ctx = new OffscreenCanvas(1, 1).getContext('2d', {
            willReadFrequently: true,
        });

        return function (color: string)
        {
            ctx.clearRect(0, 0, 1, 1);
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, 1, 1);

            return [...ctx.getImageData(0, 0, 1, 1).data].map((v) => v / 255);
        };
    })();

    const renderPassDescriptor: RenderPassDescriptor = {
        colorAttachments: [
            {
                view: { texture: { context: { canvasId: canvas.id } } },
                clearValue: [0.2, 0.2, 0.2, 1.0],
                loadOp: 'clear',
                storeOp: 'store',
            },
        ],
    };

    const submit: Submit = {
        commandEncoders: [{
            passEncoders: [{
                descriptor: renderPassDescriptor,
                renderPassObjects: [{
                    pipeline: pipeline,
                    bindingResources: bindGroup,
                    draw: { __type__: 'DrawVertex', vertexCount: 3 },
                }],
            }],
        }],
    };

    function frame()
    {
        reactive(uni).color0 = cssColorToRGBA(settings.color0);
        reactive(uni).color1 = cssColorToRGBA(settings.color1);
        reactive(uni).size = settings.size;

        webgpu.submit(submit);
    }

    function getDevicePixelContentBoxSize(entry: ResizeObserverEntry)
    {
        // Safari does not support devicePixelContentBoxSize
        if (entry.devicePixelContentBoxSize)
        {
            return {
                width: entry.devicePixelContentBoxSize[0].inlineSize,
                height: entry.devicePixelContentBoxSize[0].blockSize,
            };
        }

        // These values not correct but they're as close as you can get in Safari
        return {
            width: entry.contentBoxSize[0].inlineSize * devicePixelRatio,
            height: entry.contentBoxSize[0].blockSize * devicePixelRatio,
        };
    }

    const { maxTextureDimension2D } = webgpu.device.limits;
    const observer = new ResizeObserver(([entry]) =>
    {
        // Note: If you are using requestAnimationFrame you should
        // only record the size here but set it in the requestAnimationFrame callback
        // otherwise you'll get flicker when resizing.
        const { width, height } = getDevicePixelContentBoxSize(entry);

        // A size of 0 will cause an error when we call getCurrentTexture.
        // A size > maxTextureDimension2D will also an error when we call getCurrentTexture.
        canvas.width = Math.max(1, Math.min(width, maxTextureDimension2D));
        canvas.height = Math.max(1, Math.min(height, maxTextureDimension2D));
        frame();
    });

    observer.observe(canvas);
};

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;

init(webgpuCanvas);
