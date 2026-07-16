/**
 * 标准顶点着色器 WGSL
 *
 * 从 standard.vertex.glsl + vertex modules 翻译：
 * position_vert → worldposition_vert → project_vert → normalmap_vert
 *
 * 输出：worldPosition, worldNormal, worldTangent, worldBitangent, uv, color
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
    @location(2) worldTangent: vec3<f32>,
    @location(3) worldBitangent: vec3<f32>,
    @location(4) uv: vec2<f32>,
    @location(5) color: vec4<f32>,
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

    // position_vert
    let position = vec4<f32>(input.position, 1.0);

    // worldposition_vert
    let worldPosition = transform.u_modelMatrix * position;
    output.worldPosition = worldPosition.xyz;

    // project_vert
    output.position = cameraUniforms.u_viewProjection * worldPosition;

    // normalmap_vert: 法线/切线/副切线变换到世界空间
    let normal = normalize((transform.u_ITModelMatrix * vec4<f32>(input.normal, 0.0)).xyz);
    let tangent = normalize((transform.u_modelMatrix * vec4<f32>(input.tangent, 0.0)).xyz);
    let bitangent = cross(normal, tangent);
    output.worldNormal = normal;
    output.worldTangent = tangent;
    output.worldBitangent = bitangent;

    // uv_vert
    output.uv = input.uv;

    // color_vert
    output.color = input.color;

    // shadow 坐标改在片元着色器内用 worldPosition × u_shadowVP 计算（见 standard.fragment）

    return output;
}
`;
