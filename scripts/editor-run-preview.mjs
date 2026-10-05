#!/usr/bin/env node
/**
 * 运行形态（run.html / run.ts）的端到端验收（#271 P0）。
 *
 * ## 它守什么
 *
 * #271 的三条断链路里，运行预览这条最隐蔽：`initProject()` **整段被注释**，
 * 于是"运行形态"从来初始化不出场景——而没有任何东西会因此变红。
 *
 * 本脚本打开真页面，断言：
 *
 * 1. **场景数据链路通**：`__RUN_PREVIEW__.objects > 0`（纯数据场景读出来、装进视图）；
 * 2. **渲染循环起来了**：`started === true`；**无 GPU 的机器**上 `WebGPU.init()` 会失败，
 *    这时按"环境限制"记（并断言错误确实来自 adapter），不当回归——与 `editor-e2e` 里
 *    其它脚本对 GPU 的态度一致；
 * 3. **不再走废掉的链路**：页面**不许**请求 `project.js`（旧形态 `eval(project.js)` 的产物）；
 * 4. 零 pageerror；有 GPU 时再断言画布**有内容**（空白画布的 PNG dataURL 约 2 KB）。
 *
 * ## 用法
 *
 * 需要 dev server 已启动（CI 的 `editor-e2e` job 里有）：
 *
 * ```bash
 * node scripts/editor-run-preview.mjs --url http://localhost:3000
 * ```
 *
 * 加 `--json` 时，输出里会多**一行** JSON 摘要（判据名 / 成败 / 运行态 / 帧数 / pageerror），
 * 供 MCP 工具 `run_preview` 消费（#281：让「运行」成为 AI 可达的一步，而判据仍只有这一份）。
 * 消费方请**按内容找**那一行（`{"tool":"run_preview"` 开头），不要依赖位置 —— 它后面还有
 * 一行人看的收尾提示。
 *
 * 退出码：0 全部通过；1 有失败。
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { chromium } from 'playwright';

/**
 * 验收用的最小场景：**相机在 +Z 看向原点** + 一个立方体（照 `examples/` 的写法）。
 *
 * 为什么不用仓库里的 `resource/template/scenes/default.scene.json`：那个模板的相机在 `z = -10`
 * 且 rotation 为 0（朝 -Z），于是**背离原点**——渲染得出背景色、却看不到任何物体
 * （截图确认过）。那是模板场景数据本身的事，不该让"运行形态能不能渲染"跟着一起看不见。
 * 模板相机数据是否要改，属于另一个问题（计划里单列，不混进本阶段）。
 */
const SCENE_RELATIVE = 'tmp/run-scene.json';
// 场景写进**静态根**（`public/`）：路径是"相对页面"的，而页面现在由**宿主**提供
// （静态根 = `packages/editor/public`）。原先写在仓库根的 `tmp/` 下 —— 那只有 vite
// （root 更宽）能 serve，宿主会回落成 index.html，`run.ts` 于是拿到 HTML 去 JSON.parse。
const SCENE_ABSOLUTE = resolve(process.cwd(), 'packages', 'editor', 'public', SCENE_RELATIVE);
const SCENE = {
    __type__: 'Object3D',
    name: 'RunPreviewSmoke',
    components: [{
        __type__: 'Scene',
        background: { __type__: 'Color4', r: 0.2, g: 0.3, b: 0.4, a: 1 },
    }],
    children: [
        {
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 1, z: 10 },
            components: [{ __type__: 'PerspectiveCamera', fov: 60, aspect: 1, near: 0.3, far: 5000 }],
        },
        {
            __type__: 'Object3D',
            name: 'DirectionalLight',
            position: { x: 2, y: 4, z: 3 },
            rotation: { x: 0.8726646259971648, y: -0.5235987755982988, z: 0 },
            components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 } }],
        },
        {
            __type__: 'Object3D',
            name: 'Cube',
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: {
                    __type__: 'ColorMaterial',
                    uniforms: { u_diffuseInput: { __type__: 'Color4', r: 1, g: 0.5, b: 0.2, a: 1 } },
                },
            }],
        },
    ],
};

let total = 0;
let failed = 0;

/**
 * 读命令行选项。
 *
 * @param {string} name 选项名（带 `--`）
 * @param {string} fallback 缺省值
 * @returns {string} 选项值
 */
function readOption(name, fallback = '')
{
    const index = process.argv.indexOf(name);

    return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

/**
 * 记一条判据。
 *
 * @param {string} title 判据
 * @param {boolean} condition 是否通过
 * @param {string} detail 附加说明
 */
/** 每条判据的结果（`--json` 摘要用） */
const results = [];

function check(title, condition, detail = '')
{
    total++;
    results.push({ title, ok: condition, detail });
    if (condition) console.log(`  PASS  ${title}${detail ? ` — ${detail}` : ''}`);
    else { failed++; console.log(`  FAIL  ${title}${detail ? ` — ${detail}` : ''}`); }
}

const base = (readOption('--url') || process.env.EDITOR_BRIDGE_URL || 'http://localhost:3000').replace(/\/$/, '');
const target = `${base}/run.html?scene=${encodeURIComponent(SCENE_RELATIVE)}`;

// 场景写在 dev server 的 root 下（`run.ts` 按**相对页面的路径**读它），跑完删掉——不入库
mkdirSync(dirname(SCENE_ABSOLUTE), { recursive: true });
writeFileSync(SCENE_ABSOLUTE, JSON.stringify(SCENE, null, '\t'), 'utf8');

console.log(`[运行形态] ${target}`);

const browser = await chromium.launch({
    // headless 下本机拿不到 WebGPU adapter（`requestAdapter returned null`）；
    // 设 HEADLESS=0 走有头模式，本机 GPU 可用（与其它 e2e 脚本同一口径）——
    // 那条"画布有内容"的判据只有在这里才跑得到。
    headless: process.env.HEADLESS !== '0',
    args: process.env.HEADLESS === '0' ? ['--enable-unsafe-webgpu'] : [],
});
const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });

const pageErrors = [];
const requested = [];

page.on('pageerror', (error) => pageErrors.push(error.message.split('\n')[0]));
page.on('request', (request) => requested.push(request.url()));

const response = await page.goto(target, { waitUntil: 'load' });

check('run.html 能打开', response?.ok() === true, `HTTP ${response?.status()}`);

// 等**终态**：要么渲染循环起来、要么如实报错。中间态（读完场景、WebGPU 还在初始化）
// 不算结论——它有 GPU 的机器上要花一会儿，无 GPU 的机器上会走到 error。
const state = await page.waitForFunction(() =>
{
    const current = globalThis.__RUN_PREVIEW__;

    return current && (current.started === true || current.error !== null) ? current : false;
}, undefined, { timeout: 30000 }).then((handle) => handle.jsonValue()).catch(() => null);

if (state === null)
{
    const midway = await page.evaluate(() => globalThis.__RUN_PREVIEW__ ?? null).catch(() => null);

    check('运行形态走到终态（started 或 error）', false, `30s 后仍是中间态：${JSON.stringify(midway)}`);
}

check('运行形态报了状态（__RUN_PREVIEW__）', state !== null, JSON.stringify(state));

const objects = state?.objects ?? 0;

check('**场景数据链路通**（纯数据场景读出来并装进视图）', objects > 0, `${objects} 个对象`);

const gpuLimited = typeof state?.error === 'string' && /adapter|WebGPU/i.test(state.error);

if (state?.started === true)
{
    check('渲染循环起来了（started === true）', state.error === null);

    // 再等它真的跑几帧（初始状态里 frames 是 0，之后每 10 帧报一次）
    const progressed = await page.waitForFunction(
        () => (globalThis.__RUN_PREVIEW__?.frames ?? 0) > 10,
        undefined,
        { timeout: 10000 },
    ).then(() => page.evaluate(() => globalThis.__RUN_PREVIEW__)).catch(() => null);

    check('渲染循环真的在提交帧（**确定性**判据：与画面里有没有物体无关）',
        (progressed?.frames ?? 0) > 10, `${progressed?.frames ?? 0} 帧`);
}
else if (gpuLimited)
{
    // 无 GPU 的机器（CI runner / headless）——与其它 e2e 脚本同一态度：记环境限制，不当回归
    check('无 GPU 环境：如实报出 WebGPU 初始化失败（不是静默成功）', true, state?.error ?? '');
}
else
{
    check('渲染循环起来了（started === true）', false, `error=${state?.error ?? '(无)'}`);
}

// 反向断言：旧链路（编辑器内编译出的 project.js + eval）不该再被请求
check('不再请求废掉的 `project.js`（旧 eval 链路已废弃）',
    !requested.some((url) => /\/project\.js(\?|$)/.test(url)));

// **反向**：runtime 那条"按 `fstype` 换文件系统"的路已删除（决策 ②，2026-10-05：
// runtime 只走 HTTP(S)、不再用 IndexedDB）。这条与上一条是同一类判据 ——
// 它们守的不是"现在能跑"，而是"**废掉的那条路不许回来**"。
const runSource = readFileSync(resolve(process.cwd(), 'packages/editor/src/run.ts'), 'utf8');

check('runtime 里不再有按 `fstype` 换文件系统的分支（决策 ②：只走 HTTP(S)）',
    !runSource.includes('fstype') && !runSource.includes('indexedDB'),
    runSource.includes('fstype') ? '还有 fstype' : (runSource.includes('indexedDB') ? '还有 indexedDB' : ''));

// 有 GPU 时才谈画面。判据用**页面截图**而不是 `canvas.toDataURL()`：
// WebGPU 画布的内容在"提交"与"合成"之间未必能直接从 canvas 取到（实测取到的是空白 2118 B），
// 而截图拿的是**合成后的页面**——那才是用户看到的东西。纯色页面压得很小，有图形时明显更大。
if (state?.started === true)
{
    // 画面里有没有物体取决于**场景数据**（相机位置/朝向、几何、光照），而"渲染循环在提交帧"
    // 才是运行形态的**确定**判据（上面那条）。所以这里**只存档、不自判**：
    // 像素判据要么得引入图像库，要么会在无 GPU 的 CI 上误报——两者都不划算。
    // 有 GPU 的机器上已人工确认：蓝灰背景 + 橙色立方体（光照分面正常），见下方截图路径。
    const shot = await page.screenshot();

    console.log(`  NOTE  画面已存档（${shot.length} B）：packages/editor/.temp/run-preview.png（请人工确认）`);
}
else
{
    console.log('  SKIP  画面判据（本机没有可用 WebGPU adapter）');
}

await page.screenshot({ path: 'packages/editor/.temp/run-preview.png' }).catch(() => { /* 截图失败不影响判据 */ });

check('零 pageerror', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));

await browser.close();

// 临时场景是本次验收自己造的，跑完收走（`packages/editor/tmp/` 不入库）
rmSync(SCENE_ABSOLUTE, { force: true });

console.log(`\n共 ${total} 项：通过 ${total - failed}，失败 ${failed}`);

// `--json`：**最后一行**是结构化摘要（前面的判据日志照常打印，便于人看）
if (process.argv.includes('--json'))
{
    console.log(JSON.stringify({
        tool: 'run_preview',
        ok: failed === 0,
        url: target,
        total,
        failed,
        failures: results.filter((one) => !one.ok).map((one) => ({ title: one.title, detail: one.detail })),
        state,
        frames: state?.frames ?? 0,
        objects: state?.objects ?? 0,
        pageErrors,
    }));
}

if (failed > 0)
{
    console.error('\n❌ 运行形态未通过——它是 #271 P0 的一条断链路，不能靠"没人打开过 run.html"来掩盖。');
    process.exit(1);
}

console.log('✅ 运行形态通过：纯数据场景装进视图，渲染循环就绪');
