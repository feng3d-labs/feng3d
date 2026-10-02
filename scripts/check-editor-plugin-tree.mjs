#!/usr/bin/env node
/**
 * 宿主侧**插件树**的验收（#272 P3）。
 *
 * ## 它守的是 #272 验收①的原话
 *
 * > 装/卸纯服务插件：**撤销后监听与定时器确实不再触发**
 *
 * 注意这句话的重点在**后半句**：装得上不算什么，**卸载要真的停下来**。所以这个脚本的判据
 * 一半是"卸干净了没有"：定时器不再增长、fiber dispose 之后插件全停、卸载不存在的插件不抛。
 *
 * 另外两条是这个服务存在的理由：
 *
 * - **插件能用宿主能力**（`inject: ['workspace']` → `ctx.workspace`）——否则插件是孤岛；
 * - **同一 id 不能重复装载**——重复装会让 `unload(id)` 变成猜谜（卸掉的是哪一个？）。
 *
 * 最后**装一次真样板包**（`@feng3d/editor-plugin-rotate` 的宿主半）：这条判据保证"样板"不只是
 * 文档里的形状，而是**真能被宿主装上卸下**。
 *
 * 用法：
 *   node scripts/check-editor-plugin-tree.mjs
 *
 * 退出码：0 全部通过；1 有失败。
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Context } from '@deepseek-ai/cordis';
import { PluginTree } from '../packages/editor/bin/host/pluginTree.mjs';
import { ProjectWorkspace } from '../packages/editor/bin/host/projectWorkspace.mjs';

/** 仓库根（脚本从根跑） */
const ROOT = process.cwd();

let total = 0;
let failed = 0;

/**
 * 记一条判据。
 *
 * @param {string} title 判据
 * @param {boolean} condition 是否通过
 * @param {string} detail 附加说明
 */
function check(title, condition, detail = '')
{
    total++;
    if (condition) console.log(`  PASS  ${title}${detail ? ` — ${detail}` : ''}`);
    else { failed++; console.log(`  FAIL  ${title}${detail ? ` — ${detail}` : ''}`); }
}

/**
 * 造一个"纯服务插件"：起定时器、听事件、顺便用一下宿主服务。
 *
 * 它的效果全记在 `record` 里——**这就是判据能观察到的"副作用"**：
 * 卸载之后这些数字必须停住。
 *
 * @param {object} record 记录副作用的容器
 * @returns {object} cordis 插件（`{ apply }` 形状）
 */
function makeTestPlugin(record)
{
    return {
        name: 'test-service-plugin',
        // 用宿主能力：cordis 会等 workspace 就绪才 apply
        inject: ['workspace'],
        apply(ctx, config)
        {
            record.pluginCtx = ctx;
            record.injected = typeof ctx.workspace?.isOpen === 'boolean';
            record.config = config;

            // 定时器（"卸载后不再触发"的主要观察对象）
            ctx.effect(() =>
            {
                const timer = setInterval(() => { record.ticks++; }, 10);

                return () => clearInterval(timer);
            });

            // 事件监听
            ctx.on('test/ping', () => { record.events++; });
        },
    };
}

/**
 * 等一会儿。
 *
 * @param {number} ms 毫秒
 * @returns {Promise<void>} 等待完成
 */
async function sleep(ms)
{
    await new Promise((resolve) => setTimeout(resolve, ms));
}

console.log('[宿主插件树] #272 P3：装得上、**卸得干净**、插件能用宿主能力');

// ---------- 准备：真 cordis Context + 真宿主服务 ----------
const projectDir = mkdtempSync(join(tmpdir(), 'feng3d-plugin-tree-'));
const ctx = new Context();

new ProjectWorkspace(ctx, { root: projectDir });

const tree = new PluginTree(ctx);

// ---------- 装载 ----------
const record = { ticks: 0, events: 0 };

tree.load('test-plugin', makeTestPlugin(record), { value: 42 });

check('装载后出现在列表里', tree.ids.includes('test-plugin') && tree.has('test-plugin'), JSON.stringify(tree.ids));

// `inject` 让插件等到依赖服务就绪才 apply，而 apply 是**异步**发生的——
// 所以这几条要等它真的跑起来再断言（"装载返回了"不等于"已经 apply 了"）
for (let i = 0; i < 50 && !record.pluginCtx; i++) await sleep(10);

check('插件拿到了宿主服务（`inject: [\'workspace\']` → `ctx.workspace`）', record.injected === true);
check('插件收到了配置', record.config?.value === 42);

await sleep(120);

const ticksWhileLoaded = record.ticks;

check('装载期间定时器**真的在跑**', ticksWhileLoaded > 3, `${ticksWhileLoaded} 次`);

// 事件：在插件自己的 ctx 上 emit（保证它一定收得到）
record.pluginCtx?.emit('test/ping');
record.pluginCtx?.emit('test/ping');

check('装载期间事件监听**真的在收**', record.events === 2, `${record.events} 次`);

// ---------- 重复装载 ----------
let duplicateError = null;

try
{
    tree.load('test-plugin', makeTestPlugin({ ticks: 0, events: 0 }));
}
catch (error)
{
    duplicateError = error.message;
}

check('同一 id 重复装载会报错（否则 unload 变成猜谜）', /已装载/.test(duplicateError ?? ''), duplicateError ?? '');

// ---------- 卸载（本脚本的重点） ----------
check('卸载返回 true', tree.unload('test-plugin') === true);
check('卸载后不在列表里', !tree.has('test-plugin'), JSON.stringify(tree.ids));

const ticksAtUnload = record.ticks;

await sleep(150);

check('**卸载后定时器确实不再触发**（#272 验收①的原话）', record.ticks === ticksAtUnload,
    `卸载时 ${ticksAtUnload}，150ms 后 ${record.ticks}`);

record.pluginCtx?.emit('test/ping');

check('卸载后事件监听也不再触发', record.events === 2, `${record.events} 次`);

check('卸载不存在的插件返回 false（不抛——"已经卸了"不是错误）', tree.unload('test-plugin') === false);

// ---------- 真样板包：能不能被宿主装上卸下 ----------
// 它是 TS，Node 不能直接 import —— 现打一次包（与 `check-runtime-artifact.mjs` 同一手法），
// 这样判据落在**真样板包**上，而不是"形状类似的假插件"
const esbuild = await import('esbuild');
const outfile = join(projectDir, 'rotate-host.mjs');

await esbuild.build({
    entryPoints: [join(ROOT, 'packages', 'editor-plugin-rotate', 'src', 'index.ts')],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    logLevel: 'silent',
});

const rotateHost = await import(pathToFileURL(outfile).href);

tree.load('@feng3d/editor-plugin-rotate', { name: 'rotate', apply: rotateHost.apply });

check('真样板包（`@feng3d/editor-plugin-rotate` 宿主半）能被装载',
    tree.has('@feng3d/editor-plugin-rotate') && typeof rotateHost.apply === 'function');

check('真样板包能被卸载', tree.unload('@feng3d/editor-plugin-rotate') === true
    && !tree.has('@feng3d/editor-plugin-rotate'));

// ---------- 父 fiber dispose：级联停止 ----------
const record2 = { ticks: 0, events: 0 };
const ctx2 = new Context();

new ProjectWorkspace(ctx2, { root: projectDir });

const tree2 = new PluginTree(ctx2);

tree2.load('second', makeTestPlugin(record2));

await sleep(80);

const beforeDispose = record2.ticks;

await ctx2.fiber.dispose();

await sleep(100);

check('**父 fiber dispose 之后插件全停**（级联：宿主停机不该留下跑着的定时器）',
    record2.ticks === beforeDispose, `dispose 时 ${beforeDispose}，100ms 后 ${record2.ticks}`);

// ---------- 收尾 ----------
await ctx.fiber.dispose();
rmSync(projectDir, { recursive: true, force: true });

console.log(`\n共 ${total} 项：通过 ${total - failed}，失败 ${failed}`);

if (failed > 0)
{
    console.error('\n❌ 宿主插件树未通过——"卸得干净"是它的全部意义，装得上不值钱。');
    process.exit(1);
}

console.log('✅ 宿主插件树通过：装得上、卸得干净、插件能用宿主能力、停机级联停止');
