import { Color4 } from '../../../math/Color4';
import { oav } from '../../../objectview/ObjectView';
import { shaderlib } from '../../../renderer/shader/ShaderLib';
import { serializable } from '../../../serialization/ClassUtils';
import { serialize } from '../../../serialization/serialize';
import { Texture2D } from '../../textures/Texture2D';
import { Material } from '../Material';
import textureFragment from './texture_fragment_glsl';
import textureVertex from './texture_vertex_glsl';

declare global
{
    export interface MixinsMaterialMap
    {
        texture: TextureMaterial
    }
}

@serializable()
export class TextureMaterial extends Material
{
    uniforms = new TextureUniforms();

    constructor()
    {
        super();
        this.shader.shaderName = 'texture';
    }
}

@serializable()
export class TextureUniforms
{
    __class__: 'TextureUniforms';

    /**
     * 颜色
     */
    @serialize
    @oav()
    u_color = new Color4();

    /**
     * 纹理数据
     */
    @oav()
    @serialize
    s_texture = Texture2D.default;
}

shaderlib.shaderConfig.shaders.texture = {
    vertex: textureVertex,
    fragment: textureFragment,
    cls: TextureUniforms
};
