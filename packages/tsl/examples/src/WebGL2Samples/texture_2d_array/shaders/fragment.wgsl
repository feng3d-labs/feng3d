struct VaryingStruct {
    @builtin(position) vPosition: vec4<f32>,
    @location(0) v_st: vec2<f32>,
}

@binding(1) @group(0) var diffuse_texture: texture_2d_array<f32>;
@binding(2) @group(0) var diffuse: sampler;
@binding(3) @group(0) var<uniform> layer: i32;

@fragment
fn main(v: VaryingStruct) -> @location(0) vec4<f32> {
    return textureSample(diffuse_texture, diffuse, v.v_st, layer);
}

