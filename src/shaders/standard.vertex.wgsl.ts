/**
 * 标准顶点着色器 WGSL
 *
 * 绑定约定见 color.vertex.wgsl.ts 顶部说明。
 *
 * 顶点输入（统一 location 约定）：
 * - @location(0) position  vec3
 * - @location(1) normal    vec3
 * - @location(2) tangent   vec3
 * - @location(3) uv        vec2
 * - @location(4) color     vec4
 *
 * 输出（传给片段着色器）：
 * - @location(0) worldPosition  vec3
 * - @location(1) worldNormal    vec3
 * - @location(2) uv             vec2
 * - @location(3) color          vec4
 */

/**
 * 标准顶点着色器代码
 */
export const standardVertexWGSL = `
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
    @location(2) uv: vec2<f32>,
    @location(3) color: vec4<f32>,
}

struct TransformUniforms {
    u_modelMatrix: mat4x4<f32>,
    u_ITModelMatrix: mat4x4<f32>,
}

struct CameraUniforms {
    u_projectionMatrix: mat4x4<f32>,
    u_viewProjection: mat4x4<f32>,
    u_viewMatrix: mat4x4<f32>,
    u_cameraMatrix: mat4x4<f32>,
    u_cameraPos: vec3<f32>,
    u_skyBoxSize: f32,
    u_scaleByDepth: f32,
}

@group(0) @binding(0) var<uniform> transform: TransformUniforms;
@group(0) @binding(1) var<uniform> cameraUniforms: CameraUniforms;

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;

    let worldPosition = transform.u_modelMatrix * vec4<f32>(input.position, 1.0);
    output.worldPosition = worldPosition.xyz;
    output.position = cameraUniforms.u_viewProjection * worldPosition;

    // u_ITModelMatrix 是模型逆转置矩阵，用于把法线变换到世界空间
    let normalMatrix = mat3x3<f32>(
        transform.u_ITModelMatrix[0].xyz,
        transform.u_ITModelMatrix[1].xyz,
        transform.u_ITModelMatrix[2].xyz,
    );
    output.worldNormal = normalize(normalMatrix * input.normal);

    output.uv = input.uv;
    output.color = input.color;

    return output;
}
`;

/**
 * 标准顶点着色器导出
 */
export default standardVertexWGSL;
