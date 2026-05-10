@binding(0) @group(0) var<uniform> mvp : mat4x4<f32>;

@vertex
fn main(
    @location(0) position: vec2<f32>,
) -> @builtin(position) vec4<f32> {
    return mvp * vec4<f32>(position, 0.0, 1.0);
}
