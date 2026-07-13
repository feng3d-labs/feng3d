/**
 * 阴影深度片段着色器 WGSL
 *
 * 从 shadow.fragment.glsl 翻译：计算光源距离 → packDepthToRGBA。
 * 清除色为白色 (1,1,1,1) = packDepthToRGBA(1.0)。
 */

export const shadowFragmentWGSL = `
struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) worldPosition: vec3<f32>,
}

struct ShadowUniforms {
    u_lightPosition: vec3<f32>,
    u_shadowCameraNear: f32,
    u_shadowCameraFar: f32,
    _pad0: f32,
    _pad1: f32,
    _pad2: f32,
}

@group(0) @binding(3) var<uniform> shadowUniforms: ShadowUniforms;

// packDepthToRGBA（对照 GLSL shadow.fragment.glsl）
const PackUpscale = 256.0 / 255.0;
const ShiftRight8 = 1.0 / 256.0;

fn packDepthToRGBA(v: f32) -> vec4<f32> {
    let r1 = fract(v * 256.0 * 256.0 * 256.0);
    let r2 = fract(v * 256.0 * 256.0);
    let r3 = fract(v * 256.0);
    let r4 = v;
    // r.yzw -= r.xyz * ShiftRight8（WGSL 不允许 swizzle 赋值，改为构造）
    return vec4<f32>(
        r1,
        r2 - r1 * ShiftRight8,
        r3 - r2 * ShiftRight8,
        r4 - r3 * ShiftRight8
    ) * PackUpscale;
}

@fragment
fn main(input: VertexOutput) -> @location(0) vec4<f32> {
    let lightToPosition = input.worldPosition - shadowUniforms.u_lightPosition;
    let dp = (length(lightToPosition) - shadowUniforms.u_shadowCameraNear)
        / (shadowUniforms.u_shadowCameraFar - shadowUniforms.u_shadowCameraNear);
    return packDepthToRGBA(clamp(dp, 0.0, 1.0));
}
`;

export default shadowFragmentWGSL;
