struct FragmentInput {
    @location(0) v_st: vec2<f32>,
}

@group(0) @binding(1) var diffuse_texture: texture_2d<f32>;
@group(0) @binding(2) var diffuse: sampler;
@group(0) @binding(3) var<uniform> offset: vec2<i32>;

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
    let textureSize = vec2<f32>(textureDimensions(diffuse_texture));
    let offsetCoord = input.v_st + vec2<f32>(offset) / textureSize;
    let texel00 = textureSample(diffuse_texture, diffuse, offsetCoord, vec2<i32>(-1, -1));
    let texel10 = textureSample(diffuse_texture, diffuse, offsetCoord, vec2<i32>(0, -1));
    let texel01 = textureSample(diffuse_texture, diffuse, offsetCoord, vec2<i32>(-1, 0));
    let texel11 = textureSample(diffuse_texture, diffuse, offsetCoord, vec2<i32>(0, 0));
    return (texel00 + texel10 + texel01 + texel11) * 0.25;
}

