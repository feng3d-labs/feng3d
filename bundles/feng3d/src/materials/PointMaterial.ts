import { Color4 } from "../math/Color4";
import { shaderlib } from "../renderer/shader/ShaderLib";
import { oav } from "../utils/ObjectView";
import { serialize } from "../utils/Serialization";

declare module "./Material"
{
    export interface UniformsTypes { point: PointUniforms }
}

export class PointUniforms
{
    __class__: "feng3d.PointUniforms";
    /** 
     * 颜色
     */
    @serialize
    @oav()
    u_color = new Color4();

    /**
     * 点绘制时点的尺寸
     */
    @serialize
    @oav()
    u_PointSize = 1;
}

shaderlib.shaderConfig.shaders["point"].cls = PointUniforms;
