@binding(0) @group(0) var<uniform> color : vec4<f32>;
@fragment
fn main() -> @location(0) vec4f {
    return color;
}

