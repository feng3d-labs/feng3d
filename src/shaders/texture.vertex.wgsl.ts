/**
 * 纹理顶点着色器 WGSL
 *
 * 绑定约定见 color.vertex.wgsl.ts 顶部说明。
 *
 * 顶点输入（统一 location 约定，见 standard.vertex.wgsl.ts）：
 * - @location(0) position
 * - @location(3) uv
 */

/**
 * 纹理顶点着色器代码
 */
export const textureVertexWGSL = `
struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(3) uv: vec2<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
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
    output.position = cameraUniforms.u_viewProjection * worldPosition;
    output.uv = input.uv;
    return output;
}
`;

/**
 * 纹理顶点着色器导出
 */
export default textureVertexWGSL;
