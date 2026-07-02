/**
 * 天空盒片段着色器 WGSL
 *
 * 按方向向量采样立方体纹理。
 *
 * 绑定约定：
 * - @group(1) @binding(0) var s_skyboxTextureSampler: sampler
 * - @group(1) @binding(1) var s_skyboxTexture: texture_cube<f32>
 */

/**
 * 天空盒片段着色器代码
 */
export const skyboxFragmentWGSL = `
struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) dir: vec3<f32>,
}

struct FragmentOutput {
    @location(0) color: vec4<f32>,
}

@group(1) @binding(0) var s_skyboxTextureSampler: sampler;
@group(1) @binding(1) var s_skyboxTexture: texture_cube<f32>;

@fragment
fn main(input: VertexOutput) -> FragmentOutput {
    var output: FragmentOutput;
    output.color = textureSample(s_skyboxTexture, s_skyboxTextureSampler, input.dir);
    return output;
}
`;

/**
 * 天空盒片段着色器导出
 */
export default skyboxFragmentWGSL;
