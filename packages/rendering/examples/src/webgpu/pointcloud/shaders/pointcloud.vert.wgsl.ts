export const pointcloudVertWGSL = `
struct Uniforms {
    modelViewProjectionMatrix: mat4x4<f32>,
}

@binding(0) @group(0) var<uniform> uniforms : Uniforms;

struct VertexOutput {
    @builtin(position) Position: vec4<f32>,
    @location(0) color: vec4<f32>,
}

@vertex
fn main(
    @location(0) position: vec4<f32>,
    @location(1) color: vec4<f32>
) -> VertexOutput {
    var output: VertexOutput;
    output.Position = uniforms.modelViewProjectionMatrix * position;
    output.color = vec4<f32>(color.rgb / 255.0, color.a);
    return output;
}
`;
