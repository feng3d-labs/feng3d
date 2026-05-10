@binding(2) @group(0) var uSampler_texture: texture_2d<f32>;
@binding(3) @group(0) var uSampler: sampler;

@fragment
fn main(
    @location(0) vTextureCoord: vec2<f32>
) -> @location(0) vec4<f32> {
    return textureSample(uSampler_texture, uSampler, vTextureCoord);
}

