struct VertexInput {
    @location(0) position: vec2<f32>,
    @location(4) texcoord: vec2<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) v_st: vec2<f32>,
}

@group(0) @binding(0) var<uniform> MVP: mat4x4<f32>;

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.v_st = input.texcoord;
    output.position = MVP * vec4<f32>(input.position, 0.0, 1.0);
    return output;
}

