struct FragmentOutput {
    @location(0) color1: vec4<f32>,
    @location(1) color2: vec4<f32>,
}

@fragment
fn main() -> FragmentOutput {
    var output: FragmentOutput;
    output.color1 = vec4<f32>(1.0, 0.0, 0.0, 1.0);
    output.color2 = vec4<f32>(0.0, 0.0, 1.0, 1.0);
    return output;
}
