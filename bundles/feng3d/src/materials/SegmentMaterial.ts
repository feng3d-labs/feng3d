import { Color4 } from "@feng3d/math";
import { RenderMode } from "../renderer/gl/enums/RenderMode";
import { shaderlib } from "../renderer/shader/ShaderLib";
import { oav } from "../utils/ObjectView";
import { serialize } from "../utils/Serialization";
import { Material } from "./Material";

declare module "./Material"
{
    export interface UniformsTypes { segment: SegmentUniforms }

    export interface DefaultMaterial
    {
        "Segment-Material": Material;
    }
}

/**
 * 线段材质
 * 目前webgl不支持修改线条宽度，参考：https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/lineWidth
 */
export class SegmentUniforms
{
    __class__: "feng3d.SegmentUniforms";

    /** 
     * 颜色
     */
    @serialize
    @oav()
    u_segmentColor = new Color4();
}

shaderlib.shaderConfig.shaders["segment"].cls = SegmentUniforms;
shaderlib.shaderConfig.shaders["segment"].renderParams = { renderMode: RenderMode.LINES, enableBlend: true };


Material.setDefault("Segment-Material", { shaderName: "segment" });
