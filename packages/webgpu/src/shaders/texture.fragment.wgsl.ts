/**
 * 纹理片段着色器 WGSL
 */

/**
 * 纹理片段着色器代码
 */
export const textureFragmentWGSL = `
struct FragmentInput {
    @location(0) uv: vec2<f32>,
}

struct FragmentOutput {
    @location(0) color: vec4<f32>,
}

@group(0) @binding(1) var textureSampler: sampler;
@group(0) @binding(2) var textureData: texture_2d<f32>;

@fragment
fn main(input: FragmentInput) -> FragmentOutput {
    var output: FragmentOutput;
    output.color = textureSample(textureData, textureSampler, input.uv);
    return output;
}
`;

/**
 * 纹理片段着色器导出
 */
export default textureFragmentWGSL;