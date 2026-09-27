#!/usr/bin/env node
/**
 * 运行时自检：**反复卸载/重建场景视图不该出现引擎侧响应式风暴**（issue #177）。
 *
 * ## 为什么需要它
 *
 * 关掉「场景」面板插件会**卸载场景视图**（面板组件销毁 → 视图里的对象树被摘下来），
 * 再打开会重建它。反复几次曾在无 GPU 的 headless 环境里稳定复现两条**引擎侧**报错
 * （堆栈一帧都不在插件代码里）：
 *
 * ```
 * RangeError: Maximum call stack size exceeded
 *     at setParent (Container.ts) / EffectReactivity._func (Container.ts) / batchRun
 * TypeError: Cannot read properties of undefined (reading 'elements')
 *     at Matrix4x4.append / ComputedReactivity._func (Object3D.ts)
 * ```
 *
 * 单元测试（`packages/feng3d/src/core/SceneViewCycle.spec.ts`）能在 node 里固定住"摘挂子树不抛异常"，
 * 但**复现不了那条爆栈**——它要真的卸载/重建编辑器视图才会踩到。所以这条判据必须开真页面跑。
 *
 * ## 判据
 *
 * 1. 连续 3 轮"关掉场景面板 → 打开"，**不出现**引擎侧风暴（`Maximum call stack` /
 *    `reading 'elements'`）——pageerror 与控制台 error 都算；
 * 2. 没有别的页面级报错；
 * 3. 折腾完场景**没被弄坏**（对象数 / 可渲染对象数 / 三角面数与之前一致）。
 *
 * 用法：
 *   node scripts/editor-scene-view-cycle.mjs --open          # 自己开页面（CI 用这个）
 *   node scripts/editor-scene-view-cycle.mjs --target x      # 多页面时定向投递
 *
 * 退出码：0 全部通过；1 有断言失败。
 */
import { resolveBridgeBase } from './editor-bridge-base.mjs';
import { openBridgePage } from './editor-bridge-page.mjs';

const PREFIX = '/__editor-bridge';

/** 「场景」面板插件：关掉它会卸载场景视图，打开会重建（issue #180 后面板各自成插件） */
const SCENE = '@feng3d/editor-plugin-scene';

/** 本 issue 的两种报错特征（用特征而不是全文：堆栈里的行号会随代码变动） */
const STORM_PATTERN = /Maximum call stack|reading 'elements'/;

/** 从命令行读选项 */
function readOption(name, fallback = '')
{
    const i = process.argv.indexOf(name);

    return i >= 0 ? (process.argv[i + 1] ?? fallback) : fallback;
}

const openPage = process.argv.includes('--open');
const target = readOption('--target', openPage ? 'scene-view-cycle' : 'default');
const base = await resolveBridgeBase(readOption('--url') || undefined);

let total = 0;
let failed = 0;

/**
 * 跑一条断言。
 *
 * @param {string} title 判据描述
 * @param {boolean} condition 是否成立
 * @param {string} detail 补充信息
 */
function check(title, condition, detail = '')
{
    total++;
    if (condition) console.log(`  PASS  ${title}${detail ? ` — ${detail}` : ''}`);
    else { failed++; console.log(`  FAIL  ${title}${detail ? ` — ${detail}` : ''}`); }
}

const opened = openPage ? await openBridgePage(base, target) : null;
const page = opened?.page ?? null;

/** 控制台 error（headless 无 WebGPU 的设备报错由 STORM_PATTERN 排除，不影响判据） */
const consoleErrors = [];
page?.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

/**
 * 调桥接方法（带定向投递与结果轮询）。
 *
 * @param {string} method 方法名
 * @param {object} params 参数
 * @returns {Promise<unknown>} 结果
 */
async function call(method, params = {})
{
    const res = await fetch(`${base}${PREFIX}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(target ? { method, params, target } : { method, params }),
    });
    const { id } = await res.json();
    for (; ;)
    {
        const payload = await (await fetch(`${base}${PREFIX}/result?id=${encodeURIComponent(id)}`)).json();
        if (payload.pending) { await new Promise((r) => setTimeout(r, 120)); continue; }
        if (payload.ok === false) throw new Error(`${method}: ${payload.error}`);

        return payload.result;
    }
}

/** 场景规模（判"折腾完没被弄坏"用） */
async function sceneScale()
{
    const stats = (await call('scene.validate', { issues: 1 })).stats;

    return `objects=${stats.objects} renderers=${stats.renderers} triangles=${stats.triangles}`;
}

console.log(`[场景视图卸载/重建] ${base}（target=${target ?? '默认'}）`);

try
{
    const before = await sceneScale();

    // ---- 三轮卸载 / 重建（现场是 3 轮就能复现） ------------------------------
    for (let round = 1; round <= 3; round++)
    {
        await call('editor.setPlugin', { id: SCENE, enabled: false });
        await new Promise((r) => setTimeout(r, 400));
        await call('editor.setPlugin', { id: SCENE, enabled: true });
        await new Promise((r) => setTimeout(r, 600));
        console.log(`  第 ${round} 轮：卸载 → 重建完成`);
    }

    // 让响应式批次与渲染回调都跑完，再看报错
    await new Promise((r) => setTimeout(r, 1500));

    const pageErrors = opened?.pageErrors ?? [];
    const storm = [...pageErrors, ...consoleErrors].filter((message) => STORM_PATTERN.test(String(message)));

    check('反复卸载/重建场景视图不出现响应式风暴（爆栈 / undefined.elements）',
        storm.length === 0,
        storm.length > 0 ? String(storm[0]).split('\n').slice(0, 3).join(' | ') : '0 条');

    check('没有页面级报错', pageErrors.length === 0,
        pageErrors.slice(0, 2).map((m) => String(m).split('\n')[0]).join(' | '));

    const after = await sceneScale();
    check('折腾完场景没被弄坏（规模与之前一致）', after === before, `${before} → ${after}`);
}
finally
{
    // 自己开的浏览器必须关掉，否则进程不退出（CI 上表现为"卡住不结束"）
    await opened?.close();
}

console.log(`\n共 ${total} 项：通过 ${total - failed}，失败 ${failed}`);
process.exit(failed === 0 ? 0 : 1);
