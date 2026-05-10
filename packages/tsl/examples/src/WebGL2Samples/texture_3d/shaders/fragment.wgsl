struct VaryingStruct {
    @builtin(position) vPosition: vec4<f32>,
    @location(0) v_texcoord: vec3<f32>,
}

@binding(1) @group(0) var diffuse_texture: texture_3d<f32>;
@binding(2) @group(0) var diffuse: sampler;

@fragment
fn main(v: VaryingStruct) -> @location(0) vec4<f32> {
    return textureSample(diffuse_texture, diffuse, v.v_texcoord);
}

