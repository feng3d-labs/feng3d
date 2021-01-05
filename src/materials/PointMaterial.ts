import { serialize } from "@feng3d/serialization";
import { oav } from "@feng3d/objectview";
import { Color4 } from "@feng3d/math";
import { shaderConfig } from "@feng3d/renderer";

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

shaderConfig.shaders["point"].cls = PointUniforms;
