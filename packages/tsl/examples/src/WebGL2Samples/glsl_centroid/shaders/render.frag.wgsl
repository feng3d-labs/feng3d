struct FragmentInput {
    @location(0) v_attribute: f32,
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
    let blue = vec4<f32>(0.0, 0.0, 1.0, 1.0);
    let yellow = vec4<f32>(1.0, 1.0, 0.0, 1.0);

    if (input.v_attribute >= 0.0) {
        return mix(blue, yellow, sqrt(input.v_attribute));
    } else {
        return yellow;
    }
}
