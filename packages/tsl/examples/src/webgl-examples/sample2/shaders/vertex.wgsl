@binding(0) @group(0) var<uniform> uModelViewMatrix: mat4x4<f32>;
@binding(1) @group(0) var<uniform> uProjectionMatrix: mat4x4<f32>;

@vertex
fn main(
    @location(0) aVertexPosition: vec2<f32>,
) -> @builtin(position) vec4<f32> {
    let position = vec4<f32>(aVertexPosition, 0.0, 1.0);
    return uProjectionMatrix * uModelViewMatrix * position;
}

