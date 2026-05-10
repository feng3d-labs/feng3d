@group(0) @binding(2) var diffuse_texture: texture_2d<f32>;
@group(0) @binding(3) var diffuse: sampler;

struct FragmentInput {
    @location(0) v_uv: vec2<f32>,
    @location(1) vPosition: vec3<f32>,
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
    let size = vec2<f32>(vec2<i32>(textureDimensions(diffuse_texture, 0)));
    let dx = dpdx(input.v_uv * size);
    let dy = -dpdy(input.v_uv * size);
    var color = textureSampleGrad(diffuse_texture, diffuse, input.v_uv, dx, dy);

    // Compute flat normal using gradient
    let fdx = vec3<f32>(dpdx(input.vPosition.x), dpdx(input.vPosition.y), dpdx(input.vPosition.z));
    let fdy = vec3<f32>(-dpdy(input.vPosition.x), -dpdy(input.vPosition.y), -dpdy(input.vPosition.z));

    let N = normalize(cross(fdx, fdy));
    color = mix(color, vec4<f32>(N, 1.0), 0.5);
    return color;
}

