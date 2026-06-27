/**
 * 纹理顶点着色器 WGSL
 */

/**
 * 纹理顶点着色器代码
 */
export const textureVertexWGSL = `
struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) uv: vec2<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
}

struct Uniforms {
    modelViewProjectionMatrix: mat4x4<f32>,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.position = uniforms.modelViewProjectionMatrix * vec4<f32>(input.position, 1.0);
    output.uv = input.uv;
    return output;
}
`;

/**
 * 纹理顶点着色器导出
 */
export default textureVertexWGSL;