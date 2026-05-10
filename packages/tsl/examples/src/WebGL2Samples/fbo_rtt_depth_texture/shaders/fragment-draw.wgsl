// 深度纹理需要使用 texture_depth_2d 类型
// 深度纹理不能使用普通过滤采样器，需要使用 textureLoad 直接读取
@group(0) @binding(0) var depthMap_texture: texture_depth_2d;
// 保留 sampler 绑定以匹配 bindingResources，但实际不使用
@group(0) @binding(1) var depthMap: sampler;

struct FragmentInput {
    @location(0) v_st: vec2<f32>,
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
    // 使用 textureLoad 直接读取深度值（不需要过滤采样）
    let texSize = textureDimensions(depthMap_texture);
    let texCoord = vec2<i32>(input.v_st * vec2<f32>(texSize));
    let depth = textureLoad(depthMap_texture, texCoord, 0);
    return vec4<f32>(vec3<f32>(1.0 - depth), 1.0);
}
