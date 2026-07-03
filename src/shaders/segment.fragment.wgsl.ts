/**
 * 线段片段着色器 WGSL
 *
 * 用材质 u_segmentColor 与顶点颜色相乘输出。
 *
 * 绑定约定：
 * - @group(0) @binding(3) var<uniform> material_uniforms - { u_segmentColor: vec4 }（SegmentUniforms）
 */

/**
 * 线段片段着色器代码
 */
export const segmentFragmentWGSL = `
struct FragmentInput {
    @location(0) color: vec4<f32>,
}

struct FragmentOutput {
    @location(0) color: vec4<f32>,
}

struct SegmentUniforms {
    u_segmentColor: vec4<f32>,
}

@group(0) @binding(3) var<uniform> material_uniforms: SegmentUniforms;

@fragment
fn main(input: FragmentInput) -> FragmentOutput {
    var output: FragmentOutput;
    output.color = input.color * material_uniforms.u_segmentColor;
    return output;
}
`;

/**
 * 线段片段着色器导出
 */
export default segmentFragmentWGSL;
