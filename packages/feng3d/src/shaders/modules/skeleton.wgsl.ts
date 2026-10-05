/**
 * 蒙皮（skinning）WGSL 片段（issue #337）。
 *
 * 从 GLSL 旧源 `packages/feng3d/src/shaders/modules/skeleton_pars_vert.glsl` 翻译而来，
 * 语义保持一致：只蒙皮位置（法线不参与），按两组各 4 个骨骼影响累加
 * `u_skeletonGlobalMatriices[index] * position * weight`。
 *
 * 与数据侧 `SkinnedUniforms`（`packages/feng3d/src/render/data/Uniform.ts`）对应：
 * `u_skeletonGlobalMatriices` 的数组长度在 WGSL 里必须是编译期常量（{@link SKIN_MATRIX_COUNT}），
 * 数据侧由 `SkinnedMeshRendererLogic` 补齐到同样长度。
 *
 * **只消费第一组 `a_skinIndices`/`a_skinWeights`（每顶点 4 根骨骼）**：WebGPU 默认
 * `maxVertexBuffers = 8`，而顶点缓冲按"属性数据对象"分组（见 `WGPUVertexBufferLayout`）——
 * 标准材质原有 5 个属性 + 一组蒙皮属性刚好 7 个；再声明第二组会到 9 个、直接创建管线失败。
 * glTF 的 `JOINTS_1`/`WEIGHTS_1` 仍由加载器解析落盘，消费它需要先把蒙皮属性交错进同一个
 * 顶点缓冲（或申请更高 limit），属下一步工作（见 PR 欠账）。
 *
 * 绑定槽位取 `@group(3) @binding(0)`：group 0 的 0–5 已被 transform / cameraUniforms /
 * globalUniforms / material_uniforms / lights / shadowData 占满，group 1、2 分别是材质纹理与
 * 阴影贴图（见各 WGSL 片段的注释），group 3 空闲。
 */

/**
 * WGSL 里 `u_skeletonGlobalMatriices` 的固定槽位数（与 `SkinnedMeshRendererLogic` 的补齐长度一致）。
 *
 * 取值与既有默认数组长度（150）一致；glTF 模型骨骼数通常远小于它。
 */
export const SKIN_MATRIX_COUNT = 150;

/**
 * SkinnedUniforms 结构体与绑定声明（各蒙皮顶点着色器拼接使用）。
 */
export const skeletonUniformsWGSL = `
struct SkinnedUniforms {
    u_skeletonGlobalMatriices: array<mat4x4<f32>, ${SKIN_MATRIX_COUNT}>,
}

@group(3) @binding(0) var<uniform> skinned: SkinnedUniforms;
`;

/**
 * 蒙皮函数（各蒙皮顶点着色器拼接使用）。
 */
export const skinningWGSL = `
// 蒙皮位置：每顶点 4 根骨骼的权重累加。权重和为 0 时原样返回——
// 这是非蒙皮几何误用本函数的兜底（顶点属性缺失时由引擎零填充为 0）。
fn skinPosition(
    position: vec4<f32>,
    skinIndices: vec4<f32>,
    skinWeights: vec4<f32>,
) -> vec4<f32> {
    let weightSum = skinWeights.x + skinWeights.y + skinWeights.z + skinWeights.w;
    if (weightSum <= 0.0) {
        return position;
    }

    var totalPosition = vec4<f32>(0.0, 0.0, 0.0, 1.0);
    for (var i = 0; i < 4; i = i + 1) {
        totalPosition = totalPosition
            + skinned.u_skeletonGlobalMatriices[i32(skinIndices[i])] * position * skinWeights[i];
    }

    return vec4<f32>(totalPosition.xyz, position.w);
}
`;
