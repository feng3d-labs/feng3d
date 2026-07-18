/**
 * 天空盒顶点着色器 WGSL
 *
 * 用 @builtin(vertex_index) 索引硬编码立方体顶点，无需顶点缓冲区。
 * 去掉视图矩阵的平移分量，让天空盒跟随相机。pos.xyww 让天空盒在最远处绘制。
 *
 * 绑定约定：
 * - @group(0) @binding(1) var<uniform> cameraUniforms - 相机数据（含 u_viewMatrix / u_projectionMatrix）
 */

/**
 * 天空盒顶点着色器代码
 */
export const skyboxWGSL = `
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

// 硬编码立方体 36 个顶点（6 个面 × 2 三角形 × 3 顶点，按索引展开）
var<private> pos: array<vec3<f32>, 36> = array<vec3<f32>, 36>(
    // +Z face
    vec3<f32>(-1,  1,  1), vec3<f32>( 1,  1,  1), vec3<f32>( 1, -1,  1),
    vec3<f32>( 1, -1,  1), vec3<f32>(-1, -1,  1), vec3<f32>(-1,  1,  1),
    // -Z face
    vec3<f32>( 1,  1, -1), vec3<f32>(-1,  1, -1), vec3<f32>(-1, -1, -1),
    vec3<f32>(-1, -1, -1), vec3<f32>( 1, -1, -1), vec3<f32>( 1,  1, -1),
    // +X face
    vec3<f32>( 1,  1,  1), vec3<f32>( 1,  1, -1), vec3<f32>( 1, -1, -1),
    vec3<f32>( 1, -1, -1), vec3<f32>( 1, -1,  1), vec3<f32>( 1,  1,  1),
    // -X face
    vec3<f32>(-1,  1, -1), vec3<f32>(-1,  1,  1), vec3<f32>(-1, -1,  1),
    vec3<f32>(-1, -1,  1), vec3<f32>(-1, -1, -1), vec3<f32>(-1,  1, -1),
    // +Y face
    vec3<f32>(-1,  1, -1), vec3<f32>( 1,  1, -1), vec3<f32>( 1,  1,  1),
    vec3<f32>( 1,  1,  1), vec3<f32>(-1,  1,  1), vec3<f32>(-1,  1, -1),
    // -Y face
    vec3<f32>(-1, -1,  1), vec3<f32>( 1, -1,  1), vec3<f32>( 1, -1, -1),
    vec3<f32>( 1, -1, -1), vec3<f32>(-1, -1, -1), vec3<f32>(-1, -1,  1),
);

@vertex
fn vertex(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    var output: VertexOutput;
    let p = pos[vertexIndex];
    // 去掉视图矩阵的平移分量，让天空盒跟随相机
    let viewNoTrans = mat4x4<f32>(
        vec4<f32>(cameraUniforms.u_viewMatrix[0].xyz, 0.0),
        vec4<f32>(cameraUniforms.u_viewMatrix[1].xyz, 0.0),
        vec4<f32>(cameraUniforms.u_viewMatrix[2].xyz, 0.0),
        vec4<f32>(0.0, 0.0, 0.0, 1.0),
    );
    let viewProjectionNoTrans = cameraUniforms.u_projectionMatrix * viewNoTrans;
    let clipPos = viewProjectionNoTrans * vec4<f32>(p, 1.0);
    output.position = clipPos.xyww;
    output.dir = p;
    return output;
}

struct FragmentOutput {
    @location(0) color: vec4<f32>,
}

@group(1) @binding(0) var s_skyboxTextureSampler: sampler;
@group(1) @binding(1) var s_skyboxTexture: texture_cube<f32>;

@fragment
fn fragment(input: VertexOutput) -> FragmentOutput {
    var output: FragmentOutput;
    output.color = textureSample(s_skyboxTexture, s_skyboxTextureSampler, input.dir);
    return output;
}
`;

