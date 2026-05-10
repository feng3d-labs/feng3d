@group(0) @binding(1) var diffuse_texture: texture_2d<f32>;
@group(0) @binding(2) var diffuse: sampler;

struct FragmentInput {
    @location(0) uv: vec2<f32>
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
    return textureSample(diffuse_texture, diffuse, input.uv);
}
