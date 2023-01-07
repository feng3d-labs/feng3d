import { Color4 } from '../../../math/Color4';
import { oav } from '../../../objectview/ObjectView';
import { shaderlib } from '../../../renderer/shader/ShaderLib';
import { Serializable } from '../../../serialization/Serializable';
import { SerializeProperty } from '../../../serialization/SerializeProperty';
import { Texture2D } from '../../textures/Texture2D';
import { Material } from '../Material';
import textureFragment from './texture_fragment_glsl';
import textureVertex from './texture_vertex_glsl';

declare module '../Material' { interface MaterialMap { texture: TextureMaterial } }

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
    s_texture = Texture2D.default;
}

shaderlib.shaderConfig.shaders.texture = {
    vertex: textureVertex,
    fragment: textureFragment,
};
