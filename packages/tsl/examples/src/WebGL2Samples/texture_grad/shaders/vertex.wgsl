@group(0) @binding(0) var<uniform> mvMatrix: mat4x4<f32>;
@group(0) @binding(1) var<uniform> pMatrix: mat4x4<f32>;

struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(4) texcoord: vec2<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) v_uv: vec2<f32>,
    @location(1) vPosition: vec3<f32>,
}

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.v_uv = input.texcoord;
    output.vPosition = (mvMatrix * vec4<f32>(input.position, 1.0)).xyz;
    let glPosition = pMatrix * mvMatrix * vec4<f32>(input.position, 1.0);
    output.position = vec4<f32>(glPosition.x, glPosition.y, glPosition.z * 0.5 + glPosition.w * 0.5, glPosition.w);
    return output;
}

