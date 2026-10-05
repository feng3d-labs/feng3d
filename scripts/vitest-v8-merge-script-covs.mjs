import { mergeFunctionCovs, mergeScriptCovs } from '@bcoe/v8-coverage';

/**
 * `@bcoe/v8-coverage` 的 `mergeScriptCovs` 修正版（issue #667）。
 *
 * ## 修的是什么
 *
 * vitest 的 v8 provider 用 `mergeScriptCovs` 合并**同一个模块在多个测试 worker 里**各自的
 * V8 precise coverage。上游按「函数根 range」（`ranges[0]` 的 `startOffset;endOffset`）当函数身份，
 * 假设「根 range 相同 ⇒ 同一个函数」——这个假设在 V8 数据里不成立：
 *
 * - V8 对**未执行（未编译 / 已被 flush）**的函数只报 function-level coverage（`isBlockCoverage: false`），
 *   其根 range 常与**另一个函数**雷同。实测 `packages/feng3d/src/geometry/PointGeometry.ts` 里
 *   `<static_initializer>` 与 `<instance_members_initializer>` 的根 range 同为 `[889, 4440]`，
 *   count 分别是 1 与 0；
 * - 上游遇到「同根 range 已有 block-level 条目 + 新条目是 function-level」时**直接丢弃**后者
 *   （它以为那是同一函数的粗糙版本），于是 `count = 0` 的函数从合并结果里消失；
 * - `ast-v8-to-istanbul` 按「offset 落在哪个 range 内」决定 count，消失的函数落在**模块顶层的大 range**
 *   （count = 模块加载次数）里，被整份算成已执行。
 *
 * 结果是「只被间接 `import`、自身一行都没执行」的模块被整份算成 100%（读数虚高），而且
 * **只在 ≥2 份 worker 数据合并时触发**——单跑一个测试文件时上游走单元素快路径，读数反而是对的
 * （这正是 issue #645 一度误判「V8 原始数据准确」的原因）。
 *
 * ## 修法
 *
 * 按 `functionName + 根 range` 分组（而不是只按根 range），再用上游的 `mergeFunctionCovs`
 * 合并同组对象——不同函数不再被误判为同一个。与上游的另一点差异：本实现不比较 `isBlockCoverage`。
 *
 * ## 回归保护
 *
 * `test/coverageProviderMerge.spec.ts` 用「同根 range、不同函数名、count 一真一假」的合成样例守住
 * 本行为；把实现改回上游 `mergeScriptCovs` 会让该用例失败。
 *
 * ## 何时删掉本文件
 *
 * 上游 `@bcoe/v8-coverage` 修好 `mergeScriptCovs`（或换掉合并实现）后，删除本文件与
 * `scripts/vitest-v8-coverage-provider.mjs`、改回内置 v8 provider，并删掉回归用例里那条
 * 「上游会丢条目」的对照断言。
 */

/** 分组 key 的分隔符（函数名里不会出现的 NUL） */
export const SEP = '\u0000';

/**
 * 修正版 `mergeScriptCovs`：按「函数名 + 根 range」而不是只按根 range 分组。
 *
 * @param scriptCovs 同一 url 的多份 script 覆盖（会被就地 normalize，与上游契约一致）
 * @returns 合并后的 script 覆盖
 */
export function mergeScriptCovsFixed(scriptCovs)
{
    if (scriptCovs.length <= 1) return mergeScriptCovs(scriptCovs);

    // 先逐份 normalize（上游的单元素分支会 deepNormalizeScriptCov），保证 ranges 有序
    const normalized = scriptCovs.map((scriptCov) => mergeScriptCovs([scriptCov]));
    const buckets = new Map();

    for (const scriptCov of normalized)
    {
        for (const funcCov of scriptCov.functions)
        {
            const root = funcCov.ranges[0];
            const key = `${funcCov.functionName}${SEP}${root.startOffset}${SEP}${root.endOffset}`;
            const bucket = buckets.get(key);

            if (bucket === undefined) buckets.set(key, [funcCov]);
            else bucket.push(funcCov);
        }
    }

    const functions = [];

    for (const bucket of buckets.values()) functions.push(mergeFunctionCovs(bucket));

    const first = normalized[0];

    // 借上游的单元素分支做整体 normalize
    return mergeScriptCovs([{ scriptId: first.scriptId, url: first.url, functions }]);
}
