@binding(1) @group(0) var diffuse_texture: texture_2d<f32>;
@binding(2) @group(0) var diffuse: sampler;

@fragment
fn main(
    @location(0) v_st: vec2<f32>,
) -> @location(0) vec4<f32> {
    return textureSample(diffuse_texture, diffuse, v_st);
}
