/**
 * 点顶点着色器 WGSL
 *
 * 绑定约定见 color.vertex.wgsl.ts 顶部说明。
 *
 * 顶点输入（与 core Geometry 的 a_* 属性经 MaterialPipeline 名称映射后一致）：
 * - @location(0) position
 * - @location(1) color
 *
 * 注意：WebGPU 不支持顶点着色器输出点大小（无 gl_PointSize 等价物），
 * 点大小由 pipeline / GPU 默认（1 像素）。u_PointSize 仅作为 uniform 占位，
 * 供未来通过实例化或 geometry 扩展实现可变点大小时使用。
 */

/**
 * 点顶点着色器代码
 */
export const pointVertexWGSL = `
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
    let worldPosition = transform.u_modelMatrix * vec4<f32>(input.position, 1.0);
    output.position = cameraUniforms.u_viewProjection * worldPosition;
    output.color = input.color;
    return output;
}
`;

/**
 * 点顶点着色器导出
 */
export default pointVertexWGSL;
