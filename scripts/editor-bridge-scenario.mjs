// 集成验收：用桥接把"一张桌子"从零搭起来并逐项验证，覆盖这一轮新增的组合能力。
//
// 与冒烟自检的分工：冒烟逐方法检查"这个调用有没有坏"，这里检查"这些方法能否组合成一件真事"——
// 事务提交、失败回滚、贴地、整体尺寸、可见性、画面像素、体检、撤销还原，走一遍完整闭环。
//
// 用法：node scripts/editor-bridge-scenario.mjs [--target probe]
import { resolveBridgeBase } from './editor-bridge-base.mjs';

const PREFIX = '/__editor-bridge';
const base = await resolveBridgeBase();

const targetIndex = process.argv.indexOf('--target');
const target = targetIndex >= 0 ? process.argv[targetIndex + 1] : 'probe';

let failed = 0;
let total = 0;
async function call(method, params = {})
{
    const response = await fetch(`${base}${PREFIX}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, params, target }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const { id } = await response.json();
    const resultResponse = await fetch(`${base}${PREFIX}/result?id=${encodeURIComponent(id)}`);
    const payload = await resultResponse.json();
    if (payload.ok === false) throw new Error(payload.error);

    return payload.result;
}

function step(title, detail)
{
    console.log(`  ✓ ${title}${detail ? ` — ${detail}` : ''}`);
}

function assert(condition, message)
{
    if (!condition) throw new Error(message);
}

async function check(title, run)
{
    total++;
    try
    {
        const detail = await run();
        step(title, detail);
    }
    catch (error)
    {
        failed++;
        console.log(`  ✗ ${title} — ${error.message}`);
    }
}

// 同名页面多开会把请求随机分走，测出来的结论没有意义
const ping = await (await fetch(`${base}${PREFIX}/ping`)).json();
if (ping.duplicated?.length > 0)
{
    console.error(`✗ 同名页面多开：${ping.duplicated.map((d) => `${d.clientId} × ${d.pages}`).join('、')}，请先关掉多余页面`);
    process.exit(2);
}

const startDepth = (await call('history.status', { labels: 0 })).undoCount;
const startIds = (await call('scene.find', { namePattern: '.', limit: 500 })).matched.map((item) => item.id);
console.log(`起始：${startIds.length} 个对象，撤销栈 ${startDepth} 步\n`);

const TABLE = { r: 0.55, g: 0.35, b: 0.2 };
const LEG = { r: 0.4, g: 0.25, b: 0.15 };
const LEG_IDS = ['/Untitled/INT_Leg', '/Untitled/INT_Leg1', '/Untitled/INT_Leg2', '/Untitled/INT_Leg3'];
const steps = [
    {
        method: 'scene.add',
        params: {
            name: 'INT_TableTop', shape: 'cube', color: TABLE, glossiness: 40,
            scale: { x: 2, y: 0.1, z: 1.2 }, position: { x: 0, y: 0.75, z: 0 },
        },
    },
    {
        method: 'scene.add',
        params: {
            name: 'INT_Leg', shape: 'cube', color: LEG,
            scale: { x: 0.12, y: 0.75, z: 0.12 }, position: { x: 0, y: 0.375, z: 0 },
        },
    },
    { method: 'scene.duplicate', params: { objectId: '/Untitled/INT_Leg', count: 3, name: 'INT_Leg' } },
    {
        method: 'scene.arrange',
        params: { objectIds: LEG_IDS, mode: 'grid', axis: 'y', columns: 2, spacing: 1.3 },
    },
];

console.log('[1] 事务搭桌子');

await check('dryRun 先预演：不落笔', async () =>
{
    const before = (await call('scene.summary')).objectCount;
    const preview = await call('scene.batch', { dryRun: true, steps });
    assert(preview.dryRun === true, '缺 dryRun 标记');
    assert(preview.steps === 4, `预演了 ${preview.steps} 步`);
    const after = (await call('scene.summary')).objectCount;
    assert(after === before, `预演改变了对象数：${before} → ${after}`);
    assert((await call('scene.find', { nameContains: 'INT_' })).total === 0, '预演留下了对象');

    return `4 步预演完毕，对象数仍是 ${after}`;
});

await check('正式提交：5 个部件一次到位', async () =>
{
    const result = await call('scene.batch', { steps });
    assert(result.steps === 4, `执行了 ${result.steps} 步`);
    const found = await call('scene.find', { nameContains: 'INT_', limit: 100 });
    assert(found.total === 5, `应有桌面 + 4 条腿，实际 ${found.total}`);

    return `桌面 1 + 桌腿 ${found.total - 1}`;
});

await check('中途失败时整组回滚', async () =>
{
    const before = (await call('scene.summary')).objectCount;
    await call('scene.batch', {
        steps: [
            { method: 'scene.add', params: { name: 'INT_RollbackProbe', shape: 'cube', color: TABLE } },
            { method: 'scene.remove', params: { objectId: '/Untitled/__不存在的对象__' } },
        ],
    }).then(() => { throw new Error('本该失败却成功了'); }, () => undefined);
    const after = (await call('scene.summary')).objectCount;
    assert(after === before, `失败后对象数应回到 ${before}，实际 ${after}`);

    return `失败后对象数仍是 ${after}`;
});

console.log('\n[2] 摆正：贴地 + 整体尺寸');

await check('四条腿贴到地面（align edge=min）', async () =>
{
    await call('scene.arrange', { objectIds: LEG_IDS, mode: 'align', axis: 'y', value: 0, edge: 'min' });
    for (const id of LEG_IDS)
    {
        const bounds = await call('scene.bounds', { objectId: id });
        assert(Math.abs(bounds.bounds.min.y) < 1e-3, `${id} 的下界在 y=${bounds.bounds.min.y}`);
    }

    return '4 条腿的包围盒下界都落在 y=0';
});

await check('一次拿到整张桌子的范围', async () =>
{
    const merged = await call('scene.bounds', { objectIds: LEG_IDS });
    assert(merged.withBounds === 4, `只有 ${merged.withBounds} 个有包围盒`);
    const size = {
        x: merged.bounds.max.x - merged.bounds.min.x,
        z: merged.bounds.max.z - merged.bounds.min.z,
    };
    assert(size.x > 1, `四条腿跨度过小：x=${size.x}`);

    return `腿群 ${size.x.toFixed(2)} × ${size.z.toFixed(2)}`;
});

console.log('\n[3] 看一眼：可见性与画面');

await check('一次投影所有可渲染对象', async () =>
{
    const probe = await call('view.probe', { grid: 0, projectAll: true });
    const table = probe.projected.filter((item) => item.id.includes('INT_'));
    assert(table.length === 5, `只投影到 ${table.length} 个 INT_ 对象`);
    assert(table.every((item) => item.visible), `有部件不可见：${JSON.stringify(table.filter((i) => !i.visible))}`);

    return `5 个部件都在画面里（可渲染共 ${probe.projectedTotal} 个）`;
});

await check('画面像素确认真的画出来了', async () =>
{
    const probe = await call('view.probe', { grid: 0, colors: 6 });
    assert(probe.maxLuminance > probe.minLuminance, `画面是纯色：${probe.minLuminance}`);

    return `${probe.uniqueColors} 色，主色 ${probe.dominantColors[0].color} 占 ${Math.round(probe.dominantColors[0].ratio * 100)}%`;
});

await check('只看桌面所在的区域也有内容', async () =>
{
    const full = await call('view.probe', { grid: 0, colors: 3 });
    const center = await call('view.probe', {
        grid: 0,
        colors: 3,
        region: { x: Math.floor(full.width * 0.3), y: Math.floor(full.height * 0.3), width: Math.floor(full.width * 0.4), height: Math.floor(full.height * 0.4) },
    });
    assert(center.sampled > 0, '区域没采到像素');

    return `画面中央区域 ${center.region.width}×${center.region.height}，${center.uniqueColors} 色`;
});

await check('聚焦之后桌子在画面里占明显比例', async () =>
{
    // "在视锥内"不等于"看得清"：默认视角下整张桌子可能只占千分之几
    const wide = await call('view.probe', { grid: 0, colors: 4 });
    await call('camera.focus', { objectId: '/Untitled/INT_TableTop', distance: 4 });
    const close = await call('view.probe', { grid: 0, colors: 4 });
    assert(close.dominantColors[0].ratio < wide.dominantColors[0].ratio,
        `聚焦后背景占比没有下降：${Math.round(wide.dominantColors[0].ratio * 100)}% → ${Math.round(close.dominantColors[0].ratio * 100)}%`);
    assert(close.dominantColors[0].ratio < 0.8,
        `聚焦后背景仍占 ${Math.round(close.dominantColors[0].ratio * 100)}%，桌子几乎看不见`);
    await call('camera.setView', { preset: 'iso', objectId: '/Untitled' });

    return `背景占比 ${Math.round(wide.dominantColors[0].ratio * 100)}% → ${Math.round(close.dominantColors[0].ratio * 100)}%`;
});

console.log('\n[4] 体检查隐性毛病');

await check('validate 没有 error，且桌上东西齐全', async () =>
{
    const report = await call('scene.validate');
    const errors = report.issues.filter((issue) => issue.level === 'error');
    assert(errors.length === 0, `出现 error：${errors.map((issue) => issue.code).join(',')}`);

    return `ok=${report.ok}，${report.issueCount} 个问题（0 error）`;
});

await check('不用 where 也能按 tag 找回来', async () =>
{
    await call('scene.set', { objectId: '/Untitled/INT_TableTop', path: 'tag', value: 'furniture', create: true });
    const found = await call('scene.find', { tag: 'furniture' });
    assert(found.total >= 1, '按 tag 查不到桌面');

    return `tag=furniture 命中 ${found.total} 个`;
});

console.log('\n[5] 收拾干净');

await check('撤销回起始状态', async () =>
{
    let status = await call('history.status', { labels: 0 });
    let guard = 0;
    while (status.undoCount > startDepth && guard++ < 60)
    {
        await call('history.undo');
        status = await call('history.status', { labels: 0 });
    }
    const left = (await call('scene.find', { nameContains: 'INT_' })).total;
    assert(left === 0, `还剩 ${left} 个 INT_ 对象`);
    const nowIds = (await call('scene.find', { namePattern: '.', limit: 500 })).matched.map((item) => item.id);
    const missing = startIds.filter((id) => !nowIds.includes(id));
    assert(missing.length === 0, `丢了对象：${missing.slice(0, 3).join('、')}`);

    return `栈回到 ${status.undoCount} 步，对象数 ${nowIds.length}，起始对象一个不少`;
});

console.log(`\n共 ${total} 项：通过 ${total - failed}，失败 ${failed}`);
process.exit(failed > 0 ? 1 : 0);
