struct FragmentInput {
    @location(0) v_normal: vec3<f32>,
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
    return vec4<f32>(input.v_normal, 1.0);
}
