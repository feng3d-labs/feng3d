/**
 * 标准材质顶点着色器 WGSL（标准/地形材质共用；含蒙皮变体）。
 *
 * 从 standard.vertex.glsl + vertex modules 翻译：
 * position_vert → worldposition_vert → project_vert → normalmap_vert。
 *
 * 输出：worldPosition / worldNormal / worldTangent / worldBitangent / uv / color / shadowPos。
 *
 * 蒙皮变体（{@link standardSkinnedVertexWGSL}，issue #337）：顶点输入多 4 个骨骼属性
 * （`a_skinIndices`/`a_skinWeights` 与第二组），位置先经 `skinPosition` 加权，其余完全共用。
 * 由 `SkinnedMeshRendererLogic.beforeRender` 按材质管线就地换装。
 */
import { cameraUniformsWGSL } from '../cameras/Camera';
import { transformUniformsWGSL } from '../core/Object3D';
import { skeletonUniformsWGSL, skinningWGSL } from '../shaders/modules/skeleton.wgsl';

/** 顶点输入（公共前缀，location 0–4） */
const vertexInputHeadWGSL = `
struct VertexInput {
    @location(0) a_position: vec3<f32>,
    @location(1) a_normal: vec3<f32>,
    @location(2) a_tangent: vec3<f32>,
    @location(3) a_uv: vec2<f32>,
    @location(4) a_color: vec4<f32>,
`;

/** 蒙皮顶点属性（location 5–6，第一组 JOINTS/WEIGHTS；缺失时引擎零填充为 0） */
const skinnedVertexAttributeWGSL = `    @location(5) a_skinIndices: vec4<f32>,
    @location(6) a_skinWeights: vec4<f32>,
`;

const vertexInputTailWGSL = `}
`;

const vertexOutputWGSL = `
struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) worldPosition: vec3<f32>,
    @location(1) worldNormal: vec3<f32>,
    @location(2) worldTangent: vec3<f32>,
    @location(3) worldBitangent: vec3<f32>,
    @location(4) uv: vec2<f32>,
    @location(5) color: vec4<f32>,
    @location(6) shadowPos: vec3<f32>,
}

// shadow VP uniform（vertex/fragment 共用，与 standardLightingParsWGSL 的 ShadowUniforms 同布局）
struct ShadowVPUniforms {
    u_shadowVP: mat4x4<f32>,
    u_lightPosition: vec3<f32>,
    u_shadowCameraNear: f32,
    u_shadowCameraFar: f32,
    u_shadowBias: f32,
    u_shadowEnabled: f32,
    _pad0: f32,
    _pad1: f32,
}
@group(0) @binding(5) var<uniform> shadowData: ShadowVPUniforms;
`;

/** 顶点入口（蒙皮版把位置计算换成 skinPosition，其余逐行一致） */
function buildVertexMain(skinned: boolean): string
{
    const positionWGSL = skinned
        ? `    // 蒙皮（issue #337）：顶点位置先经骨骼矩阵加权
    let position = skinPosition(
        vec4<f32>(input.a_position, 1.0),
        input.a_skinIndices, input.a_skinWeights,
    );
`
        : `    // position_vert
    let position = vec4<f32>(input.a_position, 1.0);
`;

    return `
@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;

${positionWGSL}
    // worldposition_vert
    let worldPosition = transform.u_modelMatrix * position;
    output.worldPosition = worldPosition.xyz;

    // project_vert
    output.position = cameraUniforms.u_viewProjection * worldPosition;

    // normalmap_vert: 法线/切线/副切线变换到世界空间
    let normal = normalize((transform.u_ITModelMatrix * vec4<f32>(input.a_normal, 0.0)).xyz);
    let tangent = normalize((transform.u_modelMatrix * vec4<f32>(input.a_tangent, 0.0)).xyz);
    let bitangent = cross(normal, tangent);
    output.worldNormal = normal;
    output.worldTangent = tangent;
    output.worldBitangent = bitangent;

    // uv_vert
    output.uv = input.a_uv;

    // color_vert
    output.color = input.a_color;

    // shadow_vert: 光源空间投影坐标（参考 webgpu shadowMapping vertex.wgsl）
    // shadowData.u_shadowVP 是 P × V（wgpu-matrix 风格，ortho 把 z 映射到 [0,1]）。
    // shadowPos.xy 转到 (0,1) UV 空间（Y 翻转）；z 直接用 posFromLight.z/w（已与
    // 光栅化存入 depth buffer 的值同空间，因 ortho 是 WebGPU 风格 z→[0,1]）。
    let posFromLight = shadowData.u_shadowVP * worldPosition;
    output.shadowPos = vec3<f32>(
        posFromLight.xy / posFromLight.w * vec2<f32>(0.5, -0.5) + vec2<f32>(0.5),
        posFromLight.z / posFromLight.w
    );

    return output;
}
`;
}

/**
 * 标准材质顶点着色器（非蒙皮）。
 */
export const standardVertexWGSL = buildStandardVertexWGSL(false);

/**
 * 标准材质顶点着色器（蒙皮变体，issue #337）。
 */
export const standardSkinnedVertexWGSL = buildStandardVertexWGSL(true);

function buildStandardVertexWGSL(skinned: boolean): string
{
    return (skinned ? skeletonUniformsWGSL + skinningWGSL : '')
        + vertexInputHeadWGSL
        + (skinned ? skinnedVertexAttributeWGSL : '')
        + vertexInputTailWGSL
        + vertexOutputWGSL
        + transformUniformsWGSL
        + cameraUniformsWGSL
        + buildVertexMain(skinned);
}
