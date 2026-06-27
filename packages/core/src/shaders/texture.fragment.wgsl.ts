/**
 * 纹理片段着色器 WGSL
 *
 * 采样纹理颜色，与材质 u_color 相乘输出。
 *
 * 绑定约定：
 * - @group(0) @binding(3) var<uniform> uniforms        - { u_color: vec4 }（TextureUniforms）
 * - @group(1) @binding(0) var s_textureSampler: sampler
 * - @group(1) @binding(1) var s_texture: texture_2d<f32>
 *
 * 注意：sampler 与 texture 的 WGSL 变量名遵循 webgpu 绑定解析约定
 * （bindingResources.s_texture = { texture, sampler }）。
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

struct TextureUniforms {
    u_color: vec4<f32>,
}

@group(0) @binding(3) var<uniform> uniforms: TextureUniforms;

@group(1) @binding(0) var s_textureSampler: sampler;
@group(1) @binding(1) var s_texture: texture_2d<f32>;

@fragment
fn main(input: FragmentInput) -> FragmentOutput {
    var output: FragmentOutput;
    let texColor = textureSample(s_texture, s_textureSampler, input.uv);
    output.color = texColor * uniforms.u_color;
    return output;
}
`;

/**
 * 纹理片段着色器导出
 */
export default textureFragmentWGSL;
