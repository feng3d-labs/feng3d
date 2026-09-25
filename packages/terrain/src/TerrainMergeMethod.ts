import { defaultTexture } from 'feng3d';
import { EventEmitter } from '@feng3d/event';
import { Vector2, Vector4 } from '@feng3d/math';
import { RenderObject } from '@feng3d/webgpu';

/**
 * 地形材质
 */
export class TerrainMergeMethod extends EventEmitter
{
    splatMergeTexture = defaultTexture;

    blendTexture = defaultTexture;

    splatRepeats = new Vector4(1, 1, 1, 1);

    /**
     * 构建材质
     *
     * 注：sampler 配置（minFilter/magFilter/wrapS/wrapT）在统一为 webgpu `Texture` 接口后
     * 已上移到材质的 samplers 字段；本类尚未重构，先保留空构造，过滤参数后续随 TerrainMaterial 重构补回。
     */
    constructor()
    {
        super();
    }

    beforeRender(renderObject: RenderObject)
    {
        (renderObject as any).uniforms.s_blendTexture = this.blendTexture;
        (renderObject as any).uniforms.s_splatMergeTexture = this.splatMergeTexture;
        // Texture 接口不再有 getSize()；用 descriptor.size 提供等价信息。
        const size = (this.splatMergeTexture as any).descriptor?.size ?? [1, 1];
        (renderObject as any).uniforms.u_splatMergeTextureSize = new Vector2(size[0], size[1]);
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
