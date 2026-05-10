struct FragmentInput {
    @location(0) v_st: vec2<f32>,
}

@group(0) @binding(1) var diffuse_texture: texture_2d<u32>;
@group(0) @binding(2) var diffuse: sampler;

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
    // 整数纹理不支持 textureSample，使用 textureLoad
    // 将 UV 坐标转换为像素坐标
    let texSize = textureDimensions(diffuse_texture);
    let intCoord = vec2<i32>(input.v_st * vec2<f32>(texSize));
    let texel = textureLoad(diffuse_texture, intCoord, 0);

    // 量化处理：除以 32 再乘以 32
    let intColor = texel / 32u * 32u;

    // 转换为浮点颜色
    return vec4<f32>(intColor) / 255.0;
}

