struct FragmentInput {
    @location(0) v_texcoord: vec3<f32>,
}

@group(0) @binding(0) var diffuse_texture: texture_3d<f32>;
@group(0) @binding(1) var diffuse: sampler;

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
    return textureSample(diffuse_texture, diffuse, input.v_texcoord);
}

