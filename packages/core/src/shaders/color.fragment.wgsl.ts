/**
 * 颜色片段着色器 WGSL
 *
 * 从顶点着色器接收顶点颜色，与材质 u_diffuseInput 相乘输出。
 *
 * 绑定约定：
 * - @group(0) @binding(3) var<uniform> uniforms - { u_diffuseInput: vec4 }（ColorUniforms）
 */

/**
 * 颜色片段着色器代码
 */
export const colorFragmentWGSL = `
struct FragmentInput {
    @location(0) color: vec4<f32>,
}

struct FragmentOutput {
    @location(0) color: vec4<f32>,
}

struct ColorUniforms {
    u_diffuseInput: vec4<f32>,
}

@group(0) @binding(3) var<uniform> uniforms: ColorUniforms;

@fragment
fn main(input: FragmentInput) -> FragmentOutput {
    var output: FragmentOutput;
    // 顶点颜色与材质颜色相乘
    output.color = input.color * uniforms.u_diffuseInput;
    return output;
}
`;

/**
 * 颜色片段着色器导出
 */
export default colorFragmentWGSL;
