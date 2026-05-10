struct FragmentOut {
    @location(0) red: vec4<f32>,
    @location(1) green: vec4<f32>,
    @location(2) blue: vec4<f32>,
}

@fragment
fn main() -> FragmentOut {
    var output: FragmentOut;
    output.red = vec4<f32>(0.5, 0.0, 0.0, 1.0);
    output.green = vec4<f32>(0.0, 0.3, 0.0, 1.0);
    output.blue = vec4<f32>(0.0, 0.0, 0.8, 1.0);
    return output;
}
