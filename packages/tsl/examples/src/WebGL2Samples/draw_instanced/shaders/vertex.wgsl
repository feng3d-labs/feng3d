struct VertexInput {
    @location(0) pos: vec2<f32>,
    @location(1) color: vec4<f32>,
    @builtin(instance_index) instance_index: u32
}

struct VertexOutput {
    @location(0) @interpolate(flat) v_color: vec4<f32>,
    @builtin(position) position: vec4<f32>
}

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.v_color = input.color;
    output.position = vec4<f32>(input.pos + vec2<f32>(f32(input.instance_index) - 0.5, 0.0), 0.0, 1.0);
    return output;
}
