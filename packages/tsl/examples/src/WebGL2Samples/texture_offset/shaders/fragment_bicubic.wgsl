struct FragmentInput {
    @location(0) v_st: vec2<f32>,
}

@group(0) @binding(1) var diffuse_texture: texture_2d<f32>;
@group(0) @binding(2) var diffuse: sampler;

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
    let size = vec2<f32>(textureDimensions(diffuse_texture));
    let texelCoord = vec2<i32>(input.v_st * size);
    let texel00 = textureLoad(diffuse_texture, texelCoord + vec2<i32>(-1, -1), 0u);
    let texel10 = textureLoad(diffuse_texture, texelCoord + vec2<i32>(0, -1), 0u);
    let texel01 = textureLoad(diffuse_texture, texelCoord + vec2<i32>(-1, 0), 0u);
    let texel11 = textureLoad(diffuse_texture, texelCoord + vec2<i32>(0, 0), 0u);
    return (texel00 + texel10 + texel01 + texel11) * 0.25;
}

