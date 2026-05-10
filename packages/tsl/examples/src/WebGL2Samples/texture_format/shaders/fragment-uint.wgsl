struct FragmentInput {
    @location(0) v_st: vec2<f32>,
}

@group(0) @binding(1) var diffuse_texture: texture_2d<u32>;
@group(0) @binding(2) var diffuse: sampler;

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
    let size = vec2<i32>(textureDimensions(diffuse_texture, 0));
    let texcoord = input.v_st * vec2<f32>(size);
    let coord = vec2<i32>(texcoord);
    let texel = vec4<u32>(textureLoad(diffuse_texture, coord, 0u));

    return vec4<f32>(texel) / 255.0;
}

