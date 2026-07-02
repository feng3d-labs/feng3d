/**
 * 点片段着色器 WGSL
 *
 * 用材质 u_color 与顶点颜色相乘输出。
 *
 * 绑定约定：
 * - @group(0) @binding(3) var<uniform> material_uniforms - { u_color: vec4, u_PointSize: f32 }（PointUniforms）
 */

/**
 * 点片段着色器代码
 */
export const pointFragmentWGSL = `
struct FragmentInput {
    @location(0) color: vec4<f32>,
}

struct FragmentOutput {
    @location(0) color: vec4<f32>,
}

struct PointUniforms {
    u_color: vec4<f32>,
    u_PointSize: f32,
}

@group(0) @binding(3) var<uniform> material_uniforms: PointUniforms;

@fragment
fn main(input: FragmentInput) -> FragmentOutput {
    var output: FragmentOutput;
    output.color = input.color * material_uniforms.u_color;
    return output;
}
`;

/**
 * 点片段着色器导出
 */
export default pointFragmentWGSL;
