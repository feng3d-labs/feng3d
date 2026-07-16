/**
 * 阴影图调试片段着色器
 *
 * 配合 textureVertexWGSL 使用（顶点输出 @location(0) uv）。
 * 用 textureLoad 读取 depth 纹理的原始深度值（[0,1]），可视化输出为灰度。
 *
 * 可视化：clearValue=1.0（无物体区域 → 白色），物体区域深度小 → 偏暗。
 *
 * 绑定约定（与 TextureMaterial 一致）：
 * - @group(0) @binding(3) material_uniforms - { u_texSize: vec2 }
 * - @group(1) @binding(0) s_textureSampler: sampler（占位，textureLoad 不使用）
 * - @group(1) @binding(1) s_texture: texture_depth_2d
 */

export const debugShadowMapFragmentWGSL = `
struct FragmentInput {
    @location(0) uv: vec2<f32>,
}

struct FragmentOutput {
    @location(0) color: vec4<f32>,
}

struct DebugUniforms {
    u_texSize: vec2<f32>,
}

@group(0) @binding(3) var<uniform> material_uniforms: DebugUniforms;

@group(1) @binding(0) var s_textureSampler: sampler;
@group(1) @binding(1) var s_texture: texture_depth_2d;

@fragment
fn main(input: FragmentInput) -> FragmentOutput {
    var output: FragmentOutput;

    // uv → 整数 texel 坐标（textureLoad 需要 vec2<u32>）
    // 翻转 Y（WebGPU 纹理 V=0 在顶部）
    let flippedUv = vec2<f32>(input.uv.x, 1.0 - input.uv.y);
    let texel = vec2<u32>(
        u32(clamp(flippedUv.x, 0.0, 1.0) * (material_uniforms.u_texSize.x - 1.0)),
        u32(clamp(flippedUv.y, 0.0, 1.0) * (material_uniforms.u_texSize.y - 1.0))
    );

    // textureLoad 读取深度（depth 纹理返回 ∈ [0,1]）
    var depth = textureLoad(s_texture, texel, 0);

    // 安全钳制
    if (!(depth >= 0.0)) { depth = 0.0; }
    if (!(depth <= 1.0)) { depth = 1.0; }

    // 可视化：深度直接作为灰度
    output.color = vec4<f32>(depth, depth, depth, 1.0);

    return output;
}
`;

export default debugShadowMapFragmentWGSL;
