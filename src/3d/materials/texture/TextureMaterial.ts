import { AssetData } from '../../../core/AssetData';
import { Material } from '../../../core/Material';
import { Color4 } from '../../../math/Color4';
import { oav } from '@feng3d/objectview';
import { shaderlib } from '../../../renderer/shader/ShaderLib';
import { Serializable } from '@feng3d/serialization';
import { SerializeProperty } from '@feng3d/serialization';
import { Texture2DLike } from '../../../textures/Texture2D';
import textureFragment from './texture_fragment_glsl';
import textureVertex from './texture_vertex_glsl';

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
