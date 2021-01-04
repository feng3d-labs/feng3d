import { serialize } from "@feng3d/serialization";
import { oav } from "@feng3d/objectview";
import { Color4 } from "@feng3d/math";
import { shaderConfig } from "@feng3d/renderer";

import { Texture2D } from "../textures/Texture2D";

export interface UniformsTypes { texture: TextureUniforms }
export class TextureUniforms
{
    __class__: "feng3d.TextureUniforms";
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

shaderConfig.shaders["texture"].cls = TextureUniforms;
