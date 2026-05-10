@binding(3) @group(0) var uSampler_texture: texture_2d<f32>;
@binding(4) @group(0) var uSampler: sampler;

@fragment
fn main(
    @location(0) vTextureCoord: vec2<f32>,
    @location(1) vLighting: vec3<f32>,
) -> @location(0) vec4<f32> {
    let texelColor = textureSample(uSampler_texture, uSampler, vTextureCoord);
    return vec4<f32>(texelColor.rgb * vLighting, texelColor.a);
}

