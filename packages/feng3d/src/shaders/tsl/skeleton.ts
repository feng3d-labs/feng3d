/**
 * 蒙皮（skinning）的 TSL 定义（issue #337 / #711）。
 *
 * 语义与迁移前的 `shaders/modules/skeleton.wgsl.ts` 一致（生成结果也逐行对应）：
 * 按两组各 4 根骨骼的权重累加 `u_skeletonGlobalMatriices[index] * position * weight`
 * （每顶点最多 8 根骨骼；对应 glTF 的 JOINTS_0/WEIGHTS_0 与 JOINTS_1/WEIGHTS_1）。
 *
 * 这里用到 TSL 本批补齐的三项能力（原先没有，导致这段逻辑无法用 TSL 表达）：
 * - `forRange_`：WGSL 的 `for (var i = 0; i < n; i = i + 1)` 循环；
 * - `Vec4.index(i)`：向量的动态索引 `v[i]`（原先只有 swizzle 分量）；
 * - `int(f32)`：`i32(...)` 转换（数组索引需要整数）。
 *
 * 构建结果懒加载并缓存（模块顶层不执行构建，见 AGENTS.md §15 R2）。
 */
import { forRange_, func, if_, int, let_, return_, uniform, var_, vec4 } from '@feng3d/tsl';
import { createSkeletonUniformStruct } from './uniforms';

/**
 * WGSL 里 `u_skeletonGlobalMatriices` 的固定槽位数。
 *
 * 与 `SkinnedMeshRendererLogic` 的补齐长度一致（数据侧会把骨骼矩阵补到这个长度）。
 */
export const SKIN_MATRIX_COUNT = 150;

/** 懒构建缓存 */
let cachedSkeleton: { uniforms: string; skinning: string } | null = null;

/**
 * 获取 SkinnedUniforms 的 WGSL 声明（struct + `@group(3) @binding(0)` uniform）。
 *
 * @returns WGSL 文本片段
 */
export function getSkeletonUniformsWGSL(): string
{
    if (cachedSkeleton === null)
    {
        cachedSkeleton = buildSkeleton();
    }

    return cachedSkeleton.uniforms;
}

/**
 * 获取 `skinPosition` 函数的 WGSL 定义。
 *
 * @returns WGSL 文本片段
 */
export function getSkinningWGSL(): string
{
    if (cachedSkeleton === null)
    {
        cachedSkeleton = buildSkeleton();
    }

    return cachedSkeleton.skinning;
}

/**
 * 用 TSL 构建蒙皮的 uniform 声明与函数定义。
 *
 * @returns uniform 与函数两段 WGSL
 */
function buildSkeleton(): { uniforms: string; skinning: string }
{
    const structType = createSkeletonUniformStruct(SKIN_MATRIX_COUNT);
    const skinned = structType(uniform('skinned', 3, 0));
    const matrices = skinned.u_skeletonGlobalMatriices;

    const skinPosition = func(
        'skinPosition',
        [['position', vec4], ['skinIndices', vec4], ['skinWeights', vec4], ['skinIndices1', vec4], ['skinWeights1', vec4]],
        vec4,
        (position, skinIndices, skinWeights, skinIndices1, skinWeights1) =>
        {
            // 两组权重和为 0 时原样返回——非蒙皮几何误用本函数的兜底（顶点属性缺失时引擎零填充为 0）
            const weightSum = let_('weightSum', skinWeights.x.add(skinWeights.y).add(skinWeights.z).add(skinWeights.w)
                .add(skinWeights1.x).add(skinWeights1.y).add(skinWeights1.z).add(skinWeights1.w));
            if_(weightSum.lessThanOrEqual(0.0), () =>
            {
                return_(position);
            });

            const totalPosition = var_('totalPosition', vec4(0.0, 0.0, 0.0, 1.0));

            // 两组各 4 根骨骼（与手写版本的两个 for 循环逐行对应）
            forRange_('i', 0, 4, (i) =>
            {
                totalPosition.assign(totalPosition.add(
                    matrices.index(int(skinIndices.index(i))).multiply(position).multiply(skinWeights.index(i)),
                ));
            });
            forRange_('i', 0, 4, (i) =>
            {
                totalPosition.assign(totalPosition.add(
                    matrices.index(int(skinIndices1.index(i))).multiply(position).multiply(skinWeights1.index(i)),
                ));
            });

            return_(vec4(totalPosition.xyz, position.w));
        });

    const def = structType._definition;
    const uniforms = `${def.toWGSLStruct()}\n\n${def.toWGSLUniform('skinned', 3, 0)}\n`;

    return { uniforms, skinning: `${skinPosition.toWGSL()}\n` };
}
