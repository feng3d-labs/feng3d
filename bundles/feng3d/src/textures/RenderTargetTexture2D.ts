import { TextureFormat } from "../renderer/gl/enums/TextureFormat";
import { TextureMagFilter } from "../renderer/gl/enums/TextureMagFilter";
import { TextureMinFilter } from "../renderer/gl/enums/TextureMinFilter";
import { watch } from "../utils/Watcher";
import { Texture2D } from "./Texture2D";

/**
 * 渲染目标纹理
 */
export class RenderTargetTexture2D extends Texture2D
{
    @watch("invalidate")
    OFFSCREEN_WIDTH = 1024;

    @watch("invalidate")
    OFFSCREEN_HEIGHT = 1024;

    format = TextureFormat.RGBA;

    minFilter = TextureMinFilter.NEAREST;

    magFilter = TextureMagFilter.NEAREST;

    isRenderTarget = true;
}
