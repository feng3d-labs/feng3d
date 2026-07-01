/**
 * 颜色顶点着色器 WGSL
 *
 * 绑定约定（所有 core WGSL 顶点着色器统一）：
 * - @group(0) @binding(0) var<uniform> transform   - { u_modelMatrix, u_ITModelMatrix }（Transform 注入）
 * - @group(0) @binding(1) var<uniform> cameraUniforms - { u_viewProjection, u_cameraPos, ... }（Camera 注入）
 * - @group(0) @binding(2) var<uniform> globalUniforms - { u_sceneAmbientColor, _Time }（Scene 注入）
 * - @group(0) @binding(3) var<uniform> uniforms     - 材质参数（Material 注入）
 *
 * 顶点输入（与 core Geometry 的 a_* 属性经 MaterialPipeline 名称映射后一致）：
 * - @location(0) position
 * - @location(1) color  （可选，缺失时用材质 u_diffuseInput）
 */

/**
 * 颜色顶点着色器代码
 */
export const colorVertexWGSL = `
struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) color: vec4<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
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
    // [DEBUG] 临时：跳过矩阵，直接用模型空间坐标作为裁剪空间坐标
    output.position = vec4<f32>(input.position.xy, 0.0, 1.0);
    output.color = input.color;
    return output;
}
`;

/**
 * 颜色顶点着色器导出
 */
export default colorVertexWGSL;
