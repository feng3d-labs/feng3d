struct FragmentInput {
    @location(0) @interpolate(flat) v_color: vec4<f32>
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
    return input.v_color;
}
