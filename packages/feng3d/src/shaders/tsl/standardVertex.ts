/**
 * 标准材质顶点着色器（TSL 版；标准/地形材质共用，含蒙皮变体）。
 *
 * 语义与迁移前的内联 WGSL 逐行一致（从 standard.vertex.glsl + vertex modules 翻译：
 * position_vert → worldposition_vert → project_vert → normalmap_vert），
 * 输出 worldPosition / worldNormal / worldTangent / worldBitangent / uv / color / shadowPos。
 *
 * 蒙皮变体（issue #337）：顶点输入多 4 个骨骼属性（两组 JOINTS/WEIGHTS，每顶点最多 8 根骨骼），
 * 位置先经 skinPosition 加权，其余完全共用。
 *
 * **varying 的 `@location` 必须显式给**：TSL 默认按"使用顺序"分配，而片元着色器期望的是
 * 固定的 0–6（见 standardFragment）。显式传入后两侧才对齐。
 *
 * 构建结果懒加载并缓存（模块顶层不执行构建，见 AGENTS.md §15 R2）。
 */
import { attribute, cross, float, func, gl_Position, gl_VertexID, let_, mat4, normalize, struct, uniform, varying, vec2, vec3, vec4, vertex } from '@feng3d/tsl';
import { createCameraUniforms, createGlobalUniforms, createTransformUniforms } from './uniforms';
import { createSkeletonUniforms, createSkinPositionFunc } from './skeleton';
import { createMorphPositionFunc, createMorphUniforms } from './morph';

type Vec2Value = ReturnType<typeof vec2>;
type Vec3Value = ReturnType<typeof vec3>;
type Vec4Value = ReturnType<typeof vec4>;

/** 懒构建缓存（标准 / 蒙皮 / morph 三份） */
let cached: { standard: string; skinned: string; morph: string } | null = null;

/**
 * 获取标准材质顶点着色器（非蒙皮）。
 *
 * @returns WGSL 文本
 */
export function getStandardVertexWGSL(): string
{
    if (cached === null)
    {
        cached = buildAllStandardVertexWGSL();
    }

    return cached.standard;
}

/**
 * 获取标准材质顶点着色器（蒙皮变体，issue #337）。
 *
 * @returns WGSL 文本
 */
export function getStandardSkinnedVertexWGSL(): string
{
    if (cached === null)
    {
        cached = buildAllStandardVertexWGSL();
    }

    return cached.skinned;
}

/**
 * 获取标准材质顶点着色器（morph 变体，阶段 C）。
 *
 * 顶点位置先经 `morphPosition`（按 morph target 权重加权 delta），其余与标准版完全共用。
 *
 * @returns WGSL 文本
 */
export function getStandardMorphVertexWGSL(): string
{
    if (cached === null)
    {
        cached = buildAllStandardVertexWGSL();
    }

    return cached.morph;
}

/** 一次构建三个变体（缓存填充） */
function buildAllStandardVertexWGSL(): { standard: string; skinned: string; morph: string }
{
    return {
        standard: buildStandardVertexWGSL(false, false),
        skinned: buildStandardVertexWGSL(true, false),
        morph: buildStandardVertexWGSL(false, true),
    };
}

/**
 * 构建标准材质顶点着色器。
 *
 * @param skinned 是否蒙皮变体
 * @param morphed 是否 morph target 变体（本批不与蒙皮组合：morph 模型都没有骨骼）
 * @returns WGSL 文本
 */
function buildStandardVertexWGSL(skinned: boolean, morphed: boolean): string
{
    const transform = createTransformUniforms();
    const camera = createCameraUniforms();
    void createGlobalUniforms;

    // shadow VP uniform（vertex/fragment 共用，与 shaders/tsl/standardLightingPars 的 ShadowUniforms 同布局）
    const ShadowVPUniforms = struct('ShadowVPUniforms', {
        u_shadowVP: mat4,
        u_lightPosition: vec3,
        u_shadowCameraNear: float,
        u_shadowCameraFar: float,
        u_shadowBias: float,
        u_shadowEnabled: float,
        u_shadowType: float,
        u_shadowMapSize: vec2,
        u_shadowRadius: float,
    });
    const shadowData = ShadowVPUniforms(uniform('shadowData', 0, 5)) as unknown as { u_shadowVP: ReturnType<typeof mat4> };

    // 顶点输入（location 0–4 公共；蒙皮多 5–8）
    const a_position = vec3(attribute('a_position', 0));
    const a_normal = vec3(attribute('a_normal', 1));
    const a_tangent = vec3(attribute('a_tangent', 2));
    const a_uv = vec2(attribute('a_uv', 3));
    const a_color = vec4(attribute('a_color', 4));

    // varying：显式 location，与片元着色器对齐
    const v_worldPosition = vec3(varying('worldPosition', 0));
    const v_worldNormal = vec3(varying('worldNormal', 1));
    const v_worldTangent = vec3(varying('worldTangent', 2));
    const v_worldBitangent = vec3(varying('worldBitangent', 3));
    const v_uv = vec2(varying('uv', 4));
    const v_color = vec4(varying('color', 5));
    const v_shadowPos = vec3(varying('shadowPos', 6));

    // 蒙皮：声明 uniform + skinPosition 函数
    let skinPositionFn = null as ReturnType<typeof func> | null;
    let skinIndices: Vec4Value | null = null;
    let skinWeights: Vec4Value | null = null;
    let skinIndices1: Vec4Value | null = null;
    let skinWeights1: Vec4Value | null = null;
    if (skinned)
    {
        void createSkeletonUniforms;
        skinPositionFn = createSkinPositionFunc();
        skinIndices = vec4(attribute('a_skinIndices', 5));
        skinWeights = vec4(attribute('a_skinWeights', 6));
        skinIndices1 = vec4(attribute('a_skinIndices1', 7));
        skinWeights1 = vec4(attribute('a_skinWeights1', 8));
    }

    // morph target：声明 uniform + morphPosition 函数（顶点位置按权重加权 delta）
    let morphPositionFn = null as ReturnType<typeof func> | null;
    if (morphed)
    {
        void createMorphUniforms;
        morphPositionFn = createMorphPositionFunc();
    }

    const shader = vertex('main', () =>
    {
        void shadowData;
        // position_vert（蒙皮版把位置计算换成 skinPosition，其余逐行一致）
        const localPosition = let_('position', vec4(a_position, 1.0) as Vec4Value);
        let skinnedPosition: Vec4Value | null = null;
        if (skinned)
        {
            const skinCall = skinPositionFn as unknown as (...args: Vec4Value[]) => Vec4Value;
            skinnedPosition = let_('skinnedPosition', skinCall(
                localPosition,
                skinIndices as Vec4Value, skinWeights as Vec4Value,
                skinIndices1 as Vec4Value, skinWeights1 as Vec4Value,
            ));
        }
        let position = (skinned ? skinnedPosition : localPosition) as Vec4Value;

        // morph target：顶点位置 = 原位置 + Σᵢ wᵢ × deltaᵢ（gl_VertexID 用来索引 delta）
        if (morphed)
        {
            const morphCall = morphPositionFn as unknown as (p: Vec4Value, vertexIndex: unknown) => Vec4Value;

            position = let_('morphedPosition', morphCall(position, gl_VertexID));
        }

        // worldposition_vert
        const worldPosition = let_('worldPosition', transform.u_modelMatrix.multiply(position));
        v_worldPosition.assign(worldPosition.xyz as Vec3Value);

        // project_vert
        gl_Position.assign(camera.u_viewProjection.multiply(worldPosition));

        // normalmap_vert：法线/切线/副切线变换到世界空间
        const normal = let_('normal', normalize(transform.u_ITModelMatrix.multiply(vec4(a_normal, 0.0)).xyz as Vec3Value));
        const tangent = let_('tangent', normalize(transform.u_modelMatrix.multiply(vec4(a_tangent, 0.0)).xyz as Vec3Value));
        const bitangent = let_('bitangent', cross(normal, tangent));
        v_worldNormal.assign(normal);
        v_worldTangent.assign(tangent);
        v_worldBitangent.assign(bitangent);

        // uv_vert / color_vert
        v_uv.assign(a_uv);
        v_color.assign(a_color);

        // shadow_vert：光源空间投影坐标（参考 webgpu shadowMapping vertex.wgsl）
        const posFromLight = let_('posFromLight', (shadowData as unknown as { u_shadowVP: { multiply(v: Vec4Value): Vec4Value } }).u_shadowVP.multiply(worldPosition));
        // TSL 的 vec2(x) 不做标量广播，写成 (x, x)
        const shadowXY = let_('shadowXY', posFromLight.xy.multiply(vec2(0.5, -0.5)).add(vec2(0.5, 0.5)) as Vec2Value);
        v_shadowPos.assign(vec3(shadowXY.x, shadowXY.y, posFromLight.z.divide(posFromLight.w)) as Vec3Value);
    });

    return shader.toWGSL();
}
