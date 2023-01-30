import { EventEmitter } from '../../event/EventEmitter';
import { Vector2 } from '../../math/geom/Vector2';
import { Vector4 } from '../../math/geom/Vector4';
import { RenderAtomic } from '../../renderer/data/RenderAtomic';
import { Texture2D } from '../../textures/Texture2D';

declare module '../../renderer/data/Uniforms'
{
    interface Uniforms
    {
        /**
         * 地形混合贴图
         */
        s_blendTexture: Texture2D;

        /**
         * 地形块混合贴图
         */
        s_splatMergeTexture: Texture2D;
        /**
         * 地形块重复次数
         */
        u_splatRepeats: Vector4;
        /**
         * 地形混合贴图尺寸
         */
        u_splatMergeTextureSize: Vector2;
        /**
         * 图片尺寸
         */
        u_imageSize: Vector2;
        /**
         * 地形块尺寸
         */
        u_tileSize: Vector2;
        /**
         * 地形块偏移
         */
        u_tileOffset: Vector4[];
        /**
         * 最大lod
         */
        u_maxLod: number;
        /**
         * uv与坐标比
         */
        u_uvPositionScale: number;
        /**
         * lod0时在贴图中的uv缩放偏移向量
         */
        u_lod0vec: Vector4;
    }
}

/**
 * 地形材质
 */
export class Terrain3DMergeMethod extends EventEmitter
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
