struct VertexInput {
    @location(0) position: vec2<f32>
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>
}

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.position = vec4<f32>(input.position, 0.0, 1.0);
    return output;
}
