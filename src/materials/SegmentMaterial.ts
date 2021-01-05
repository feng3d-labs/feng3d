import { serialize } from "@feng3d/serialization";
import { oav } from "@feng3d/objectview";
import { Color4 } from "@feng3d/math";
import { shaderConfig } from "@feng3d/renderer";

import { Material } from "./Material";

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

shaderConfig.shaders["segment"].cls = SegmentUniforms;
shaderConfig.shaders["segment"].renderParams = { renderMode: feng3d.RenderMode.LINES, enableBlend: true };

Material.setDefault("Segment-Material", { shaderName: "segment" });
