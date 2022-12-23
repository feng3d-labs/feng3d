import { Texture2D } from '@feng3d/core';
import { EventEmitter } from '@feng3d/event';
import { Vector2, Vector4 } from '@feng3d/math';
import { RenderAtomic } from '@feng3d/renderer';

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

        this.splatMergeTexture.minFilter = 'NEAREST';
        this.splatMergeTexture.magFilter = 'NEAREST';
        this.splatMergeTexture.wrapS = 'REPEAT';
        this.splatMergeTexture.wrapT = 'REPEAT';
    }

    beforeRender(renderAtomic: RenderAtomic)
    {
        renderAtomic.uniforms.s_blendTexture = this.blendTexture;
        renderAtomic.uniforms.s_splatMergeTexture = this.splatMergeTexture;
        const size = this.splatMergeTexture.getSize();
        renderAtomic.uniforms.u_splatMergeTextureSize = new Vector2(size.x, size.y);
        renderAtomic.uniforms.u_splatRepeats = this.splatRepeats;
        //
        renderAtomic.uniforms.u_imageSize = new Vector2(2048.0, 1024.0);
        renderAtomic.uniforms.u_tileSize = new Vector2(512.0, 512.0);
        renderAtomic.uniforms.u_maxLod = 7;
        renderAtomic.uniforms.u_uvPositionScale = 0.001;
        renderAtomic.uniforms.u_tileOffset = [
            new Vector4(0.5, 0.5, 0.0, 0.0),
            new Vector4(0.5, 0.5, 0.5, 0.0),
            new Vector4(0.5, 0.5, 0.0, 0.5),
        ];
        renderAtomic.uniforms.u_lod0vec = new Vector4(0.5, 1, 0, 0);
    }
}
