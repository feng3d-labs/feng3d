import { reactive } from '@feng3d/reactivity';
import { BindingResources, Buffer, RenderPassDescriptor, RenderPassObject, RenderPipeline, Sampler, Submit, Texture, TextureSource } from '@feng3d/webgpu';
import { WebGPU } from '@feng3d/webgpu';
import { GUI } from 'dat.gui';
import { mat4 } from 'wgpu-matrix';

import showTextureWGSL from './showTexture.wgsl';
import texturedSquareWGSL from './texturedSquare.wgsl';

const kMatrices: Readonly<Float32Array> = new Float32Array([
    // Row 1: Scale by 2
    ...mat4.scale(mat4.rotationZ(Math.PI / 16), [2, 2, 1]),
    ...mat4.scale(mat4.identity(), [2, 2, 1]),
    ...mat4.scale(mat4.rotationX(-Math.PI * 0.3), [2, 2, 1]),
    ...mat4.scale(mat4.rotationX(-Math.PI * 0.42), [2, 2, 1]),
    // Row 2: Scale by 1
    ...mat4.rotationZ(Math.PI / 16),
    ...mat4.identity(),
    ...mat4.rotationX(-Math.PI * 0.3),
    ...mat4.rotationX(-Math.PI * 0.42),
    // Row 3: Scale by 0.9
    ...mat4.scale(mat4.rotationZ(Math.PI / 16), [0.9, 0.9, 1]),
    ...mat4.scale(mat4.identity(), [0.9, 0.9, 1]),
    ...mat4.scale(mat4.rotationX(-Math.PI * 0.3), [0.9, 0.9, 1]),
    ...mat4.scale(mat4.rotationX(-Math.PI * 0.42), [0.9, 0.9, 1]),
    // Row 4: Scale by 0.3
    ...mat4.scale(mat4.rotationZ(Math.PI / 16), [0.3, 0.3, 1]),
    ...mat4.scale(mat4.identity(), [0.3, 0.3, 1]),
    ...mat4.scale(mat4.rotationX(-Math.PI * 0.3), [0.3, 0.3, 1]),
]);

const init = async (canvas: HTMLCanvasElement, gui: GUI) =>
{
    //
    // GUI controls
    //

    const kInitConfig = {
        flangeLogSize: 1.0,
        highlightFlange: false,
        animation: 0.1,
    } as const;
    const config = { ...kInitConfig };
    const updateConfigBuffer = () =>
    {
        const t = (performance.now() / 1000) * 0.5;
        const data = new Float32Array([
            Math.cos(t) * config.animation,
            Math.sin(t) * config.animation,
            (2 ** config.flangeLogSize - 1) / 2,
            Number(config.highlightFlange),
        ]);

        if (Buffer.getBuffer(bufConfig.buffer).writeBuffers)
        {
            Buffer.getBuffer(bufConfig.buffer).writeBuffers.push({ bufferOffset: 64, data });
        }
        else
        {
            reactive(Buffer.getBuffer(bufConfig.buffer)).writeBuffers = [{ bufferOffset: 64, data }];
        }
    };

    const kInitSamplerDescriptor = {
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
        magFilter: 'linear',
        minFilter: 'linear',
        mipmapFilter: 'linear',
        lodMinClamp: 0,
        lodMaxClamp: 4,
        maxAnisotropy: 1,
    } as const;

    const samplerDescriptor: Sampler = { ...kInitSamplerDescriptor };
    const r_samplerDescriptor: Sampler = reactive(samplerDescriptor);

    {
        const buttons = {
            initial()
            {
                Object.assign(config, kInitConfig);
                Object.assign(r_samplerDescriptor, kInitSamplerDescriptor);
                gui.updateDisplay();
            },
            checkerboard()
            {
                Object.assign(config, { flangeLogSize: 10 });
                Object.assign(r_samplerDescriptor, {
                    addressModeU: 'repeat',
                    addressModeV: 'repeat',
                });
                gui.updateDisplay();
            },
            smooth()
            {
                Object.assign(r_samplerDescriptor, {
                    magFilter: 'linear',
                    minFilter: 'linear',
                    mipmapFilter: 'linear',
                });
                gui.updateDisplay();
            },
            crunchy()
            {
                Object.assign(r_samplerDescriptor, {
                    magFilter: 'nearest',
                    minFilter: 'nearest',
                    mipmapFilter: 'nearest',
                });
                gui.updateDisplay();
            },
        };
        const presets = gui.addFolder('Presets');

        presets.open();
        presets.add(buttons, 'initial').name('reset to initial');
        presets.add(buttons, 'checkerboard').name('checkered floor');
        presets.add(buttons, 'smooth').name('smooth (linear)');
        presets.add(buttons, 'crunchy').name('crunchy (nearest)');

        const flangeFold = gui.addFolder('Plane settings');

        flangeFold.open();
        flangeFold.add(config, 'flangeLogSize', 0, 10.0, 0.1).name('size = 2**');
        flangeFold.add(config, 'highlightFlange');
        flangeFold.add(config, 'animation', 0, 0.5);

        gui.width = 280;
        {
            const folder = gui.addFolder('GPUSamplerDescriptor');

            folder.open();

            const kAddressModes = ['clamp-to-edge', 'repeat', 'mirror-repeat'];

            folder.add(r_samplerDescriptor, 'addressModeU', kAddressModes);
            folder.add(r_samplerDescriptor, 'addressModeV', kAddressModes);

            const kFilterModes = ['nearest', 'linear'];

            folder.add(r_samplerDescriptor, 'magFilter', kFilterModes);
            folder.add(r_samplerDescriptor, 'minFilter', kFilterModes);
            const kMipmapFilterModes = ['nearest', 'linear'] as const;

            folder.add(r_samplerDescriptor, 'mipmapFilter', kMipmapFilterModes);

            const ctlMin = folder.add(r_samplerDescriptor, 'lodMinClamp', 0, 4, 0.1);
            const ctlMax = folder.add(r_samplerDescriptor, 'lodMaxClamp', 0, 4, 0.1);

            ctlMin.onChange((value: number) =>
            {
                if (r_samplerDescriptor.lodMaxClamp < value) ctlMax.setValue(value);
            });
            ctlMax.onChange((value: number) =>
            {
                if (r_samplerDescriptor.lodMinClamp > value) ctlMin.setValue(value);
            });

            {
                const folder2 = folder.addFolder(
                    'maxAnisotropy (set only if all "linear")',
                );

                folder2.open();
                const kMaxAnisotropy = 16;

                folder2.add(r_samplerDescriptor, 'maxAnisotropy', 1, kMaxAnisotropy, 1);
            }
        }
    }

    //
    // Canvas setup
    //

    // Low-res, pixelated render target so it's easier to see fine details.
    const kCanvasSize = 200;
    const kViewportGridSize = 4;
    const kViewportGridStride = Math.floor(kCanvasSize / kViewportGridSize);
    const kViewportSize = kViewportGridStride - 2;

    // The canvas buffer size is 200x200.
    // Compute a canvas CSS size such that there's an integer number of device
    // pixels per canvas pixel ("integer" or "pixel-perfect" scaling).
    // Note the result may be 1 pixel off since ResizeObserver is not used.
    const kCanvasLayoutCSSSize = 600; // set by template styles
    const kCanvasLayoutDevicePixels = kCanvasLayoutCSSSize * devicePixelRatio;
    const kScaleFactor = Math.floor(kCanvasLayoutDevicePixels / kCanvasSize);
    const kCanvasDevicePixels = kScaleFactor * kCanvasSize;
    const kCanvasCSSSize = kCanvasDevicePixels / devicePixelRatio;

    canvas.style.imageRendering = 'pixelated';
    canvas.width = canvas.height = kCanvasSize;
    canvas.style.minWidth = canvas.style.maxWidth = `${kCanvasCSSSize}px`;

    const webgpu = await new WebGPU().init();

    //
    // Initialize test texture
    //

    // Set up a texture with 4 mip levels, each containing a differently-colored
    // checkerboard with 1x1 pixels (so when rendered the checkerboards are
    // different sizes). This is different from a normal mipmap where each level
    // would look like a lower-resolution version of the previous one.
    // Level 0 is 16x16 white/black
    // Level 1 is 8x8 blue/black
    // Level 2 is 4x4 yellow/black
    // Level 3 is 2x2 pink/black
    const kTextureMipLevels = 4;
    const kTextureBaseSize = 16;

    const kColorForLevel = [
        [255, 255, 255, 255],
        [30, 136, 229, 255], // blue
        [255, 193, 7, 255], // yellow
        [216, 27, 96, 255], // pink
    ];
    const writeTextures: TextureSource[] = [];

    for (let mipLevel = 0; mipLevel < kTextureMipLevels; ++mipLevel)
    {
        const size = 2 ** (kTextureMipLevels - mipLevel); // 16, 8, 4, 2
        const data = new Uint8Array(size * size * 4);

        for (let y = 0; y < size; ++y)
        {
            for (let x = 0; x < size; ++x)
            {
                data.set(
                    (x + y) % 2 ? kColorForLevel[mipLevel] : [0, 0, 0, 255],
                    (y * size + x) * 4,
                );
            }
        }
        writeTextures.push({
            __type__: 'TextureDataSource',
            mipLevel,
            data,
            dataLayout: { width: size },
            size: [size, size],
        });
    }
    const checkerboard: Texture = {
        descriptor: {
            format: 'rgba8unorm',
            size: [kTextureBaseSize, kTextureBaseSize],
            mipLevelCount: 4,
        },
        sources: writeTextures,
    };

    //
    // "Debug" view of the actual texture contents
    //

    const showTexturePipeline: RenderPipeline = {
        vertex: { code: showTextureWGSL }, fragment: { code: showTextureWGSL },
    };

    //
    // Pipeline for drawing the test squares
    //

    const texturedSquarePipeline: RenderPipeline = {
        vertex: { code: texturedSquareWGSL, constants: { kTextureBaseSize, kViewportSize } }, fragment: { code: texturedSquareWGSL },
    };

    // View-projection matrix set up so it doesn't transform anything at z=0.
    const kCameraDist = 3;
    const viewProj = mat4.translate(
        mat4.perspective(2 * Math.atan(1 / kCameraDist), 1, 0.1, 100),
        [0, 0, -kCameraDist],
    );
    const bufConfig = new Uint8Array(128);

    reactive(Buffer.getBuffer(bufConfig.buffer)).writeBuffers = [{ data: viewProj }];

    const bufMatrices = kMatrices;

    const renderPass: RenderPassDescriptor = {
        colorAttachments: [
            {
                view: { texture: { context: { canvasId: canvas.id } } },
                clearValue: [0.2, 0.2, 0.2, 1.0],
            },
        ],
    };

    const renderObjects: RenderPassObject[] = [];

    const bindingResources0: BindingResources = {
        config: { bufferView: bufConfig },
        matrices: { bufferView: bufMatrices },
        samp: samplerDescriptor, // 帧更新中设置
        tex: { texture: checkerboard },
    };

    for (let i = 0; i < kViewportGridSize ** 2 - 1; ++i)
    {
        const vpX = kViewportGridStride * (i % kViewportGridSize) + 1;
        const vpY = kViewportGridStride * Math.floor(i / kViewportGridSize) + 1;

        renderObjects.push(
            {
                viewport: { isYup: false, x: vpX, y: vpY, width: kViewportSize, height: kViewportSize, minDepth: 0, maxDepth: 1 },
                pipeline: texturedSquarePipeline,
                bindingResources: bindingResources0,
                draw: { __type__: 'DrawVertex', vertexCount: 6, instanceCount: 1, firstVertex: 0, firstInstance: i },
            },
        );
    }

    const bindingResources1: BindingResources = {
        tex: { texture: checkerboard },
    };
    const kLastViewport = (kViewportGridSize - 1) * kViewportGridStride + 1;

    renderObjects.push(
        {
            viewport: { isYup: false, x: kLastViewport, y: kLastViewport, width: 32, height: 32, minDepth: 0, maxDepth: 1 },
            pipeline: showTexturePipeline,
            bindingResources: bindingResources1,
            draw: { __type__: 'DrawVertex', vertexCount: 6, instanceCount: 1, firstVertex: 0, firstInstance: 0 },
        },
    );
    renderObjects.push(
        {
            viewport: { isYup: false, x: kLastViewport + 32, y: kLastViewport, width: 16, height: 16, minDepth: 0, maxDepth: 1 },
            pipeline: showTexturePipeline,
            bindingResources: bindingResources1,
            draw: { __type__: 'DrawVertex', vertexCount: 6, instanceCount: 1, firstVertex: 0, firstInstance: 1 },
        },
    );
    renderObjects.push(
        {
            viewport: { isYup: false, x: kLastViewport + 32, y: kLastViewport + 16, width: 8, height: 8, minDepth: 0, maxDepth: 1 },
            pipeline: showTexturePipeline,
            bindingResources: bindingResources1,
            draw: { __type__: 'DrawVertex', vertexCount: 6, instanceCount: 1, firstVertex: 0, firstInstance: 3 },
        },
    );
    renderObjects.push(
        {
            viewport: { isYup: false, x: kLastViewport + 32, y: kLastViewport + 24, width: 4, height: 4, minDepth: 0, maxDepth: 1 },
            pipeline: showTexturePipeline,
            bindingResources: bindingResources1,
            draw: { __type__: 'DrawVertex', vertexCount: 6, instanceCount: 1, firstVertex: 0, firstInstance: 2 },
        },
    );

    const submit: Submit = {
        commandEncoders: [
            {
                passEncoders: [
                    {
                        descriptor: renderPass,
                        renderPassObjects: renderObjects,
                    },
                ],
            },
        ],
    };

    function frame()
    {
        updateConfigBuffer();

        webgpu.submit(submit);

        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
};

const panel = new GUI({ width: 310 });
const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;

init(webgpuCanvas, panel);
