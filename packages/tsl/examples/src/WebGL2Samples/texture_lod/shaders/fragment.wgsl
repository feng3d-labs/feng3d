struct FragmentInput {
    @location(0) v_st: vec2<f32>,
}

@group(0) @binding(1) var diffuse_texture: texture_2d<f32>;
@group(0) @binding(2) var diffuse: sampler;
@group(0) @binding(3) var<uniform> lodBias: f32;

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
    return textureSampleBias(diffuse_texture, diffuse, input.v_st, lodBias);
}

