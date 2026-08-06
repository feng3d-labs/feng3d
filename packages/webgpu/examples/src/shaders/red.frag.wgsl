struct FragmentOut {
    @location(0) color0: vec4<f32>,
    @location(1) color1: vec4<f32>
}

@fragment
fn main() -> FragmentOut {

    var output: FragmentOut;
    output.color0 = vec4(1.0, 0.0, 0.0, 1.0);
    output.color1 = vec4(1.0, 1.0, 0.0, 1.0);

    return output;
}
