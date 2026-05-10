struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
}

@binding(0) @group(0) var<uniform> uModelViewMatrix: mat4x4<f32>;
@binding(1) @group(0) var<uniform> uProjectionMatrix: mat4x4<f32>;

@vertex
fn main(
    @location(0) aVertexPosition: vec2<f32>,
    @location(1) aVertexColor: vec4<f32>,
) -> VertexOutput {
    var output: VertexOutput;
    var position = vec4<f32>(aVertexPosition, 0.0, 1.0);
    output.position = uProjectionMatrix * uModelViewMatrix * position;
    output.color = aVertexColor;
    return output;
}

