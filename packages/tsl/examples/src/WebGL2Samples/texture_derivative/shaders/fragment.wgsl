struct VaryingStruct {
    @location(0) v_uv: vec2<f32>,
    @location(1) v_position: vec3<f32>,
}

@group(0) @binding(2) var diffuse_texture: texture_2d<f32>;
@group(0) @binding(3) var diffuse: sampler;

@fragment
fn main(v: VaryingStruct) -> @location(0) vec4<f32> {
    var color = textureSample(diffuse_texture, diffuse, v.v_uv);

    // Compute flat normal using gradient
    // 注意：dpdy 取反以补偿 WebGL/WebGPU Y 轴方向差异
    let fdx = vec3<f32>(dpdx(v.v_position.x), dpdx(v.v_position.y), dpdx(v.v_position.z));
    let fdy = vec3<f32>(-dpdy(v.v_position.x), -dpdy(v.v_position.y), -dpdy(v.v_position.z));

    let N = normalize(cross(fdx, fdy));
    color = mix(color, vec4<f32>(N, 1.0), 0.5);
    return color;
}

