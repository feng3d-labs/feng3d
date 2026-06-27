/**
 * 标准顶点着色器 WGSL 框架
 */

/**
 * 标准顶点着色器代码框架
 */
export const standardVertexWGSL = `
// 引入通用工具函数
${/* 这里会在编译时引入 common.wgsl */''}

struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) tangent: vec3<f32>,
    @location(3) uv: vec2<f32>,
    @location(4) color: vec4<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) worldPosition: vec3<f32>,
    @location(1) worldNormal: vec3<f32>,
    @location(2) worldTangent: vec3<f32>,
    @location(3) uv: vec2<f32>,
    @location(4) color: vec4<f32>,
}

struct Uniforms {
    modelMatrix: mat4x4<f32>,
    viewProjectionMatrix: mat4x4<f32>,
    normalMatrix: mat3x3<f32>,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;

    // 计算世界坐标
    let worldPosition = uniforms.modelMatrix * vec4<f32>(input.position, 1.0);
    output.worldPosition = worldPosition.xyz;

    // 计算裁剪空间坐标
    output.position = uniforms.viewProjectionMatrix * worldPosition;

    // 计算世界空间法线
    output.worldNormal = normalize(uniforms.normalMatrix * input.normal);

    // 计算世界空间切线
    output.worldTangent = normalize(uniforms.normalMatrix * input.tangent);

    // 传递 UV 和颜色
    output.uv = input.uv;
    output.color = input.color;

    return output;
}
`;

/**
 * 标准顶点着色器导出
 */
export default standardVertexWGSL;