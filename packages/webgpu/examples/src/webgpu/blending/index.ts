import { reactive } from '@feng3d/reactivity';
import { BindingResources, CanvasContext, Color, RenderObject, RenderPassDescriptor, RenderPassObject, RenderPipeline, Sampler, Submit, Texture, TextureView } from '@feng3d/webgpu';
import { WebGPU } from '@feng3d/webgpu';
import { GUI } from 'dat.gui';
import { mat4 } from 'wgpu-matrix';

import texturedQuadWGSL from './texturedQuad.wgsl';

declare module '@feng3d/webgpu'
{
    interface Uniforms
    {
        matrix?: Float32Array;
    }
}

const init = async (canvas: HTMLCanvasElement, gui: GUI) =>
{
    // creates a CSS hsl string from 3 normalized numbers (0 to 1)
    const hsl = (hue: number, saturation: number, lightness: number) =>
        `hsl(${(hue * 360) | 0}, ${saturation * 100}%, ${(lightness * 100) | 0}%)`;

    // creates a CSS hsla string from 4 normalized numbers (0 to 1)
    const hsla = (
        hue: number,
        saturation: number,
        lightness: number,
        alpha: number,
    ) =>
        // prettier-ignore
        `hsla(${(hue * 360) | 0}, ${saturation * 100}%, ${(lightness * 100) | 0}%, ${alpha})`;

    // Generates a canvas with 3 circles of different colors with blurred edges.
    function createSourceImage(size: number)
    {
        const canvas = document.createElement('canvas');

        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.translate(size / 2, size / 2);

        ctx.globalCompositeOperation = 'screen';
        const numCircles = 3;

        for (let i = 0; i < numCircles; ++i)
        {
            ctx.rotate((Math.PI * 2) / numCircles);
            ctx.save();
            ctx.translate(size / 6, 0);
            ctx.beginPath();

            const radius = size / 3;

            ctx.arc(0, 0, radius, 0, Math.PI * 2);

            const gradient = ctx.createRadialGradient(0, 0, radius / 2, 0, 0, radius);
            const h = i / numCircles;

            gradient.addColorStop(0.5, hsla(h, 1, 0.5, 1));
            gradient.addColorStop(1, hsla(h, 1, 0.5, 0));

            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.restore();
        }

        return canvas;
    }

    // Generates a canvas with alternating colored and transparent stripes
    function createDestinationImage(size: number)
    {
        const canvas = document.createElement('canvas');

        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createLinearGradient(0, 0, size, size);

        for (let i = 0; i <= 6; ++i)
        {
            gradient.addColorStop(i / 6, hsl(i / -6, 1, 0.5));
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);

        ctx.fillStyle = 'rgba(0, 0, 0, 255)';
        ctx.globalCompositeOperation = 'destination-out';
        ctx.rotate(Math.PI / -4);
        for (let i = 0; i < size * 2; i += 32)
        {
            ctx.fillRect(-size, i, size * 2, 16);
        }

        return canvas;
    }

    // make 2 canvas elements, 300x300 with images in them.
    // We'll copy these to textures.
    const size = 300;
    const srcCanvas = createSourceImage(size);
    const dstCanvas = createDestinationImage(size);

    const devicePixelRatio = window.devicePixelRatio || 1;

    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;

    const context: CanvasContext = { canvasId: canvas.id, configuration: {} };
    const canvasTexture: TextureView = { texture: { context } };

    // Get a WebGPU context from the canvas and configure it
    const webgpu = await new WebGPU().init();

    function createTextureFromSource(
        source: HTMLCanvasElement,
        options: {
            flipY?: boolean;
            premultipliedAlpha?: boolean;
        } = {},
    )
    {
        const { flipY, premultipliedAlpha } = options;
        const texture: Texture = {
            descriptor: {
                format: 'rgba8unorm',
                size: [source.width, source.height],
            },
            sources: [{ image: source, flipY, premultipliedAlpha }],
        };

        return texture;
    }

    // create 2 textures with unpremultiplied alpha
    const srcTextureUnpremultipliedAlpha = createTextureFromSource(
        srcCanvas,
    );
    const dstTextureUnpremultipliedAlpha = createTextureFromSource(
        dstCanvas,
    );

    // create 2 textures with premultiplied alpha
    const srcTexturePremultipliedAlpha = createTextureFromSource(
        srcCanvas,
        { premultipliedAlpha: true },
    );
    const dstTexturePremultipliedAlpha = createTextureFromSource(
        dstCanvas,
        { premultipliedAlpha: true },
    );

    const sampler: Sampler = {
        magFilter: 'linear',
        minFilter: 'linear',
        mipmapFilter: 'linear',
    };

    // function makeUniformBufferAndValues(): Uniforms
    // {
    //     // offsets to the various uniform values in float32 indices
    //     const kMatrixOffset = 0;

    //     // create a buffer for the uniform values
    //     const uniformBufferSize = 16 * 4; // matrix is 16 32bit floats (4bytes each)

    //     // create a typedarray to hold the values for the uniforms in JavaScript
    //     const values = new Float32Array(uniformBufferSize / 4);
    //     const matrix = values.subarray(kMatrixOffset, 16);
    //     return { values, matrix };
    // }
    // const srcUniform = makeUniformBufferAndValues();
    // const dstUniform = makeUniformBufferAndValues();
    const srcUniform = { value: { matrix: new Float32Array(16) } };
    const dstUniform = { value: { matrix: new Float32Array(16) } };

    const srcBindGroupUnpremultipliedAlpha: BindingResources = {
        ourSampler: sampler,
        ourTexture: { texture: srcTextureUnpremultipliedAlpha },
        uni: srcUniform,
    };

    const dstBindGroupUnpremultipliedAlpha: BindingResources = {
        ourSampler: sampler,
        ourTexture: { texture: dstTextureUnpremultipliedAlpha },
        uni: dstUniform,
    };

    const srcBindGroupPremultipliedAlpha: BindingResources = {
        ourSampler: sampler,
        ourTexture: { texture: srcTexturePremultipliedAlpha },
        uni: srcUniform,
    };

    const dstBindGroupPremultipliedAlpha: BindingResources = {
        ourSampler: sampler,
        ourTexture: { texture: dstTexturePremultipliedAlpha },
        uni: dstUniform,
    };

    const textureSets = [
        {
            srcTexture: srcTexturePremultipliedAlpha,
            dstTexture: dstTexturePremultipliedAlpha,
            srcBindGroup: srcBindGroupPremultipliedAlpha,
            dstBindGroup: dstBindGroupPremultipliedAlpha,
        },
        {
            srcTexture: srcTextureUnpremultipliedAlpha,
            dstTexture: dstTextureUnpremultipliedAlpha,
            srcBindGroup: srcBindGroupUnpremultipliedAlpha,
            dstBindGroup: dstBindGroupUnpremultipliedAlpha,
        },
    ];

    const clearValue: [red: number, green: number, blue: number, alpha: number] = [0, 0, 0, 0];
    const renderPassDescriptor: RenderPassDescriptor = {
        label: 'our basic canvas renderPass',
        colorAttachments: [
            {
                view: canvasTexture, // <- to be filled out when we render
                clearValue,
                loadOp: 'clear',
                storeOp: 'store',
            },
        ],
    };

    const operations = ['add', 'subtract', 'reverse-subtract', 'min', 'max'];

    const factors = [
        'zero',
        'one',
        'src',
        'one-minus-src',
        'src-alpha',
        'one-minus-src-alpha',
        'dst',
        'one-minus-dst',
        'dst-alpha',
        'one-minus-dst-alpha',
        'src-alpha-saturated',
        'constant',
        'one-minus-constant',
    ];

    const presets: {
        [key: string]: { color?: GPUBlendComponent; alpha?: GPUBlendComponent };
    } = {
        'default (copy)': {
            color: {
                operation: 'add',
                srcFactor: 'one',
                dstFactor: 'zero',
            },
        },
        'premultiplied blend (source-over)': {
            color: {
                operation: 'add',
                srcFactor: 'one',
                dstFactor: 'one-minus-src-alpha',
            },
        },
        'un-premultiplied blend': {
            color: {
                operation: 'add',
                srcFactor: 'src-alpha',
                dstFactor: 'one-minus-src-alpha',
            },
        },
        'destination-over': {
            color: {
                operation: 'add',
                srcFactor: 'one-minus-dst-alpha',
                dstFactor: 'one',
            },
        },
        'source-in': {
            color: {
                operation: 'add',
                srcFactor: 'dst-alpha',
                dstFactor: 'zero',
            },
        },
        'destination-in': {
            color: {
                operation: 'add',
                srcFactor: 'zero',
                dstFactor: 'src-alpha',
            },
        },
        'source-out': {
            color: {
                operation: 'add',
                srcFactor: 'one-minus-dst-alpha',
                dstFactor: 'zero',
            },
        },
        'destination-out': {
            color: {
                operation: 'add',
                srcFactor: 'zero',
                dstFactor: 'one-minus-src-alpha',
            },
        },
        'source-atop': {
            color: {
                operation: 'add',
                srcFactor: 'dst-alpha',
                dstFactor: 'one-minus-src-alpha',
            },
        },
        'destination-atop': {
            color: {
                operation: 'add',
                srcFactor: 'one-minus-dst-alpha',
                dstFactor: 'src-alpha',
            },
        },
        'additive (lighten)': {
            color: {
                operation: 'add',
                srcFactor: 'one',
                dstFactor: 'one',
            },
        },
    } as const;

    function keysOf<T extends string>(obj: {
        [k in T]: unknown;
    }): readonly T[]
    {
        return Object.keys(obj) as unknown[] as T[];
    }
    const kPresets = keysOf(presets);

    type Preset = (typeof kPresets)[number];

    const constant = reactive({
        color: [1, 0.5, 0.25],
        alpha: 1,
    });

    const clear = {
        color: [0, 0, 0],
        alpha: 0,
        premultiply: true,
    };

    const settings: {
        alphaMode: GPUCanvasAlphaMode;
        textureSet: string;
        preset: Preset;
    } = {
        alphaMode: 'premultiplied',
        textureSet: 'premultiplied alpha',
        preset: 'premultiplied blend (source-over)',
    };

    // Translates to/from a normalized color value and an 8bit unsigned color value.
    // This is because dat.gui only edits 8bit unsigned color values but we need normalized color values.
    class GUIColorHelper
    {
        normalizedColor: number[];

        constructor(normalizedColor: number[])
        {
            this.normalizedColor = normalizedColor;
        }

        get value()
        {
            return this.normalizedColor.map((v) => Math.round(v * 255));
        }

        set value(rgb255Color: number[])
        {
            this.normalizedColor.forEach(
                (_, i) => (this.normalizedColor[i] = rgb255Color[i] / 255),
            );
        }
    }
    const constantColor: Color = [0, 0, 0, 0];
    const srcPipeline: RenderPipeline = {
        label: 'hardcoded textured quad pipeline',
        vertex: {
            code: texturedQuadWGSL,
        },
        fragment: {
            code: texturedQuadWGSL,
            targets: [
                {
                    blend: {
                        constantColor: constantColor,
                        color: {
                            operation: 'add',
                            srcFactor: 'one',
                            dstFactor: 'one-minus-src',
                        },
                        alpha: {
                            operation: 'add',
                            srcFactor: 'one',
                            dstFactor: 'one-minus-src',
                        },
                    },
                },
            ],
        },
    };

    const r_color = reactive(srcPipeline.fragment.targets[0].blend.color);
    const r_alpha = reactive(srcPipeline.fragment.targets[0].blend.alpha);

    function applyPreset()
    {
        const preset = presets[settings.preset];

        Object.assign(r_color, preset.color);
        Object.assign(r_alpha, preset.alpha || preset.color);
    }

    gui
        .add(settings, 'alphaMode', ['opaque', 'premultiplied'])
        .name('canvas alphaMode');
    gui
        .add(settings, 'textureSet', [
            'premultiplied alpha',
            'un-premultiplied alpha',
        ])
        .name('texture data');
    gui.add(settings, 'preset', [...Object.keys(presets)]).onChange(() =>
    {
        applyPreset();
    });

    const colorFolder = gui.addFolder('color');

    colorFolder.open();
    colorFolder.add(r_color, 'operation', operations);
    colorFolder.add(r_color, 'srcFactor', factors);
    colorFolder.add(r_color, 'dstFactor', factors);

    const alphaFolder = gui.addFolder('alpha');

    alphaFolder.open();
    alphaFolder.add(r_alpha, 'operation', operations);
    alphaFolder.add(r_alpha, 'srcFactor', factors);
    alphaFolder.add(r_alpha, 'dstFactor', factors);

    const constantFolder = gui.addFolder('constant');

    constantFolder.open();
    constantFolder
        .addColor(new GUIColorHelper(constant.color), 'value')
        .name('color');
    constantFolder.add(constant, 'alpha', 0, 1);

    const clearFolder = gui.addFolder('clear color');

    clearFolder.open();
    clearFolder.add(clear, 'premultiply');
    clearFolder.add(clear, 'alpha', 0, 1);
    clearFolder.addColor(new GUIColorHelper(clear.color), 'value');

    const dstPipeline: RenderPipeline = {
        label: 'hardcoded textured quad pipeline',
        vertex: {
            code: texturedQuadWGSL,
        },
        fragment: {
            code: texturedQuadWGSL,
        },
    };

    function updateUniforms(
        uniforms: { matrix: Float32Array; },
        canvas: HTMLCanvasElement,
        texture: Texture,
    )
    {
        const projectionMatrix = mat4.ortho(
            0,
            canvas.width / devicePixelRatio,
            canvas.height / devicePixelRatio,
            0,
            -1,
            1,
        );

        mat4.scale(
            projectionMatrix,
            [texture.descriptor.size[0], texture.descriptor.size[1], 1],
            uniforms.matrix,
        );

        reactive(uniforms).matrix = new Float32Array(uniforms.matrix);
    }

    const ro: RenderObject = {
        pipeline: dstPipeline,
        draw: { __type__: 'DrawVertex', vertexCount: 6 },
    };

    const ro1: RenderObject = {
        pipeline: srcPipeline,
        draw: { __type__: 'DrawVertex', vertexCount: 6 },
    };

    const renderObjects: RenderPassObject[] = [
        ro,
        ro1,
    ];

    const submit: Submit = {
        commandEncoders: [{
            passEncoders: [{
                descriptor: renderPassDescriptor,
                renderPassObjects: renderObjects,
            }],
        }],
    };

    function render()
    {
        gui.updateDisplay();

        const { srcTexture, dstTexture, srcBindGroup, dstBindGroup }
            = textureSets[settings.textureSet === 'premultiplied alpha' ? 0 : 1];

        reactive(ro).bindingResources = dstBindGroup;
        reactive(ro1).bindingResources = srcBindGroup;

        reactive(context.configuration).alphaMode = settings.alphaMode;

        // Apply the clearValue, pre-multiplying or not it based on the settings.
        {
            const { alpha, color, premultiply } = clear;
            const mult = premultiply ? alpha : 1;

            clearValue[0] = color[0] * mult;
            clearValue[1] = color[1] * mult;
            clearValue[2] = color[2] * mult;
            clearValue[3] = alpha;
        }

        reactive(constantColor)[0] = constant.color[0];
        reactive(constantColor)[1] = constant.color[1];
        reactive(constantColor)[2] = constant.color[2];
        reactive(constantColor)[3] = constant.alpha;

        updateUniforms(srcUniform.value, canvas, srcTexture);
        updateUniforms(dstUniform.value, canvas, dstTexture);

        webgpu.submit(submit);

        requestAnimationFrame(render);
    }

    applyPreset();
    render();
};

const panel = new GUI({ width: 310 });
const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;

init(webgpuCanvas, panel);
