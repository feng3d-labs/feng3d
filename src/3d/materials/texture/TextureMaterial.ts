import { Color4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { Serializable, SerializeProperty } from '@feng3d/serialization';
import { AssetData } from '../../../core/AssetData';
import { Material } from '../../../core/Material';
import { shaderlib } from '../../../renderer/shader/ShaderLib';
import { Texture2DLike } from '../../../textures/Texture2D';
import textureFragment from './texture.fragment.glsl';
import textureVertex from './texture.vertex.glsl';

declare module '../../../core/Material' {
    interface MaterialMap { TextureMaterial: TextureMaterial }
    interface UniformsMap { TextureUniforms: TextureUniforms }
}

@Serializable('TextureMaterial')
export class TextureMaterial extends Material
{
    uniforms = new TextureUniforms();

    constructor()
    {
        super();
        this.shader.shaderName = 'texture';
    }
}

@Serializable('TextureUniforms')
export class TextureUniforms
{
    declare __class__: 'TextureUniforms';

    /**
     * 颜色
     */
    @SerializeProperty()
    @oav()
    u_color = new Color4();

    /**
     * 纹理数据
     */
    @oav()
    @SerializeProperty()
    s_texture: Texture2DLike = AssetData.getDefaultAssetData('Default-Texture');
}

shaderlib.shaderConfig.shaders.texture = {
    vertex: textureVertex,
    fragment: textureFragment,
};
