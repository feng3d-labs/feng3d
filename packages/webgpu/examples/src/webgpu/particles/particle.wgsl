////////////////////////////////////////////////////////////////////////////////
// Vertex shader
////////////////////////////////////////////////////////////////////////////////
struct RenderParams {
  modelViewProjectionMatrix: mat4x4<f32>,
  right: vec3<f32>,
  up: vec3<f32>
}
@binding(0) @group(0) var<uniform> render_params : RenderParams;

struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) color: vec4<f32>,
  @location(2) quad_pos: vec2<f32>, // -1..+1
}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
  @location(1) quad_pos: vec2<f32>, // -1..+1
}

@vertex
fn vs_main(in: VertexInput) -> VertexOutput {
    var quad_pos = mat2x3<f32>(render_params.right, render_params.up) * in.quad_pos;
    var position = in.position + quad_pos * 0.01;
    var out: VertexOutput;
    out.position = render_params.modelViewProjectionMatrix * vec4<f32>(position, 1.0);
    out.color = in.color;
    out.quad_pos = in.quad_pos;
    return out;
}

////////////////////////////////////////////////////////////////////////////////
// Fragment shader
////////////////////////////////////////////////////////////////////////////////
@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    var color = in.color;
  // Apply a circular particle alpha mask
    color.a = color.a * max(1.0 - length(in.quad_pos), 0.0);
    return color;
}
