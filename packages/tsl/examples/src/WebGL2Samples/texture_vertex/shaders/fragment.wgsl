struct VaryingStruct {
    @location(0) v_st: vec2<f32>,
    @location(1) v_position: vec3<f32>,
}

@group(0) @binding(4) var diffuse_texture: texture_2d<f32>;
@group(0) @binding(5) var diffuse: sampler;

fn textureLevel(v_st: vec2<f32>) -> f32 {
    let size = vec2<f32>(textureDimensions(diffuse_texture, 0));

    let levelCount = max(log2(size.x), log2(size.y));

    let dx = dpdx(v_st * size);
    let dy = dpdy(v_st * size);
    var d = max(dot(dx, dx), dot(dy, dy));

    d = clamp(d, 1.0, pow(2.0, (levelCount - 1.0) * 2.0));

    return 0.5 * log2(d);
}

@fragment
fn main(v: VaryingStruct) -> @location(0) vec4<f32> {
    let sampleCoord = fract(v.v_st);
    let level = textureLevel(v.v_st);

    // Compute LOD using gradient
    var color = textureSampleLevel(diffuse_texture, diffuse, v.v_st, level);

    // Compute flat normal using gradient
    // 注意：dpdy 取反以补偿 WebGL/WebGPU Y 轴方向差异
    let fdx = vec3<f32>(dpdx(v.v_position.x), dpdx(v.v_position.y), dpdx(v.v_position.z));
    let fdy = vec3<f32>(-dpdy(v.v_position.x), -dpdy(v.v_position.y), -dpdy(v.v_position.z));

    let N = normalize(cross(fdx, fdy));
    color = mix(color, vec4<f32>(N, 1.0), 0.5);

    return color;
}
