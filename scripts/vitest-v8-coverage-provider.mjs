/**
 * 自定义 vitest coverage provider：修正 v8 provider 的覆盖率读数虚高（issue #667）。
 *
 * ## 为什么需要它
 *
 * vitest 的 v8 provider 把每个测试 worker 的 V8 precise coverage 交给
 * `@bcoe/v8-coverage` 的 `mergeScriptCovs` 合并。该函数用**函数根 range**
 * （`ranges[0]` 的 `startOffset;endOffset`）作为函数身份——它假设「根 range 相同 ⇒ 同一个函数」。
 * 这个假设在 V8 的 precise coverage 数据里**不成立**：
 *
 * - V8 对**未执行（未编译/已被 flush）的函数**只报 function-level coverage
 *   （`isBlockCoverage: false`），其根 range 常与**另一个函数**雷同——实测
 *   `packages/feng3d/src/geometry/PointGeometry.ts` 里 `<static_initializer>` 与
 *   `<instance_members_initializer>` 的根 range 同为 `[889, 4440]`；
 * - `mergeScriptCovs` 遇到「同一根 range 已有 block-level 条目 + 新条目是 function-level」时
 *   **直接丢弃**后者（上游认为它是同一函数的粗糙版本），于是 `count = 0` 的那个函数
 *   从合并结果里消失；
 * - `ast-v8-to-istanbul` 随后按「offset 落在哪个 range 内」决定 count，消失的函数
 *   落在**模块顶层的大 range**（count = 模块加载次数）里，被整份算成已执行。
 *
 * 触发条件是「同一模块出现在 ≥2 份 worker 覆盖率数据里」——真实项目必然如此，
 * 所以「只被间接 import、自身一行都没执行」的模块会被整份算成 100%（虚高）。
 * 单跑一个测试文件时 `mergeScriptCovs` 走单元素快路径、不触发合并，读数反而是对的——
 * 这正是 issue #645 一度误判「V8 原始数据准确」的原因。
 *
 * 最小复现（issue #667 实测）：两个都 `import '../packages/feng3d/src/index'` 的测试文件，
 * `PointGeometry.ts` 由真实的 `1.56%`（1/64）变成虚高的 `100%`；本 provider 修好后回到 `1.56%`。
 *
 * ## 修法
 *
 * 按 `functionName + 根 range` 分组（而不是只按根 range），再用 `mergeFunctionCovs`
 * 合并同组对象——不同函数不再被误判为同一个。
 *
 * ## 用法
 *
 * `vitest.config.ts` 里设 `coverage.provider: 'custom'` 与
 * `coverage.customProviderModule: './scripts/vitest-v8-coverage-provider.mjs'`。
 *
 * ## 维护约束
 *
 * 这里 override 了 vitest 的 `V8CoverageProvider.generateCoverage`（复制自
 * `@vitest/coverage-v8@5.0.2`），依赖其内部方法
 * （`readCoverageFiles` / `convertCoverage` / `getCoverageMapForUncoveredFiles` / `isIncluded`）。
 * **升级 vitest 后必须核对本文件与新版 provider 的实现是否仍一致**；
 * 若上游修好了 `mergeScriptCovs`（或换掉了合并实现），应删掉本文件、改回内置 v8 provider。
 */
import { existsSync } from 'node:fs';
import { mergeFunctionCovs, mergeScriptCovs } from '@bcoe/v8-coverage';
import { V8CoverageProvider } from '@vitest/coverage-v8/dist/provider.js';

const SEP = '\u0000';

/**
 * 修正版 `mergeScriptCovs`：按「函数名 + 根 range」而不是只按根 range 分组。
 *
 * @param scriptCovs 同一 url 的多份 script 覆盖
 * @returns 合并后的 script 覆盖
 */
function mergeScriptCovsFixed(scriptCovs)
{
    if (scriptCovs.length <= 1) return mergeScriptCovs(scriptCovs);

    // 先逐份 normalize（单元素快路径会 deepNormalizeScriptCov），保证 ranges 有序
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

    // 借 mergeScriptCovs 的单元素分支做整体 normalize
    return mergeScriptCovs([{ scriptId: first.scriptId, url: first.url, functions }]);
}

/** 与内置 v8 provider 等价、只把跨 worker 合并换成 {@link mergeScriptCovsFixed} 的 provider */
export class FixedV8CoverageProvider extends V8CoverageProvider
{
    async generateCoverage({ allTestsRun })
    {
        const coverageMap = this.createCoverageMap();
        const mergedScripts = new Map();
        const autoAttachSubprocess = this.options.autoAttachSubprocess;

        await this.readCoverageFiles({
            onFileRead(coverage)
            {
                for (const script of coverage.result)
                {
                    const previous = mergedScripts.get(script.url);
                    const merged = mergeScriptCovsFixed(previous ? [previous, script] : [script]);
                    const startOffset = previous?.startOffset || script.startOffset || 0;
                    const isExtendedContext = previous?.isExtendedContext || script.isExtendedContext;

                    merged.startOffset ||= startOffset;
                    if (autoAttachSubprocess && isExtendedContext) merged.isExtendedContext = true;
                    mergedScripts.set(merged.url, merged);
                }
            },
            onFinished: async (project, environment) =>
            {
                const converted = await this.convertCoverage({ result: Array.from(mergedScripts.values()) }, project, environment);

                coverageMap.merge(converted);
                mergedScripts.clear();
            },
            onDebug: Object.assign(() => {}, { enabled: false }),
        });

        if (this.options.include != null && (allTestsRun || !this.options.cleanOnRerun))
        {
            const coveredFiles = coverageMap.files();
            const untestedCoverage = await this.getCoverageMapForUncoveredFiles(coveredFiles);

            coverageMap.merge(untestedCoverage);
        }

        coverageMap.filter((filename) =>
        {
            const exists = existsSync(filename);

            if (this.options.excludeAfterRemap) return exists && this.isIncluded(filename);

            return exists;
        });

        return coverageMap;
    }
}

export default {
    async getProvider()
    {
        return new FixedV8CoverageProvider();
    },
};
