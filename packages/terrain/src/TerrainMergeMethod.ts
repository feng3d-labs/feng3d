import { Texture2D } from '@feng3d/core';
import { EventEmitter } from '@feng3d/event';
import { Vector2, Vector4 } from '@feng3d/math';
import { TextureMagFilter, TextureMinFilter, TextureWrap } from '@feng3d/core';
import { RenderObject } from '@feng3d/webgpu';

/**
 * 地形材质
 */
export class TerrainMergeMethod extends EventEmitter
{
    splatMergeTexture = Texture2D.default;

    blendTexture = Texture2D.default;

    splatRepeats = new Vector4(1, 1, 1, 1);

    /**
     * 构建材质
     */
    constructor()
    {
        super();

        this.splatMergeTexture.minFilter = TextureMinFilter.NEAREST;
        this.splatMergeTexture.magFilter = TextureMagFilter.NEAREST;
        this.splatMergeTexture.wrapS = TextureWrap.REPEAT;
        this.splatMergeTexture.wrapT = TextureWrap.REPEAT;
    }

    beforeRender(renderObject: RenderObject)
    {
        (renderObject as any).uniforms.s_blendTexture = this.blendTexture;
        (renderObject as any).uniforms.s_splatMergeTexture = this.splatMergeTexture;
        (renderObject as any).uniforms.u_splatMergeTextureSize = this.splatMergeTexture.getSize();
        (renderObject as any).uniforms.u_splatRepeats = this.splatRepeats;
        //
        (renderObject as any).uniforms.u_imageSize = new Vector2(2048.0, 1024.0);
        (renderObject as any).uniforms.u_tileSize = new Vector2(512.0, 512.0);
        (renderObject as any).uniforms.u_maxLod = 7;
        (renderObject as any).uniforms.u_uvPositionScale = 0.001;
        (renderObject as any).uniforms.u_tileOffset = [
            new Vector4(0.5, 0.5, 0.0, 0.0),
            new Vector4(0.5, 0.5, 0.5, 0.0),
            new Vector4(0.5, 0.5, 0.0, 0.5),
        ];
        (renderObject as any).uniforms.u_lod0vec = new Vector4(0.5, 1, 0, 0);
    }
}
