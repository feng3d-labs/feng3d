#!/usr/bin/env node
/**
 * AI 桥接端到端验收：**从零搭一个可用场景**，并用客观判据验收（issue #150）。
 *
 * 与其它桥接自检的差别：
 * - `editor-bridge-smoke.mjs` 逐方法检查「这个调用有没有坏」——是组件测试；
 * - `editor-bridge-scenario.mjs` 检查「一组方法能否配合搭出一张桌子」；
 * - 本脚本检查**「交付是否成立」**：搭出来的场景在数据层是否自洽、能否无损往返。
 *   判据刻意不只「没报错」，而是：
 *     1. `scene.validate` 无 error（结构性问题）
 *     2. `scene.export` → `scene.import` **往返等价**（`$ref` / Prefab / 几何材质参数不丢）
 *     3. 场景规模与内容符合预期（对象数、组件类型分布、包围盒尺寸合理）
 *
 * 为什么强调往返等价：仓库定位里「保存 → 加载 → 渲染等价」是**架构保证**，
 * 值得有一条端到端用例守着。桥接的 export/import 正是这条保证的对外接口。
 *
 * 用法：
 *   node scripts/editor-e2e-scene.mjs                 # 需要编辑器 dev server + 已打开页面
 *   node scripts/editor-e2e-scene.mjs --open          # 自己用 Playwright 开一个页面（CI 用这个）
 *   node scripts/editor-e2e-scene.mjs --client mypage # 多页面时定向投递
 *   node scripts/editor-e2e-scene.mjs --keep          # 保留搭建的对象（默认清理）
 *
 * 前置：
 *   1. packages/editor 下 `npm run dev`
 *   2. 浏览器打开 `http://localhost:<port>/?bridgeClient=<client>`（或加 `--open` 让脚本代劳）
 *   注意**无 GPU 的 headless 环境也能跑**——本脚本只用数据层方法；
 *   `view.probe`（像素判据）需要 WebGPU，无 GPU 时会被跳过而不是判失败。
 *
 * 退出码：0 全部通过；1 有断言失败。
 */
import { resolveBridgeBase } from './editor-bridge-base.mjs';

const PREFIX = '/__editor-bridge';

/** 从命令行读选项 */
function readOption(name, fallback = '')
{
    const i = process.argv.indexOf(name);

    return i >= 0 ? (process.argv[i + 1] ?? fallback) : fallback;
}

const openPage = process.argv.includes('--open');
const client = readOption('--client', openPage ? 'e2e-scene' : 'default');
const keep = process.argv.includes('--keep');
const base = await resolveBridgeBase();

/**
 * `--open` 时自己开的浏览器；用于收尾时关闭。
 *
 * 为什么要这个选项：CI 上没人替你手动开页面，而桥接是"页面轮询"模型——
 * 没有页面在轮询，所有调用都会超时。让脚本自己开页，验收才能进 CI。
 */
let browser = null;

/**
 * 统一出口：先关浏览器再退出。
 *
 * `process.exit` 不会等浏览器进程收尾，直接退出会把 chromium 留成孤儿进程
 * （CI 上表现为 job 结束后残留进程）。所有退出都必须走这里。
 *
 * @param {number} code 进程退出码
 */
async function finish(code)
{
    if (browser) await browser.close().catch(() => { /* 关不掉也要退出 */ });
    process.exit(code);
}

if (openPage)
{
    const { chromium } = await import('playwright').catch(() =>
    {
        throw new Error('--open 需要 playwright：npx playwright install chromium（并确认 playwright 已在依赖里）');
    });

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));
    await page.goto(`${base}/?bridgeClient=${client}`, { waitUntil: 'load' });

    // 等页面真正注册到桥接（编辑器初始化完成才会开始轮询），而不是死等固定秒数
    const deadline = Date.now() + 60000;
    let registered = false;
    while (Date.now() < deadline)
    {
        const ping = await fetch(`${base}${PREFIX}/ping`).then((r) => r.json()).catch(() => null);
        if (ping?.clients?.some((c) => c.clientId === client)) { registered = true; break; }
        await new Promise((r) => setTimeout(r, 500));
    }
    if (!registered) throw new Error(`页面已在 ${base} 打开，但 60s 内没有注册到桥接（clientId=${client}）`);

    console.log(`已打开页面 ${base}/?bridgeClient=${client}（pageerror=${pageErrors.length}）`);
}

let total = 0;
const failures = [];

/**
 * 调桥接方法（带定向投递与结果轮询）。
 *
 * @param {string} method 方法名
 * @param {object} params 参数
 * @param {number} timeoutMs 超时
 * @returns {Promise<unknown>} 结果
 */
async function call(method, params = {}, timeoutMs = 30000)
{
    const res = await fetch(`${base}${PREFIX}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, params, target: client }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const { id } = await res.json();
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline)
    {
        const rr = await fetch(`${base}${PREFIX}/result?id=${encodeURIComponent(id)}`);
        const payload = await rr.json();
        if (payload.pending)
        {
            await new Promise((r) => setTimeout(r, 200));
            continue;
        }
        if (payload.ok === false)
        {
            // 堆栈是定位引擎内部报错的关键（"reading 'elements'" 这类消息本身指不到源头）
            const detail = payload.stack ? `\n${payload.stack}` : '';
            throw new Error(`${payload.error}${detail}`);
        }

        return payload.result;
    }

    throw new Error(`TIMEOUT: ${method} 未在 ${timeoutMs}ms 内回传（页面是否已打开？target=${client}）`);
}

/**
 * 跑一条检查，失败不中断（收集后统一报告）。
 *
 * @param {string} title 检查名
 * @param {() => Promise<void>} run 检查体
 */
async function check(title, run)
{
    total++;
    try
    {
        await run();
        console.log(`  ✅ ${title}`);
    }
    catch (error)
    {
        failures.push(`${title}: ${error.message}`);
        console.log(`  ❌ ${title} — ${error.message}`);
    }
}

/** 断言 */
function assert(condition, message)
{
    if (!condition) throw new Error(message);
}

/** 从 scene.list 收集所有节点 id */
function collectIds(node, out = [])
{
    out.push(node.id);
    for (const child of node.children ?? []) collectIds(child, out);

    return out;
}

/**
 * 数出序列化数据里的 Object3D 节点数。
 *
 * 导出的是**整棵子树**，导入到场景根下会新增一棵同样规模的子树——所以对象数的增长量应当等于
 * 子树的节点数，而不是"导入了几份数据"（一个场景根就是一棵几百节点的树）。
 */
function countObject3DNodes(value, seen = new Set())
{
    if (Array.isArray(value)) return value.reduce((sum, item) => sum + countObject3DNodes(item, seen), 0);
    if (value === null || typeof value !== 'object') return 0;
    if (seen.has(value)) return 0;   // 序列化数据里可能有 $ref 回指，防环
    seen.add(value);

    let count = value.__type__ === 'Object3D' ? 1 : 0;
    for (const item of Object.values(value)) count += countObject3DNodes(item, seen);

    return count;
}

/**
 * 规范化 JSON：键排序后比较。
 *
 * 往返比较不能直接用 `JSON.stringify`——`deserialize` 后重新 `serialize` 的键顺序可能与原导出
 * 不同（键序不承载语义），那样会把"等价"误报成"不等价"。
 */
function canonicalJson(value)
{
    if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
    if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';

    const body = Object.keys(value).sort()
        .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
        .join(',');

    return `{${body}}`;
}

/** 找出两段 JSON 文本第一处差异的位置，便于定位（整段打出来太长） */
function firstDifference(a, b)
{
    const limit = Math.min(a.length, b.length);
    for (let i = 0; i < limit; i++)
    {
        if (a[i] !== b[i]) return `第 ${i} 字符处：原「${a.slice(i, i + 60)}」/ 新「${b.slice(i, i + 60)}」`;
    }

    return a.length === b.length ? '内容相同' : `长度不同（${a.length} vs ${b.length}），较长一方多出「${(a.length > b.length ? a : b).slice(limit, limit + 60)}」`;
}

console.log(`桥接地址：${base}（target=${client}）\n`);

// ---------------------------------------------------------------------------
// 1. 从零搭建场景
// ---------------------------------------------------------------------------
console.log('从零搭建场景：');

/** 本轮创建的对象 id，用于最后清理 */
const created = [];

await check('新增地面与三个物体（含位置/颜色/几何参数）', async () =>
{
    // 地面用精细控制（geometryParams 显式给分段），其余用 shape 简写
    const plane = await call('scene.add', {
        name: 'E2E_Ground',
        shape: 'plane',
        geometryParams: { width: 10, height: 10 },
        color: { r: 0.2, g: 0.25, b: 0.3 },
        position: { x: 0, y: 0, z: 0 },
        tag: 'e2e-scene',
    });
    // scene.add 的返回是 { id, parentId, name }——没有 objectId 字段（踩过一次：拿 undefined 去建组）
    created.push(plane.id);

    for (const [name, x] of [['E2E_CubeA', -1.5], ['E2E_CubeB', 0], ['E2E_Sphere', 1.5]])
    {
        const r = await call('scene.add', {
            name,
            shape: name.includes('Sphere') ? 'sphere' : 'cube',
            geometryParams: name.includes('Sphere') ? { radius: 0.5 } : { width: 1, height: 1, depth: 1 },
            color: name.includes('Sphere') ? { r: 0.9, g: 0.3, b: 0.2 } : { r: 0.3, g: 0.6, b: 0.9 },
            glossiness: 40,
            position: { x, y: 0.5, z: 0 },
            tag: 'e2e-scene',
        });
        assert(typeof r.id === 'string' && r.id.startsWith('/'), `scene.add 应返回路径式 id，实际 ${JSON.stringify(r)}`);
        created.push(r.id);
    }

    assert(created.length === 4, `应创建 4 个对象，实际 ${created.length}`);
});

let groupId = '';
await check('把三个物体归到一个组下（一次撤销步）', async () =>
{
    const r = await call('scene.group', {
        objectIds: created.slice(1),
        name: 'E2E_Group',
    });
    // 返回 { groupId, name, parentId, members }
    groupId = r.groupId;
    assert(typeof groupId === 'string' && groupId.startsWith('/'), `scene.group 应返回 groupId，实际 ${JSON.stringify(r)}`);
    assert(r.members?.length === 3, `组应含 3 个成员，实际 ${r.members?.length}`);
    created.push(groupId);
});

// ---------------------------------------------------------------------------
// 2. 判据一：结构自洽
// ---------------------------------------------------------------------------
console.log('\n判据一：场景结构自洽（scene.validate）：');

await check('体检无 error', async () =>
{
    const v = await call('scene.validate', {});
    assert(v.ok === true, `validate 未通过：${JSON.stringify(v.issues ?? []).slice(0, 300)}`);
});

await check('对象数与组件分布符合预期', async () =>
{
    const summary = await call('scene.summary', {});
    assert(summary.objectCount >= 5, `对象数应 ≥5（默认场景 + 本轮新增），实际 ${summary.objectCount}`);
    assert(summary.componentTypes?.MeshRenderer >= 4, `MeshRenderer 应 ≥4，实际 ${summary.componentTypes?.MeshRenderer}`);
});

await check('三个物体落在同一组内', async () =>
{
    const list = await call('scene.list', { depth: 3 });
    const ids = collectIds(list.node);
    assert(ids.includes(groupId), `层级树中应能找到组 ${groupId}`);
});

// ---------------------------------------------------------------------------
// 3. 判据二：导出/导入往返等价（本轮验收的核心）
// ---------------------------------------------------------------------------
console.log('\n判据二：导出/导入往返等价：');

let exported;
await check('导出本轮搭的那棵子树（组 + 三个物体）', async () =>
{
    const r = await call('scene.export', { objectId: groupId });
    assert(r && typeof r === 'object', 'export 应返回对象');
    // 返回 { objectCount, pretty, note?, data }——data 才是对象字面量
    assert(r.data !== undefined, `export 应含 data 字段，实际键为 ${Object.keys(r ?? {}).join('/')}`);
    assert(r.data.__type__ === 'Object3D', `导出的子树根应是 Object3D，实际 ${r.data.__type__}`);
    assert(countObject3DNodes(r.data) === 4, `子树应含 4 个 Object3D 节点（组 + 3 个物体），实际 ${countObject3DNodes(r.data)}`);
    exported = r;
});

await check('整场景导出会被导入明确拒绝（而不是把场景改坏）', async () =>
{
    // `scene.export` 不带 objectIds 时导出的是场景根——它带 Scene 组件。
    // 把它导回场景等于要第二个场景，引擎做不到；关键是不能"报个看不懂的错 + 留下脏对象"
    const whole = await call('scene.export', {});
    const before = await call('scene.list', { depth: 3 });

    let rejected = '';
    try
    {
        await call('scene.import', { data: whole.data });
    }
    catch (error)
    {
        rejected = error.message;
    }
    assert(/Scene 组件/.test(rejected), `应给出"带 Scene 组件、请导出子树"的说明，实际：${rejected || '(没有报错)'}`);

    // 被拒绝的导入不能改动场景：层级树逐节点比对（比只比对象数更能查出"换了对象"）
    const after = await call('scene.list', { depth: 3 });
    assert(
        canonicalJson(after) === canonicalJson(before),
        `导入被拒后层级树应完全不变——失败路径给场景留下了脏对象\n  前：${canonicalJson(before).slice(0, 200)}\n  后：${canonicalJson(after).slice(0, 200)}`,
    );
});

await check('导入子树后：对象数按子树规模增长，且再次导出与原导出等价', async () =>
{
    const before = await call('scene.summary', {});
    const treeSize = countObject3DNodes(exported.data);

    const imported = await call('scene.import', { data: exported.data });
    // 返回 { imported, ids, parentId }
    const importedIds = imported.ids ?? [];
    assert(importedIds.length === 1, `导出的子树是单个根对象，应导入 1 棵，实际 ${JSON.stringify(imported)}`);

    const after = await call('scene.summary', {});
    assert(
        after.objectCount === before.objectCount + treeSize,
        `导入后对象数应为 ${before.objectCount} + ${treeSize}（子树节点数），实际 ${after.objectCount}`,
    );

    // 往返等价：把导入的副本**再导出一次**，与原导出逐字段比对。
    // 这一条才是"保存→加载→渲染等价"的对外可验形式：只要几何/材质构造参数、组件字段、
    // 层级结构里有任何一项在反序列化时被丢掉或改写，两次导出的结果就对不上。
    const reexported = await call('scene.export', { objectId: importedIds[0] });
    const original = canonicalJson(exported.data);
    const roundtrip = canonicalJson(reexported.data);
    assert(original === roundtrip, `往返后导出结果不一致——${firstDifference(original, roundtrip)}`);

    // 再删掉导入的副本，验证 import 可清理（也把场景还原）
    await call('scene.remove', { objectIds: importedIds });
    const restored = await call('scene.summary', {});
    assert(
        restored.objectCount === before.objectCount,
        `清理导入副本后应回到 ${before.objectCount} 个对象，实际 ${restored.objectCount}`,
    );
});

// ---------------------------------------------------------------------------
// 4. 判据三：画面（无 GPU 时跳过而不是失败）
// ---------------------------------------------------------------------------
console.log('\n判据三：画面有内容（需要 WebGPU）：');
await check('view.probe 报出画面有内容', async () =>
{
    let probe;
    try
    {
        probe = await call('view.probe', {});
    }
    catch (error)
    {
        if (/WebGPU 尚未初始化/.test(error.message))
        {
            console.log('     ⚠️ 跳过：当前环境无可用 WebGPU（判据三需要 GPU，非本脚本可覆盖）');

            return;
        }
        throw error;
    }

    assert(typeof probe.uniqueColors === 'number', 'probe 应报出 uniqueColors');
    assert(probe.uniqueColors > 1, `画面不应是纯色，uniqueColors=${probe.uniqueColors}`);
});

// ---------------------------------------------------------------------------
// 清理
// ---------------------------------------------------------------------------
if (!keep)
{
    console.log('\n清理本轮创建的对象：');
    if (failures.length === 0)
    {
        await check('删除本轮创建的对象与组', async () =>
        {
            const byTag = await call('scene.remove', { tag: 'e2e-scene' });
            // scene.remove 的返回是 { removed, count, parents }
            assert(
                byTag.count === 4,
                `按 tag 应删掉地面与三个物体共 4 个，实际 ${byTag.count}（removed=${JSON.stringify(byTag.removed)}）`,
            );

            // 组是 group 建的、不带 tag，单独删
            const group = await call('scene.remove', { objectIds: [groupId] });
            assert(group.count === 1, `应删掉组 ${groupId}，实际 ${group.count}`);
        });
    }
    else
    {
        // 前面已经有失败项时，清理失败多半是"没搭起来所以没什么好清"的连带结果。
        // 这里只尽力清理并如实说明，不再往报告里追加一条会把注意力带偏的失败
        await call('scene.remove', { tag: 'e2e-scene' }).catch(() => { /* 尽力而为 */ });
        if (groupId) await call('scene.remove', { objectIds: [groupId] }).catch(() => { /* 尽力而为 */ });
        console.log('  ⚠️ 已有失败项：清理仅为尽力而为，不计入检查项');
    }
}

// ---------------------------------------------------------------------------
// 报告
// ---------------------------------------------------------------------------
console.log(`\n${'='.repeat(56)}`);
if (failures.length === 0)
{
    console.log(`✅ 端到端验收通过：${total} 项检查全部成功`);
    await finish(0);
}

console.log(`❌ 端到端验收失败：${failures.length}/${total} 项`);
for (const f of failures) console.log(`   - ${f}`);
await finish(1);
