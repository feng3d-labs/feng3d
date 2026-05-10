struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) @interpolate(flat) v_normal: vec3<f32>,
}

@group(0) @binding(0) var<uniform> mvp: mat4x4<f32>;
@group(0) @binding(1) var<uniform> mvNormal: mat4x4<f32>;

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.v_normal = normalize((mvNormal * vec4<f32>(input.normal, 0.0)).xyz);
    output.position = mvp * vec4<f32>(input.position, 1.0);
    return output;
}
