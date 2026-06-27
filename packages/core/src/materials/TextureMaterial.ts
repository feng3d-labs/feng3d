import { Color4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { shaderlib } from '../render/data/ShaderLib';
import { serialize } from '@feng3d/serialization';
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

shaderlib.shaderConfig.shaders.texture = { cls: TextureUniforms };
