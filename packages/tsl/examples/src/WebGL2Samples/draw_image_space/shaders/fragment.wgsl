@binding(0) @group(0) var diffuse_texture: texture_2d<f32>;
@binding(1) @group(0) var diffuse: sampler;
@binding(2) @group(0) var<uniform> u_imageSize: vec2<f32>;

@fragment
fn main(
    @builtin(position) fragCoord: vec4<f32>,
) -> @location(0) vec4<f32> {
    return textureSample(diffuse_texture, diffuse, vec2<f32>(fragCoord.x, u_imageSize.y - (-fragCoord.y)) / u_imageSize);
}