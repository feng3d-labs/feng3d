/**
 * morph target（顶点形变）的 TSL 定义（`webgl_shadowmap` 阶段 C）。
 *
 * 语义：`position' = position + Σᵢ wᵢ × deltaᵢ`——glTF 的 morph target 动画。
 *
 * 为什么不是 uniform 数组（与 {@link Skeleton} 的 `array<mat4x4<f32>, N>` 不同）：
 * delta 的数据量按「顶点数 × target 数」增长，实测 Horse 796 顶点 × 15 target 需要约 186KB，
 * 远超 uniform 的 64KB 上限；也不能走顶点属性（十几个 target 会超出顶点 location 上限）。
 * 因此 delta 放 **storage buffer**（`array<vec4<f32>>`，按 `targetIndex * vertexCount + vertexIndex` 索引），
 * 只有权重与顶点数走 uniform。
 *
 * 权重数组用固定长度 `MORPH_TARGET_COUNT`（WGSL 的数组长度必须是编译期常量），
 * 数据侧按 target 数补齐、多出来的槽位权重为 0——与 `SKIN_MATRIX_COUNT` 的补齐口径一致。
 *
 * 构建结果懒加载并缓存（模块顶层不执行构建，见 AGENTS.md §15 R2）。
 */
import { array, float, forRange_, func, int, let_, return_, storageBuffer, struct, uint, uniform, var_, vec3, vec4 } from '@feng3d/tsl';

/** `func(...)` 的返回类型（TSL 未导出它的具名类型，这里用 ReturnType 取） */
type MorphFunc = ReturnType<typeof func>;

/** `storageBuffer(...)` 的返回类型（同样用 ReturnType 取，避免引用不可命名的 `Vec4`） */
type MorphPositions = ReturnType<typeof storageBuffer>;

/**
 * storage buffer 元素的静态类型。
 *
 * `StorageBuffer.index()` 的静态返回类型是 `ShaderValue`（`Vec4` 在 tsl 包内，跨包不可命名，
 * 见 TS2883 / TS2339），而运行期它就是 `vec4` —— 这里用 `ReturnType<typeof vec4>` 断言回来。
 */
type MorphDelta4 = ReturnType<typeof vec4>;

/**
 * WGSL 里 `u_morphWeights` 的固定槽位数。
 *
 * 取 16：本批四个模型的 target 数是 15 / 14 / 13 / 12，16 是覆盖它们的最小 2 的幂。
 * 数据侧会把权重补到这个长度（不足为 0）。
 */
export const MORPH_TARGET_COUNT = 16;

/** morph 的 `@group`（0–3 已被材质 / 相机 / 场景 / 蒙皮占用） */
const MORPH_GROUP = 4;

/** 懒构建缓存 */
let cachedMorph: { uniforms: string; morph: string } | null = null;

/**
 * 创建 MorphUniforms 的结构体定义（权重数组 + 顶点数）。
 *
 * 单列出来（而不是直接返回实例）是因为 morph 模块既需要 struct/uniform 声明本身，
 * 也需要在函数体里引用同一个实例。
 *
 * @param count 权重槽位数（WGSL 里必须是编译期常量）
 */
export function createMorphUniformStruct(count: number)
{
    return struct('MorphUniforms', {
        u_morphWeights: array(float, count),
        u_morphVertexCount: uint,
    });
}

/**
 * 创建 MorphUniforms 的 TSL 实例（`@group(4) @binding(0)`）。
 */
export function createMorphUniforms()
{
    return createMorphUniformStruct(MORPH_TARGET_COUNT)(uniform('morph', MORPH_GROUP, 0));
}

/**
 * 创建 morph delta 的 storage buffer（`@group(4) @binding(1)`）。
 */
export function createMorphPositions(): MorphPositions
{
    return storageBuffer('u_morphPositions', { elementType: vec4, group: MORPH_GROUP, binding: 1 });
}

/**
 * 创建 `morphPosition` 的 TSL 函数：把顶点位置按所有 morph target 的权重加权求和。
 *
 * @returns morphPosition 函数对象
 */
export function createMorphPositionFunc(): MorphFunc
{
    const morph = createMorphUniforms();
    const positions = createMorphPositions();

    return func(
        'morphPosition',
        [['position', vec4], ['vertexIndex', uint]],
        vec4,
        (position, vertexIndex) =>
        {
            const delta = var_('morphDelta', vec3(0.0, 0.0, 0.0));

            forRange_('i', 0, MORPH_TARGET_COUNT, (i) =>
            {
                const weight = let_('morphWeight', morph.u_morphWeights.index(i));
                // delta 按 target 分行存放：targetIndex * vertexCount + vertexIndex
                const offset = let_('morphOffset', uint(i).multiply(morph.u_morphVertexCount).add(vertexIndex));
                const target = let_('morphTarget', positions.index(int(offset))) as unknown as MorphDelta4;

                delta.assign(delta.add(vec3(target.x, target.y, target.z).multiply(weight)));
            });

            return_(position.add(vec4(delta, 0.0)));
        });
}

/**
 * 获取 MorphUniforms 的 WGSL 声明（struct + `@group(4) @binding(0)` uniform + storage buffer）。
 *
 * @returns WGSL 文本片段
 */
export function getMorphUniformsWGSL(): string
{
    if (cachedMorph === null)
    {
        cachedMorph = buildMorph();
    }

    return cachedMorph.uniforms;
}

/**
 * 获取 `morphPosition` 函数的 WGSL 定义。
 *
 * @returns WGSL 文本片段
 */
export function getMorphPositionWGSL(): string
{
    if (cachedMorph === null)
    {
        cachedMorph = buildMorph();
    }

    return cachedMorph.morph;
}

/**
 * 用 TSL 构建 morph 的 uniform 声明与函数定义。
 *
 * @returns uniform 与函数两段 WGSL
 */
function buildMorph(): { uniforms: string; morph: string }
{
    // 与 skeleton.ts 同一写法：struct/uniform 声明从**实例**的 `_structDef` 上取
    const morph = createMorphUniforms();
    const def = morph._structDef;
    const morphPosition = createMorphPositionFunc();

    const uniforms = `${def.toWGSLStruct()}\n\n${def.toWGSLUniform('morph', MORPH_GROUP, 0)}\n`
        + `\n@group(${MORPH_GROUP}) @binding(1) var<storage, read> u_morphPositions: array<vec4<f32>>;\n`;

    return { uniforms, morph: `${morphPosition.toWGSL()}\n` };
}
