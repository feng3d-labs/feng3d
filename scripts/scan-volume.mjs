/**
 * 门禁脚本的「扫描量自证」（issue #652 · 做法 3）。
 *
 * ## 为什么需要它
 *
 * `scripts/check-*.mjs` 大多是「遍历文件 / 包 / 规则 → 收集命中 → 集合为空即通过」的结构。
 * 这种结构有一个天然的空转面：**一旦扫描根被改名、被移走，或判据在空集合上短路，
 * 脚本会静默全绿**——CI 验证的只是「当前代码符合判据」，证明不了「判据真的扫到了东西」。
 *
 * 本仓已有先例把这句话写进注释（`check-runtime-half-deps.mjs`：「门禁最怕永远绿」、
 * `gen-objectview-schema.mjs`：「空集合即失败」），本模块把它变成可复用的**硬断言**，
 * 并让 6 个 R 族门禁（R1 / R2 / R3）在扫到 0 个时 exit 1。
 *
 * ## 用法
 *
 * ```js
 * import { assertScanVolume } from './scan-volume.mjs';
 *
 * const files = collectTsFiles(join(ROOT, 'packages'));
 *
 * assertScanVolume({
 *     label: 'R2 模块级副作用扫描（packages/ 下全部 .ts）',
 *     count: files.length,
 *     min: 1,
 *     detail: `扫描根：${PKG_DIR}`,
 * });
 * ```
 *
 * `min` 默认 1——优先表达「应为正数」，**不写死脆弱的具体数字**（具体数字会随仓库变大而过期）。
 *
 * ## 什么时候**不要**接这里
 *
 * 若某个扫描**确实可能合法地扫到 0 个**，不要接 `assertScanVolume`，而应在该脚本的注释里
 * 写明理由并改判其它量（例如「扫描目录必须存在且非空」）。先例：
 * `check-runtime-half-deps.mjs` 的「目前仓库里还没有 runtime 端，扫到 0 个是正常状态」——
 * 它用 `targets.length === 0` 打印一句「门禁就位，等它出现」，而不是失败。
 *
 * ## 判据层单测
 *
 * `test/scanVolume.spec.ts` 直接 import 本模块的纯函数分支，并用子进程断言「扫到 0 个 → 退出码非 0」。
 */

/** 违约文案的统一前缀（测试与脚本输出都靠它识别） */
export const SCAN_VOLUME_FAILURE_PREFIX = '❌ 扫描量自证失败（issue #652）';

/**
 * 判定一次扫描的「扫描量」是否达标（纯函数，便于单测所有分支）。
 *
 * @param {{ label: string, count: number, min?: number, detail?: string }} spec
 *        `label` 描述扫的是什么；`count` 实测扫到的数量；`min` 期望下界（默认 1）；
 *        `detail` 补充说明（扫描根、扫描范围等），会原样打进失败文案。
 * @returns {{ ok: boolean, message: string }} 达标时 message 为空串，由脚本自己打印成功口径。
 */
export function describeScanVolume(spec)
{
    const label = spec?.label ?? '未命名扫描';
    const count = spec?.count;
    const min = spec?.min ?? 1;
    const detail = spec?.detail ?? '';

    // 读数本身非法（NaN / 非整数 / 负数）也要拦住——它同样是「判据坏了」的信号
    if (!Number.isInteger(count) || count < 0)
    {
        return {
            ok: false,
            message: [
                `${SCAN_VOLUME_FAILURE_PREFIX}：\`${label}\` 的扫描量读数非法（实测 ${String(count)}）。`,
                '   这说明统计口径被改坏了，不能据此判定「通过」。',
                detail ? `   ${detail}` : '',
            ].filter(Boolean).join('\n'),
        };
    }

    if (count >= min)
    {
        return { ok: true, message: '' };
    }

    return {
        ok: false,
        message: [
            `${SCAN_VOLUME_FAILURE_PREFIX}：\`${label}\` 只扫到 ${count} 个，预期至少 ${min} 个。`,
            '   判据会因此静默全绿——CI 只能证明「当前代码符合判据」，证明不了「判据真的扫到了东西」。',
            '   常见成因：扫描根被改名 / 移走、收集函数提前 return、判据在空集合上短路。',
            detail ? `   ${detail}` : '',
            '   若这个扫描**确实**可能合法地为 0，请在本脚本注释里写明理由并改判其它量，不要接 assertScanVolume。',
        ].filter(Boolean).join('\n'),
    };
}

/**
 * 扫描量不达标即 `process.exit(1)`；达标则原样返回 `count`（便于链式使用）。
 *
 * @param {{ label: string, count: number, min?: number, detail?: string }} spec 见 describeScanVolume
 * @returns {number} 实测扫描量
 */
export function assertScanVolume(spec)
{
    const { ok, message } = describeScanVolume(spec);

    if (!ok)
    {
        console.error(message);
        process.exit(1);
    }

    return spec.count;
}
