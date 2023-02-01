import { TextureType } from "../gl/WebGLEnums";
import { Sampler } from "./Sampler";

/**
 * 对应`glsl`中`sampler2D`类型
 */
export class Sampler2D extends Sampler
{
    /**
     * 纹理类型
     */
    textureType: TextureType = 'TEXTURE_2D';

    /**
     * One of the following objects can be used as a pixel source for the texture:
     * 
     * ImageBitmap | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | OffscreenCanvas
     * 
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
     */
    source: TexImageSource;
}