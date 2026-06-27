/**
 * 颜色片段着色器 WGSL
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

@fragment
fn main(input: FragmentInput) -> FragmentOutput {
    var output: FragmentOutput;
    output.color = input.color;
    return output;
}
`;

/**
 * 颜色片段着色器导出
 */
export default colorFragmentWGSL;