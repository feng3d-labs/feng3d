import { Color4 } from '../../math/Color4';
import { oav } from '../../objectview/ObjectView';
import { decoratorRegisterClass } from '../../polyfill/ClassUtils';
import { shaderlib } from '../../renderer/shader/ShaderLib';
import { serialize } from '../../serialization/Serialization';
import textureFragment from '../shaders/texture.fragment.glsl';
import textureVertex from '../shaders/texture.vertex.glsl';
import { Texture2D } from '../textures/Texture2D';

declare global
{
    export interface MixinsUniformsTypes
    {
        texture: TextureUniforms
    }
}

@decoratorRegisterClass()
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

shaderlib.shaderConfig.shaders.texture = { fragment: textureFragment, vertex: textureVertex, cls: TextureUniforms };
