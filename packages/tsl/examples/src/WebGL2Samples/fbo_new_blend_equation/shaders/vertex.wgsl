struct VertexOutput {
    @builtin(position) gl_Position: vec4<f32>,
    @location(0) v_st: vec2<f32>,
};

@binding(0) @group(0) var<uniform> mvp: mat4x4<f32>;

@vertex
fn main(
    @location(0) position: vec2<f32>,
    @location(1) textureCoordinates: vec2<f32>,
) -> VertexOutput {
    var output: VertexOutput;
    output.v_st = textureCoordinates;
    output.gl_Position = mvp * vec4<f32>(position, 0.0, 1.0);
    return output;
}
