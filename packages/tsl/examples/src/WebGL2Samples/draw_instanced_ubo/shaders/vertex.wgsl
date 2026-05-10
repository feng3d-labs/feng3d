// Transform UBO - 与 bindingResources 的 key 对应
struct Transform {
    MVP: array<mat4x4<f32>, 2>
}
@group(0) @binding(0) var<uniform> transform: Transform;

struct VertexInput {
    @location(0) pos: vec2<f32>,
    @builtin(instance_index) instance_index: u32
}

struct VertexOutput {
    @location(0) @interpolate(flat) instance: i32,
    @builtin(position) position: vec4<f32>
}

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    
    output.instance = i32(input.instance_index);
    output.position = transform.MVP[input.instance_index] * vec4<f32>(input.pos, 0.0, 1.0);
    
    return output;
}
