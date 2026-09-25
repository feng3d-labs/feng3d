// 压力测试：在探针页面上建 ~200 个对象，测桥接各方法的往返耗时，最后清理还原。
//
// 用途：方法耗时的回归基线。桥接的耗时主要是前端 100ms 轮询间隔带来的等待，方法本身开销很小
// （206 个对象下各方法 120~160ms）；一旦某个方法变成秒级，说明它真的在遍历/构建大量数据。
//
// 用法：node scripts/editor-bridge-stress.mjs [--target probe]
import { resolveBridgeBase } from './editor-bridge-base.mjs';

const PREFIX = '/__editor-bridge';
const base = await resolveBridgeBase();

const targetIndex = process.argv.indexOf('--target');
const target = targetIndex >= 0 ? process.argv[targetIndex + 1] : 'probe';

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

const timed = async (label, method, params) =>
{
    const start = performance.now();
    const result = await call(method, params);
    console.log(`  ${label.padEnd(26)} ${(performance.now() - start).toFixed(1).padStart(8)} ms`);

    return result;
};

// 同名页面多开时请求会被随机取走，测出来的耗时与对象数都不可信
try
{
    const ping = await (await fetch(`${base}${PREFIX}/ping`)).json();
    if (ping.duplicated?.length > 0)
    {
        console.error(`✗ 同名页面多开：${ping.duplicated.map((d) => `${d.clientId} × ${d.pages}`).join('、')}，请先关掉多余页面`);
        process.exit(2);
    }
}
catch
{
    // ping 拿不到就不拦
}

// 等场景初始化完成：页面刚打开时对象可能还在陆续创建，读到的是中间态
let before = 0;
for (let i = 0; i < 24; i++)
{
    const count = (await call('scene.summary')).objectCount;
    if (count > 0 && count === before) break;
    before = count;
    await new Promise((resolve) => setTimeout(resolve, 500));
}
const startDepth = (await call('history.status', { labels: 0 })).undoCount;
const startIds = (await call('scene.find', { namePattern: '.', limit: 500 })).matched.map((item) => item.id);
console.log(`起始对象数：${before}（撤销栈 ${startDepth} 步）`);
if (before > 10)
{
    // 起点不干净时基线没有可比性——多半是上一次跑到一半失败了
    console.log(`  ⚠ 起始对象数偏多（${before}）：页面里可能有上一次测试的残留，建议先清理或刷新页面`);
}

console.log('--- 建 200 个对象（1 次 add + 4 次 duplicate×50）---');
await call('scene.add', { name: 'Stress', shape: 'cube', position: { x: 0, y: 0.5, z: 0 } });
for (let i = 0; i < 4; i++)
{
    await call('scene.duplicate', { objectId: '/Untitled/Stress', count: 50, name: `Stress${i}` });
}
console.log(`建好后对象数：${(await call('scene.summary')).objectCount}`);

console.log('--- 各方法耗时 ---');
// 先取一次这 200 个对象的真实 id（duplicate 的命名规则不必猜）；
// bounds 一次最多 200 个，所以截一下（多出来的是源对象 Stress 自己）
const stressIds = (await call('scene.find', { nameContains: 'Stress', limit: 500 })).matched
    .map((item) => item.id)
    .slice(0, 200);
await timed('scene.summary', 'scene.summary');
await timed('scene.list(depth=1)', 'scene.list', { depth: 1 });
await timed('scene.find(limit=50)', 'scene.find', { nameContains: 'Stress', limit: 50 });
await timed('scene.find(where)', 'scene.find', { nameContains: 'Stress', where: { path: 'position.y', op: 'gte', value: 0 } });
await timed('scene.validate(50)', 'scene.validate', { issues: 50 });
await timed('scene.bounds', 'scene.bounds', { objectId: '/Untitled/Stress' });
await timed(`scene.bounds(合并 ${stressIds.length})`, 'scene.bounds', { objectIds: stressIds });
await timed('view.probe', 'view.probe', { grid: 0 });
await timed('view.probe(projectAll)', 'view.probe', { grid: 0, projectAll: true });
await timed('view.screenshot(400)', 'view.screenshot', { width: 400 });

console.log('--- 清理（撤销回起始深度，再删掉起始不存在的对象兜底）---');
let status = await call('history.status', { labels: 0 });
let guard = 0;
while (status.undoCount > startDepth && guard++ < 60)
{
    await call('history.undo');
    status = await call('history.status', { labels: 0 });
}
const nowIds = (await call('scene.find', { namePattern: '.', limit: 500 })).matched.map((item) => item.id);
const leftovers = nowIds.filter((id) => !startIds.includes(id));
const topLeftovers = leftovers.filter((id) => !leftovers.some((other) => other !== id && id.startsWith(`${other}/`)));
if (topLeftovers.length > 0) await call('scene.remove', { objectIds: topLeftovers });

const after = (await call('scene.summary')).objectCount;
const finalIds = (await call('scene.find', { namePattern: '.', limit: 500 })).matched.map((item) => item.id);
const missing = startIds.filter((id) => !finalIds.includes(id));
console.log(`清理后对象数：${after}（起始 ${before}）${missing.length === 0 ? ' ✓' : ` ✗ 丢了 ${missing.slice(0, 3).join('、')}`}`
    + `${topLeftovers.length ? `（删掉 ${topLeftovers.length} 棵残留子树）` : ''}`);
