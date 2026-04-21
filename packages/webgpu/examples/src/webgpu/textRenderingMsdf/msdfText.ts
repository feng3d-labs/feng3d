import { mat4, Mat4 } from 'wgpu-matrix';

import msdfTextWGSL from './msdfText.wgsl';

import { reactive } from '@feng3d/reactivity';
import { BindingResources, Buffer, RenderPassObject, RenderPipeline, Sampler, Texture } from '@feng3d/webgpu';
import { RenderBundle } from '@feng3d/webgpu';

// The kerning map stores a spare map of character ID pairs with an associated
// X offset that should be applied to the character spacing when the second
// character ID is rendered after the first.
type KerningMap = Map<number, Map<number, number>>;

interface MsdfChar
{
    id: number;
    index: number;
    char: string;
    width: number;
    height: number;
    xoffset: number;
    yofsset: number;
    xadvance: number;
    chnl: number;
    x: number;
    y: number;
    page: number;
    charIndex: number;
}

export class MsdfFont
{
    charCount: number;
    defaultChar: MsdfChar;
    constructor(
        public material: RenderPipeline,
        public bindGroup: BindingResources,
        public lineHeight: number,
        public chars: { [x: number]: MsdfChar },
        public kernings: KerningMap,
    )
    {
        const charArray = Object.values(chars);

        this.charCount = charArray.length;
        this.defaultChar = charArray[0];
    }

    getChar(charCode: number): MsdfChar
    {
        let char = this.chars[charCode];

        if (!char)
        {
            char = this.defaultChar;
        }

        return char;
    }

    // Gets the distance in pixels a line should advance for a given character code. If the upcoming
    // character code is given any kerning between the two characters will be taken into account.
    getXAdvance(charCode: number, nextCharCode = -1): number
    {
        const char = this.getChar(charCode);

        if (nextCharCode >= 0)
        {
            const kerning = this.kernings.get(charCode);

            if (kerning)
            {
                return char.xadvance + (kerning.get(nextCharCode) ?? 0);
            }
        }

        return char.xadvance;
    }
}

export interface MsdfTextMeasurements
{
    width: number;
    height: number;
    lineWidths: number[];
    printedCharCount: number;
}

export class MsdfText
{
    private bufferArray = new Float32Array(24);
    private bufferArrayDirty = true;

    constructor(
        private renderBundle: RenderBundle,
        public measurements: MsdfTextMeasurements,
        public font: MsdfFont,
        public textBuffer: Float32Array,
    )
    {
        mat4.identity(this.bufferArray);
        this.setColor(1, 1, 1, 1);
        this.setPixelScale(1 / 512);
        this.bufferArrayDirty = true;
    }

    getRenderBundle()
    {
        if (this.bufferArrayDirty)
        {
            this.bufferArrayDirty = false;
            const buffer = Buffer.getBuffer(this.textBuffer.buffer);
            const writeBuffers = buffer.writeBuffers || [];

            writeBuffers.push({
                data: this.bufferArray,
            });
            reactive(buffer).writeBuffers = writeBuffers;
        }

        return this.renderBundle;
    }

    setTransform(matrix: Mat4)
    {
        mat4.copy(matrix, this.bufferArray);
        this.bufferArrayDirty = true;
    }

    setColor(r: number, g: number, b: number, a = 1.0)
    {
        this.bufferArray[16] = r;
        this.bufferArray[17] = g;
        this.bufferArray[18] = b;
        this.bufferArray[19] = a;
        this.bufferArrayDirty = true;
    }

    setPixelScale(pixelScale: number)
    {
        this.bufferArray[20] = pixelScale;
        this.bufferArrayDirty = true;
    }
}

export interface MsdfTextFormattingOptions
{
    centered?: boolean;
    pixelScale?: number;
    color?: [number, number, number, number];
}

export class MsdfTextRenderer
{
    pipelinePromise: RenderPipeline;
    sampler: Sampler;

    cameraUniformBuffer: Float32Array = new Float32Array(16 * 2);

    constructor(
    )
    {
        this.sampler = {
            label: 'MSDF text sampler',
            minFilter: 'linear',
            magFilter: 'linear',
            mipmapFilter: 'linear',
            maxAnisotropy: 16,
        };

        this.pipelinePromise = {
            label: `msdf text pipeline`,
            vertex: {
                code: msdfTextWGSL,
                entryPoint: 'vertexMain',
            },
            fragment: {
                code: msdfTextWGSL,
                entryPoint: 'fragmentMain',
                targets: [
                    {
                        blend: {
                            color: {
                                srcFactor: 'src-alpha',
                                dstFactor: 'one-minus-src-alpha',
                            },
                            alpha: {
                                srcFactor: 'one',
                                dstFactor: 'one',
                            },
                        },
                    },
                ],
            },
            primitive: {
                topology: 'triangle-strip',
            },
            depthStencil: {
                depthWriteEnabled: false,
                depthCompare: 'less',
            },
        };
    }

    async loadTexture(url: string)
    {
        const response = await fetch(url);
        const imageBitmap = await createImageBitmap(await response.blob());

        const texture: Texture = {
            descriptor: {
                size: [imageBitmap.width, imageBitmap.height],
                label: `MSDF font texture ${url}`,
                format: 'rgba8unorm',
            },
            sources: [{
                image: imageBitmap,
            }],
        };

        return texture;
    }

    async createFont(fontJsonUrl: string): Promise<MsdfFont>
    {
        const response = await fetch(fontJsonUrl);
        const json = await response.json();

        const i = fontJsonUrl.lastIndexOf('/');
        const baseUrl = i !== -1 ? fontJsonUrl.substring(0, i + 1) : undefined;

        const pagePromises: Promise<Texture>[] = [];

        for (const pageUrl of json.pages)
        {
            pagePromises.push(this.loadTexture(baseUrl + pageUrl));
        }

        const charCount = json.chars.length;
        const charsArray = new Float32Array(charCount * 8);

        const u = 1 / json.common.scaleW;
        const v = 1 / json.common.scaleH;

        const chars: { [x: number]: MsdfChar } = {};

        let offset = 0;

        for (const [i, char] of json.chars.entries())
        {
            chars[char.id] = char;
            chars[char.id].charIndex = i;
            charsArray[offset] = char.x * u; // texOffset.x
            charsArray[offset + 1] = char.y * v; // texOffset.y
            charsArray[offset + 2] = char.width * u; // texExtent.x
            charsArray[offset + 3] = char.height * v; // texExtent.y
            charsArray[offset + 4] = char.width; // size.x
            charsArray[offset + 5] = char.height; // size.y
            charsArray[offset + 6] = char.xoffset; // offset.x
            charsArray[offset + 7] = -char.yoffset; // offset.y
            offset += 8;
        }

        const pageTextures = await Promise.all(pagePromises);

        const bindGroup: BindingResources = {
            fontTexture: { texture: pageTextures[0] },
            fontSampler: this.sampler,
            chars: { bufferView: charsArray },
        };

        const kernings = new Map();

        if (json.kernings)
        {
            for (const kearning of json.kernings)
            {
                let charKerning = kernings.get(kearning.first);

                if (!charKerning)
                {
                    charKerning = new Map<number, number>();
                    kernings.set(kearning.first, charKerning);
                }
                charKerning.set(kearning.second, kearning.amount);
            }
        }

        return new MsdfFont(
            this.pipelinePromise,
            bindGroup,
            json.common.lineHeight,
            chars,
            kernings,
        );
    }

    formatText(
        font: MsdfFont,
        text: string,
        options: MsdfTextFormattingOptions = {},
    ): MsdfText
    {
        const textBuffer = new Float32Array((text.length + 6) * 4);

        let offset = 24; // Accounts for the values managed by MsdfText internally.

        let measurements: MsdfTextMeasurements;

        if (options.centered)
        {
            measurements = this.measureText(font, text);

            this.measureText(
                font,
                text,
                (textX: number, textY: number, line: number, char: MsdfChar) =>
                {
                    const lineOffset
                        = measurements.width * -0.5
                        - (measurements.width - measurements.lineWidths[line]) * -0.5;

                    textBuffer[offset] = textX + lineOffset;
                    textBuffer[offset + 1] = textY + measurements.height * 0.5;
                    textBuffer[offset + 2] = char.charIndex;
                    offset += 4;
                },
            );
        }
        else
        {
            measurements = this.measureText(
                font,
                text,
                (textX: number, textY: number, line: number, char: MsdfChar) =>
                {
                    textBuffer[offset] = textX;
                    textBuffer[offset + 1] = textY;
                    textBuffer[offset + 2] = char.charIndex;
                    offset += 4;
                },
            );
        }

        const bindGroup: BindingResources = {
            camera: { bufferView: this.cameraUniformBuffer },
            text: { bufferView: textBuffer },
        };

        const renderBundle: RenderBundle = {
            __type__: 'RenderBundle',
            renderObjects: [
                {
                    pipeline: font.material,
                    bindingResources: {
                        ...font.bindGroup,
                        ...bindGroup,
                    },
                    draw: { __type__: 'DrawVertex', vertexCount: 4, instanceCount: measurements.printedCharCount },
                },
            ],
        };

        const msdfText = new MsdfText(
            renderBundle,
            measurements,
            font,
            textBuffer,
        );

        if (options.pixelScale !== undefined)
        {
            msdfText.setPixelScale(options.pixelScale);
        }

        if (options.color !== undefined)
        {
            msdfText.setColor(...options.color);
        }

        return msdfText;
    }

    measureText(
        font: MsdfFont,
        text: string,
        charCallback?: (x: number, y: number, line: number, char: MsdfChar) => void,
    ): MsdfTextMeasurements
    {
        let maxWidth = 0;
        const lineWidths: number[] = [];

        let textOffsetX = 0;
        let textOffsetY = 0;
        let line = 0;
        let printedCharCount = 0;
        let nextCharCode = text.charCodeAt(0);

        for (let i = 0; i < text.length; ++i)
        {
            const charCode = nextCharCode;

            nextCharCode = i < text.length - 1 ? text.charCodeAt(i + 1) : -1;

            switch (charCode)
            {
                case 10: // Newline
                    lineWidths.push(textOffsetX);
                    line++;
                    maxWidth = Math.max(maxWidth, textOffsetX);
                    textOffsetX = 0;
                    textOffsetY -= font.lineHeight;
                case 13: // CR
                    break;
                case 32: // Space
                    // For spaces, advance the offset without actually adding a character.
                    textOffsetX += font.getXAdvance(charCode);
                    break;
                default: {
                    if (charCallback)
                    {
                        charCallback(
                            textOffsetX,
                            textOffsetY,
                            line,
                            font.getChar(charCode),
                        );
                    }
                    textOffsetX += font.getXAdvance(charCode, nextCharCode);
                    printedCharCount++;
                }
            }
        }

        lineWidths.push(textOffsetX);
        maxWidth = Math.max(maxWidth, textOffsetX);

        return {
            width: maxWidth,
            height: lineWidths.length * font.lineHeight,
            lineWidths,
            printedCharCount,
        };
    }

    updateCamera(projection: Mat4, view: Mat4)
    {
        this.cameraUniformBuffer.set(projection, 0);
        this.cameraUniformBuffer.set(view, 16);

        const buffer = Buffer.getBuffer(this.cameraUniformBuffer.buffer);
        const writeBuffers = buffer.writeBuffers || [];

        writeBuffers.push({
            data: this.cameraUniformBuffer,
        });
        reactive(buffer).writeBuffers = writeBuffers;
    }

    render(renderObjects: RenderPassObject[], ...text: MsdfText[])
    {
        const renderBundles = text.map((t) => t.getRenderBundle());

        renderBundles.forEach((v) =>
        {
            renderObjects.push(v);
        });
    }
}
