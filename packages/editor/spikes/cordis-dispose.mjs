/**
 * #276 前置验证 spike（S1）：cordis 的**撤销语义**与 `inject` 等待。
 *
 * ## 为什么入库而不是放 tmp/
 *
 * 本仓 `tmp/` 在 `.gitignore` 里（`.gitignore:73`），放那里的脚本**别人复核不了**——
 * `docs/PLUGINS.md` 引用的 `tmp/cordis-spike/entry.mjs` 就是这种情况：文档写着"阶段性验证记录"，
 * 而文件在仓库里根本不存在。凡是文档要引用的证据，必须能被人自己跑一遍。
 *
 * ## 它回答什么
 *
 * issue #276 的验收①是「装/卸纯服务插件：**撤销后监听与定时器确实不再触发**」。
 * 这条不能靠"cordis 文档说可以"来算通过，得实跑：
 *
 * | 断言 | 对应问题 |
 * |---|---|
 * | `inject` 依赖未就绪时不启动等待者 | 插件启动顺序敏感时，靠 `undefined` 崩在中途？（对应 NODE_HOST.md §4 的 loader/inject） |
 * | 等待者启动时依赖已就绪 | 同上 |
 * | 活跃期定时器与事件监听在跑 | 对照组（证明"停"不是因为压根没启动） |
 * | `fiber.dispose()` 后定时器停止 | **验收①** 的定时器一半 |
 * | `fiber.dispose()` 后监听不再触发 | **验收①** 的监听一半 |
 *
 * ## 怎么跑
 *
 * 需要一个已安装的 `@deepseek-ai/cordis`（DSH 分叉稳定线，见本目录 README）：
 *
 * ```bash
 * # ① 用 DSH 自带的（默认按 DSH_HOME / 用户目录探测）
 * node packages/editor/spikes/cordis-dispose.mjs
 *
 * # ② 或显式指定入口
 * CORDIS_ENTRY=/path/to/@deepseek-ai/cordis/lib/index.js node packages/editor/spikes/cordis-dispose.mjs
 * ```
 *
 * 全部通过时退出码 0，任一项失败退出码 1（可直接进 CI 的 `editor` job）。
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';

/**
 * 探测 cordis 的 ESM 入口。
 *
 * 顺序：显式 `CORDIS_ENTRY` → `DSH_HOME` 下的 profile → 用户目录下的 `.dsh/profiles`。
 * 探测不到时**报清楚要什么**，而不是让 import 抛一句看不懂的解析错误。
 *
 * @returns cordis 入口的 file:// URL
 */
function resolveCordisEntry()
{
    const candidates = [];
    if (process.env.CORDIS_ENTRY) candidates.push(process.env.CORDIS_ENTRY);

    const dshHome = process.env.DSH_HOME ?? join(homedir(), '.dsh');
    candidates.push(join(dshHome, 'profiles', 'node_modules', '@deepseek-ai', 'cordis', 'lib', 'index.js'));

    for (const candidate of candidates)
    {
        if (existsSync(candidate)) return pathToFileURL(candidate).href;
    }

    console.error('未找到 cordis 入口。请显式指定：');
    console.error('  CORDIS_ENTRY=<...>/@deepseek-ai/cordis/lib/index.js node packages/editor/spikes/cordis-dispose.mjs');
    console.error(`已探测：${candidates.join('、')}`);
    process.exit(2);
}

const { Context, Service } = await import(resolveCordisEntry());

/** 计数器：撤销之后不该再涨 */
const ticks = { timer: 0, event: 0 };

/** 一个服务（宿主服务的最小形态） */
class Counter extends Service
{
    constructor(ctx)
    {
        super(ctx, 'counter');
    }
}

/** 一个"纯服务插件"：定时器 + 事件监听，都由 `ctx.effect` 持有 */
const ticker = Object.assign((ctx) =>
{
    ctx.effect(() =>
    {
        const timer = setInterval(() => { ticks.timer++; }, 5);
        const off = ctx.on('probe/ping', () => { ticks.event++; });

        // 撤销时 cordis 会调用这个 disposer
        return () =>
        {
            clearInterval(timer);
            off();
        };
    });
}, { inject: ['counter'] });

/** 诊断时间线（只给人看，不参与断言） */
const timeline = [];

/** 等待者的启动记录：`true` 表示启动时依赖已就绪 */
const lateStarts = [];

/** 依赖 `counter` 的插件：**先装它、后装 counter**，用来验证 inject 的等待 */
const late = Object.assign((ctx) =>
{
    lateStarts.push(ctx.counter !== undefined);
    timeline.push(`late 启动（counter 就绪=${ctx.counter !== undefined}）`);
}, { inject: ['counter'] });

const root = new Context();

// 反序装：late 先声明，Counter 后到
await root.plugin(late);
timeline.push(`装 late 之后已启动数=${lateStarts.length}（应为 0：依赖未就绪不启动）`);

await root.plugin(ticker);
timeline.push(`装 ticker 之后已启动数=${lateStarts.length}`);

await root.plugin(Counter);
timeline.push(`装 Counter 之后已启动数=${lateStarts.length}（应为 1：等待者到齐后启动）`);

const emit = () => { root.emit('probe/ping'); };

// 活跃期：定时器与监听都该动
await new Promise((resolve) => setTimeout(resolve, 40));
emit();
const aliveTimer = ticks.timer;
const aliveEvent = ticks.event;

// 撤销整棵树
await root.fiber.dispose();

const atDisposeTimer = ticks.timer;
const atDisposeEvent = ticks.event;

// 撤销之后继续等 + 继续发事件：两者都不该再涨
await new Promise((resolve) => setTimeout(resolve, 40));
emit();
const afterWaitTimer = ticks.timer;
const afterWaitEvent = ticks.event;

const checks = [
    ['inject：依赖未就绪时不启动等待者', lateStarts.length === 1],
    ['inject：等待者启动时依赖已就绪', lateStarts[0] === true],
    ['活跃期：定时器在跑', aliveTimer > 0],
    ['活跃期：事件监听在跑', aliveEvent > 0],
    ['撤销后：定时器停止', afterWaitTimer === atDisposeTimer],
    ['撤销后：监听已移除（再发事件不涨）', afterWaitEvent === atDisposeEvent],
];

console.log(`node ${process.version} / cordis 4.0.4`);
console.log('--- 时间线 ---');
for (const line of timeline) console.log(' ', line);
console.log(`ticks：活跃期 timer=${aliveTimer} event=${aliveEvent}；`
    + `撤销瞬间 timer=${atDisposeTimer} event=${atDisposeEvent}；`
    + `再等 40ms + 再发事件后 timer=${afterWaitTimer} event=${afterWaitEvent}`);
console.log('--- 断言 ---');
let failed = 0;
for (const [name, ok] of checks)
{
    if (!ok) failed++;
    console.log(` ${ok ? 'PASS' : 'FAIL'}  ${name}`);
}
console.log(failed === 0 ? '结论：全部通过' : `结论：${failed} 项未通过`);
process.exit(failed === 0 ? 0 : 1);
