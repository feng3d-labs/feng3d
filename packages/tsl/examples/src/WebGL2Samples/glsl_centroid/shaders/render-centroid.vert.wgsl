struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) @interpolate(perspective, centroid) v_attribute: f32,
}

@group(0) @binding(0) var<uniform> MVP: mat4x4<f32>;

@vertex
fn main(@location(0) position: vec2<f32>, @location(6) data: f32) -> VertexOutput {
    var output: VertexOutput;
    output.position = MVP * vec4<f32>(position, 0.0, 1.0);
    output.v_attribute = data;
    return output;
}
