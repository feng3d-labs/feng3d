import { Color4 } from "../math/Color4";
import { shaderlib } from "../renderer/shader/ShaderLib";
import { Texture2D, Texture2DEventMap } from "../textures/Texture2D";
import { oav } from "../utils/ObjectView";
import { serialize } from "../utils/Serialization";

declare module "./Material"
{
    export interface UniformsTypes { texture: TextureUniforms }
}

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
    s_texture: Texture2D<Texture2DEventMap> = Texture2D.default;
}

shaderlib.shaderConfig.shaders["texture"].cls = TextureUniforms;
