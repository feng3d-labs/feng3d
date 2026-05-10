struct VaryingStruct {
    @builtin(position) vPosition: vec4<f32>,
    @location(0) vTextureCoord: vec2<f32>,
    @location(1) vFragPosition: vec4<f32>,
}
@binding(2) @group(0) var uSampler_texture: texture_2d<f32>;
@binding(3) @group(0) var uSampler: sampler;

@fragment
fn main(v: VaryingStruct) -> @location(0) vec4<f32> {
    var color = textureSample(uSampler_texture, uSampler, v.vTextureCoord) * v.vFragPosition;
    return color;
}
