struct FragmentInput {
    @location(0) v_st: vec2<f32>,
}

@group(0) @binding(1) var diffuse_texture: texture_2d<f32>;
@group(0) @binding(2) var diffuse: sampler;

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
    // 获取纹理尺寸减 1
    let size = vec2<i32>(textureDimensions(diffuse_texture, 0)) - vec2<i32>(1, 1);
    // 计算浮点纹理坐标
    let texcoord = input.v_st * vec2<f32>(size);
    // 转换为整数坐标
    let coord = vec2<i32>(texcoord);

    // 获取四个相邻纹素
    let texel00 = textureLoad(diffuse_texture, coord + vec2<i32>(0, 0), 0u);
    let texel10 = textureLoad(diffuse_texture, coord + vec2<i32>(1, 0), 0u);
    let texel11 = textureLoad(diffuse_texture, coord + vec2<i32>(1, 1), 0u);
    let texel01 = textureLoad(diffuse_texture, coord + vec2<i32>(0, 1), 0u);

    // 获取小数部分
    let sampleCoord = fract(texcoord);

    // 双线性插值
    let texel0 = mix(texel00, texel01, sampleCoord.y);
    let texel1 = mix(texel10, texel11, sampleCoord.y);

    return mix(texel0, texel1, sampleCoord.x);
}

