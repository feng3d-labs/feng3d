/**
 * 天空盒顶点着色器 WGSL
 *
 * 把立方体顶点直接投影到裁剪空间（取 xyww 让最远处绘制），采样立方体纹理。
 * 去掉视图矩阵的平移分量，让天空盒跟随相机。
 *
 * 绑定约定：
 * - @group(0) @binding(1) var<uniform> cameraUniforms - 相机数据（含 u_viewMatrix / u_projectionMatrix）
 */

/**
 * 天空盒顶点着色器代码
 */
export const skyboxVertexWGSL = `
struct VertexInput {
    @location(0) position: vec3<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) dir: vec3<f32>,
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

@group(0) @binding(1) var<uniform> cameraUniforms: CameraUniforms;

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    // 去掉视图矩阵的平移分量，让天空盒跟随相机
    let viewNoTrans = mat4x4<f32>(
        vec4<f32>(cameraUniforms.u_viewMatrix[0].xyz, 0.0),
        vec4<f32>(cameraUniforms.u_viewMatrix[1].xyz, 0.0),
        vec4<f32>(cameraUniforms.u_viewMatrix[2].xyz, 0.0),
        vec4<f32>(0.0, 0.0, 0.0, 1.0),
    );
    let viewProjectionNoTrans = cameraUniforms.u_projectionMatrix * viewNoTrans;
    let pos = viewProjectionNoTrans * vec4<f32>(input.position, 1.0);
    output.position = pos.xyww;
    output.dir = input.position;
    return output;
}
`;

/**
 * 天空盒顶点着色器导出
 */
export default skyboxVertexWGSL;
