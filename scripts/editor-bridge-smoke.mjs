#!/usr/bin/env node
/**
 * 编辑器 AI 桥接冒烟测试。
 *
 * 覆盖桥接的每个方法：只读方法断言返回结构，写方法执行后**统一撤销还原**，
 * 因此除了 `scene.save` 会把（已还原的）场景写回存储外，不会改变场景内容。
 *
 * 为什么需要它：桥接方法多、且不少行为是"实测才发现的"（例如 `runRequest` 必须 await、
 * 路径写错要报错、批量写要原子）。没有回归测试时，任何一次改动都可能悄悄破坏其中一项，
 * 而人肉逐条 CLI 调用既不现实也容易漏。
 *
 * 前提：编辑器 dev server 在跑、页面已在浏览器中打开；写测试还需写通道已启用
 * （编辑器 URL 加 `?bridge=write`，或控制台执行 `localStorage.setItem('editor-bridge-write', '1')`）。
 *
 * 用法：
 *   node scripts/editor-bridge-smoke.mjs
 *   node scripts/editor-bridge-smoke.mjs --target probe    # 多页面时定向
 *   node scripts/editor-bridge-smoke.mjs --skip-write      # 只测只读部分
 */
import { resolveBridgeBase } from './editor-bridge-base.mjs';

const PREFIX = '/__editor-bridge';
const args = process.argv.slice(2);
const readOption = (name, fallback) =>
{
    const index = args.indexOf(name);

    return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const target = readOption('--target', process.env.BRIDGE_TARGET);
const skipWrite = args.includes('--skip-write');
const base = await resolveBridgeBase();

/** 调用桥接方法 */
async function call(method, params = {})
{
    const body = target ? { method, params, target } : { method, params };
    const response = await fetch(`${base}${PREFIX}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}：${await response.text()}`);

    const { id } = await response.json();
    const resultResponse = await fetch(`${base}${PREFIX}/result?id=${encodeURIComponent(id)}`);
    const payload = await resultResponse.json();
    if (payload.ok === false) throw new Error(payload.error ?? '未知错误');

    return payload.result;
}

const results = [];

function assert(condition, message)
{
    if (!condition) throw new Error(message);
}

/** 跑一项检查，失败不中断后续（最后统一汇总） */
async function check(name, fn)
{
    try
    {
        const detail = await fn();
        results.push({ name, ok: true });
        console.log(`  PASS  ${name}${detail ? ` — ${detail}` : ''}`);
    }
    catch (e)
    {
        const message = String(e?.message ?? e);
        results.push({ name, ok: false, message });
        console.log(`  FAIL  ${name} — ${message}`);
    }
}

/** 断言某次调用会失败（用于验证防呆与错误路径） */
async function expectFailure(method, params)
{
    try
    {
        await call(method, params);
    }
    catch (e)
    {
        return String(e?.message ?? e).slice(0, 80);
    }

    throw new Error(`${method} 本应失败，却成功了`);
}

console.log(`桥接地址: ${base}${target ? `（target=${target}）` : ''}\n`);

// 先看有几个页面在线：不指定 target 时请求会被**随机**取走（可能落到用户的浏览器页面上），
// 场景状态于是在多个页面之间跳——表现是一堆互相矛盾的 FAIL，而真因极难看出来。
// 与其跑出一份不可信的结果，不如在这里停下（这是实测踩过的坑，见 docs §9「定向投递」）。
try
{
    const ping = await (await fetch(`${base}${PREFIX}/ping`)).json();
    const online = ping.clients ?? [];
    if (online.length > 0)
    {
        console.log(`在线页面：${online.map((c) => `${c.clientId}（${c.polls} 次轮询）`).join('、')}\n`);
    }
    if (ping.duplicated?.length > 0)
    {
        console.error(`✗ 同名页面多开：${ping.duplicated.map((d) => `${d.clientId} × ${d.pages}`).join('、')}`);
        console.error('  同一个 ?bridgeClient= 被多个标签页打开时，请求会被随机取走，测试结果不可信。');
        console.error('  请关掉多余页面或改用不同的 ?bridgeClient=。');
        process.exit(2);
    }
    if (!target && online.length > 1)
    {
        console.error(`✗ 有 ${online.length} 个编辑器页面在线（${online.map((c) => c.clientId).join('、')}），却没有指定 target`);
        console.error('  此时请求会被随机取走，测试结果不可信。请加 --target <clientId> 重跑，或关掉多余页面。');
        process.exit(2);
    }
}
catch
{
    // ping 拿不到就不拦：后续调用自己会报"页面不可达"
}

// 先确认页面在线：页面失联时后面每一项都会超时，输出会变成一片 FAIL 而掩盖真正原因
let info;
try
{
    info = await call('editor.info');
}
catch (e)
{
    console.error(`编辑器页面不可达：${String(e?.message ?? e)}`);
    console.error('请确认编辑器页面已打开，且该标签页**处于前台**（后台标签页会被浏览器节流甚至暂停）。');
    process.exit(2);
}

// ---------------------------------------------------------------------------
// 只读方法
// ---------------------------------------------------------------------------
console.log('[只读]');

let sceneObjectCount = 0;

// 只有**本次运行期间**新增的日志才算"本次产生的错误"：缓冲里可能留着更早的历史错误
// （例如上一次手动调试时把 scale 设为 0 引发的「无法获取逆矩阵」）
const logBaseline = (await call('log.tail', { limit: 1 })).lastSeq;

await check('editor.info 返回场景与方法表', () =>
{
    assert(info.hasScene, '当前没有场景');
    assert(info.methods.includes('scene.get'), 'methods 缺 scene.get');
    // 当前视角：调过 camera.focus / setView 之后要能确认
    assert(info.camera && typeof info.camera.position?.x === 'number',
        `缺相机状态：${JSON.stringify(info.camera)}`);
    assert(info.methods.includes('view.screenshot'), 'methods 缺 view.screenshot');
    assert(typeof info.writeEnabled === 'boolean', '缺 writeEnabled');

    return `${info.sceneName}，${info.methods.length} 个方法，写通道${info.writeEnabled ? '已启用' : '未启用'}`;
});

const summary = await call('scene.summary');
sceneObjectCount = summary.objectCount;
await check('scene.export 导出可复用的纯数据', async () =>
{
    // 导出的东西要能直接喂回 scene.add 的 components，否则"导出复用"就是空话
    const source = await call('scene.add', {
        name: 'ExportProbe', shape: 'cube', color: { r: 0.2, g: 0.6, b: 0.9 }, position: { x: 5, y: 1, z: 0 },
    });
    const exported = await call('scene.export', { objectId: source.id });
    assert(exported.objectCount === 1, `objectCount = ${exported.objectCount}`);
    assert(exported.data?.__type__ === 'Object3D', `data 不是对象字面量：${JSON.stringify(exported.data).slice(0, 80)}`);
    assert(Array.isArray(exported.data.components), '导出结果缺 components');
    assert(exported.data.components[0].__type__ === 'MeshRenderer', '第一个组件不是 MeshRenderer');
    // 几何存的是构造参数而不是顶点数组（体积可控的原因）
    assert(exported.data.components[0].geometry.__type__ === 'CubeGeometry', '几何类型不对');

    // 真正喂回去：用一个新对象复刻它
    await call('scene.add', {
        name: 'ExportCopy',
        components: JSON.parse(JSON.stringify(exported.data.components)),
        position: { x: -5, y: 1, z: 0 },
    });
    const copied = await call('scene.find', { name: 'ExportCopy' });
    assert(copied.total === 1, '导出结果没能复刻成新对象');
    // export 只读：不给 objectIds 时导出整个场景并说明
    const whole = await call('scene.export', {});
    assert(whole.objectCount === 1 && whole.note, `整场景导出应带 note：${JSON.stringify(Object.keys(whole))}`);
    await expectFailure('scene.export', { objectIds: [] });

    // 自查自清：本检查跑在写段的基线之前，写段末尾的统一撤销覆盖不到它
    await call('scene.remove', { nameContains: 'Export' });

    return `导出 ${JSON.stringify(exported.data).length} 字符，并能喂回 scene.add 复刻`;
});

await check('editor.overview 一次给全开工前的信息', async () =>
{
    const overview = await call('editor.overview');
    assert(overview.hasScene === true, `hasScene = ${overview.hasScene}`);
    assert(Array.isArray(overview.writeMethods), '缺方法分类');
    // methods 是分类的并集，概览里刻意不重复给
    assert(!('methods' in overview), '概览不该重复给出 methods（分类已经涵盖了）');
    assert(overview.summary?.objectCount > 0, `缺场景摘要：${JSON.stringify(Object.keys(overview))}`);
    assert(typeof overview.validation?.ok === 'boolean', '缺体检摘要');
    assert(Array.isArray(overview.validation.issues), 'validation.issues 不是数组');
    assert(overview.validation.issues.length <= 5, `默认最多给 5 条，实际 ${overview.validation.issues.length}`);
    assert(typeof overview.view?.nonDominantRatio === 'number', '缺画面统计');
    assert(overview.view.width > 0, '画面尺寸无效');
    // 控制台动静：开工前就该知道这里刚才有没有报错
    assert(typeof overview.log?.counts?.error === 'number', `缺日志计数：${JSON.stringify(overview.log)}`);
    assert(Array.isArray(overview.log.recentErrors), 'recentErrors 不是数组');
    // 按状态给下一步：写通道开着就该提到写方法
    assert(typeof overview.hint === 'string' && overview.hint.length > 10, `缺 hint：${overview.hint}`);
    if (overview.writeEnabled) assert(overview.hint.includes('scene.add'), `写通道开着却没提写方法：${overview.hint}`);
    // 条数可控，且截断时明说
    const one = await call('editor.overview', { issues: 1 });
    assert(one.validation.issues.length <= 1, `issues=1 却给了 ${one.validation.issues.length} 条`);

    return `概览含 ${overview.readMethods.length + overview.writeMethods.length} 个方法、${overview.summary.objectCount} 个对象、`
        + `${overview.validation.issueCount} 个问题、画面 ${overview.view.width}x${overview.view.height}`;
});

await check('scene.summary 对象数 > 0', () =>
{
    assert(summary.objectCount > 0, `objectCount = ${summary.objectCount}`);
    assert(summary.rootId, '缺 rootId');
    // "几个看得见"是决定下一步做什么的关键信息，应当在第一个方法里就有
    assert(typeof summary.renderVisible === 'number' && typeof summary.renderInvisible === 'number',
        `缺视野统计：${JSON.stringify({ visible: summary.renderVisible, invisible: summary.renderInvisible })}`);
    assert(summary.renderVisible + summary.renderInvisible > 0, '一个可渲染对象都没统计到');
    // 组件类型分布：只有总数时，AI 还得逐个对象看才知道里面有没有相机、光源
    assert(typeof summary.componentTypes === 'object' && summary.componentTypes !== null,
        `缺 componentTypes：${JSON.stringify(Object.keys(summary))}`);
    const typeTotal = Object.values(summary.componentTypes).reduce((sum, value) => sum + value, 0);
    assert(typeTotal === summary.componentCount,
        `componentTypes 合计 ${typeTotal} ≠ componentCount ${summary.componentCount}`);
    assert(summary.componentTypes.MeshRenderer >= 1, '应统计到 MeshRenderer');

    return `${summary.objectCount} 个对象 / ${summary.componentCount} 个组件，可见 ${summary.renderVisible} 个`;
});

let firstChildId = summary.children?.[0]?.id ?? null;
await check('scene.list 能展开根', async () =>
{    const listed = await call('scene.list', { depth: 1 });
    assert(listed.node, '缺 node');
    assert(Array.isArray(listed.node.children), 'node.children 不是数组');

    return `${listed.node.children.length} 个一级子节点`;
});

await check('scene.list 的 limit 能防上下文膨胀', async () =>
{
    // 两百个对象的场景在 depth=2 下能列出二十多万字符的树，必须能截断且如实标记
    const limited = await call('scene.list', { limit: 1 });
    assert(limited.limit === 1, `limit 未生效：${limited.limit}`);
    assert(limited.truncated === true, `节点被截断却没有标记：${JSON.stringify(limited.node?.children)}`);
    assert(limited.node.children.length <= 1, `一级子节点给了 ${limited.node.children.length} 个`);

    const full = await call('scene.list', { limit: 1000 });
    assert(!full.truncated, `limit=1000 不该截断`);

    return `limit=1 时截断并标记；limit=1000 时 ${full.node.children.length} 个一级子节点`;
});

await check('scene.get 返回变换与组件', async () =>
{
    assert(firstChildId, '没有可用的子对象');
    const detail = await call('scene.get', { objectId: firstChildId });
    assert(detail.id === firstChildId, `id 不一致：${detail.id}`);
    assert(Array.isArray(detail.components), 'components 不是数组');

    return `${detail.name}，${detail.components.length} 个组件`;
});

await check('scene.get 对不存在的路径报错', async () =>
    `已拦截：${await expectFailure('scene.get', { objectId: '/Untitled/__not_exist__' })}`);

await check('scene.find 子串匹配', async () =>
{
    const found = await call('scene.find', { nameContains: 'a', limit: 5 });
    assert(Array.isArray(found.matched), 'matched 不是数组');

    return `${found.count} 个匹配`;
});

await check('scene.find 正则匹配', async () =>
{
    const found = await call('scene.find', { namePattern: '.', limit: 3, includeTransform: true });
    assert(found.count > 0, '正则 . 应该匹配到对象');

    return `${found.count} 个匹配（含 position）`;
});

await check('scene.find 非法正则报错', async () =>
    `已拦截：${await expectFailure('scene.find', { namePattern: '[' })}`);

await check('scene.find 支持 where 属性过滤', async () =>
{
    const high = await call('scene.find', {
        where: { path: 'position.y', op: 'gte', value: 1 },
        includeTransform: true,
    });
    for (const item of high.matched)
    {
        assert(item.position && item.position.y >= 1, `${item.name} 的 y = ${item.position?.y} 不满足 >= 1`);
    }
    await expectFailure('scene.find', { where: { path: 'position.y', op: 'blob', value: 0 } });

    return `${high.count} 个对象的 y >= 1`;
});

await check('scene.bounds 返回包围盒或明确原因', async () =>
{
    assert(firstChildId, '没有可用的子对象');
    const bounds = await call('scene.bounds', { objectId: firstChildId });
    assert('bounds' in bounds, '缺 bounds 字段');

    return bounds.bounds ? '有包围盒' : `无：${bounds.reason}`;
});

await check('scene.bounds 支持多对象合并', async () =>
{
    // 只取有 MeshRenderer 的对象：相机/光源本来就没有几何包围盒
    const found = await call('scene.find', { namePattern: '.', type: 'MeshRenderer' });
    const ids = found.matched.map((item) => item.id);
    assert(ids.length >= 2, `需要至少 2 个可渲染对象，实际 ${ids.length}`);

    // 各对象的包围盒逐个取，再自己合并，与桥接给的合并结果对照
    const merged = await call('scene.bounds', { objectIds: ids });
    assert(merged.count === ids.length, `count = ${merged.count}`);
    const boxes = [];
    for (const id of ids)
    {
        const item = await call('scene.bounds', { objectId: id });
        if (item.bounds) boxes.push(item.bounds);
    }
    assert(boxes.length === ids.length, `可用的包围盒 ${boxes.length} ≠ ${ids.length}`);
    assert(merged.bounds, `合并结果为空：${merged.reason}`);

    const expectedMinX = Math.min(...boxes.map((b) => b.min.x));
    const expectedMaxZ = Math.max(...boxes.map((b) => b.max.z));
    assert(Math.abs(merged.bounds.min.x - expectedMinX) < 1e-6, `min.x = ${merged.bounds.min.x} ≠ ${expectedMinX}`);
    assert(Math.abs(merged.bounds.max.z - expectedMaxZ) < 1e-6, `max.z = ${merged.bounds.max.z} ≠ ${expectedMaxZ}`);
    assert(merged.withBounds === boxes.length, `withBounds = ${merged.withBounds} ≠ ${boxes.length}`);

    return `${ids.length} 个对象合并为 min.x=${merged.bounds.min.x.toFixed(1)} / max.z=${merged.bounds.max.z.toFixed(1)}`;
});

await check('log.tail 返回日志缓冲与计数', async () =>
{
    const logs = await call('log.tail', { limit: 5 });
    assert(Array.isArray(logs.entries), 'entries 不是数组');
    assert(typeof logs.counts === 'object', '缺 counts');
    assert(typeof logs.lastSeq === 'number', '缺 lastSeq');

    return `log=${logs.counts.log} warn=${logs.counts.warn} error=${logs.counts.error}，lastSeq=${logs.lastSeq}`;
});

await check('log.tail 无新增错误', async () =>
{
    const errors = await call('log.tail', { type: 'error', limit: 5, sinceSeq: logBaseline });
    assert(errors.entries.length === 0, `有 ${errors.entries.length} 条错误：${errors.entries[0]?.message?.slice(0, 120)}`);

    return '0 条错误';
});

await check('editor.info 按通道分类方法', () =>
{
    assert(Array.isArray(info.readMethods) && Array.isArray(info.writeMethods),
        `缺通道分类：${JSON.stringify(Object.keys(info))}`);
    assert(info.readMethods.includes('scene.summary'), 'readMethods 缺 scene.summary');
    assert(info.writeMethods.includes('scene.add'), 'writeMethods 缺 scene.add');
    assert(!info.readMethods.includes('scene.add'), 'scene.add 不该出现在 readMethods 里');
    assert(info.readMethods.length + info.writeMethods.length === info.methods.length,
        `分类数对不上：${info.readMethods.length} + ${info.writeMethods.length} ≠ ${info.methods.length}`);

    return `${info.readMethods.length} 个只读 + ${info.writeMethods.length} 个写方法`;
});

await check('scene.validate 场景健康检查', async () =>
{
    const report = await call('scene.validate');
    assert(typeof report.ok === 'boolean', '缺 ok');
    assert(Array.isArray(report.issues), 'issues 不是数组');
    assert(report.stats.objects > 0, `stats.objects = ${report.stats.objects}`);
    assert(report.stats.cameras > 0, '场景里没有相机');
    assert(typeof report.stats.triangles === 'number', '缺 triangles 统计');
    assert(typeof report.truncated !== 'boolean' || report.truncated === false || report.issues.length <= 50,
        '被截断时返回条数应不超过上限');
    assert(report.issues.length <= report.issueCount, `返回 ${report.issues.length} 条 > 总数 ${report.issueCount}`);
    // 按 code 分组：被截断时也能知道问题类型分布
    assert(typeof report.issueCounts === 'object' && report.issueCounts !== null, `缺 issueCounts`);
    const counted = Object.values(report.issueCounts).reduce((sum, value) => sum + value, 0);
    assert(counted === report.issueCount, `issueCounts 合计 ${counted} ≠ issueCount ${report.issueCount}`);
    // 可见数与 scene.summary 同一口径，两处都能回答"几个看得见"
    assert(typeof report.stats.visible === 'number' && typeof report.stats.invisible === 'number',
        `缺可见数统计：${JSON.stringify(report.stats)}`);
    assert(report.stats.visible + report.stats.invisible === report.stats.renderers,
        `可见 ${report.stats.visible} + 不可见 ${report.stats.invisible} ≠ 可渲染 ${report.stats.renderers}`);
    // 默认场景不该有无材质的 MeshRenderer——那正是历史上引发栈溢出的形态
    assert(report.stats.withMaterial === report.stats.renderers,
        `有 ${report.stats.renderers - report.stats.withMaterial} 个 MeshRenderer 没有材质`);

    return `ok=${report.ok}，${report.issueCount} 个问题，${report.stats.objects} 个对象，${report.stats.triangles} 个三角面`;
});

await check('scene.find 支持排序', async () =>
{
    const asc = await call('scene.find', { namePattern: '.', sortBy: 'position.y', order: 'asc' });
    const desc = await call('scene.find', { namePattern: '.', sortBy: 'position.y', order: 'desc' });
    assert(asc.count === desc.count, `排序改变了匹配数量：${asc.count} ≠ ${desc.count}`);
    assert(asc.count >= 2, `对象太少（${asc.count}），排序无法验证`);

    const ys = [];
    for (const item of asc.matched)
    {
        const detail = await call('scene.get', { objectId: item.id });
        ys.push(detail.position?.y ?? 0);
    }
    for (let i = 1; i < ys.length; i++)
    {
        assert(ys[i] >= ys[i - 1], `升序被打破：${ys.map((y) => y.toFixed(2)).join(', ')}`);
    }
    assert(desc.matched[0].id === asc.matched[asc.count - 1].id || asc.count === 1, '降序首项应为升序末项');
    await expectFailure('scene.find', { namePattern: '.', order: 'sideways' });
    await expectFailure('scene.find', { namePattern: '.', sortBy: 'scale.x' });

    return `${asc.count} 个对象按 position.y 升序：${ys.map((y) => y.toFixed(1)).join(' ≤ ')}`;
});

await check('scene.get / validate 的数量上限', async () =>
{
    // 每个详情约 300 字符：一次问两百个就是六万字符，同样得有个闸
    const summary = await call('scene.summary');
    const ids = [summary.rootId, ...(summary.children ?? []).map((child) => child.id)];
    const many = await call('scene.get', { objectIds: ids, limit: 1 });
    assert(many.objects.length === 1, `limit=1 却返回 ${many.objects.length} 个详情`);
    assert(many.total === ids.length, `total = ${many.total} ≠ ${ids.length}`);
    if (ids.length > 1) assert(many.truncated === true, '被截断却没标记');

    // 用少量 id 验证"limit 够大时不该截断"（不依赖场景规模，免得场景脏了就让断言失真）
    const small = ids.slice(0, 3);
    const plenty = await call('scene.get', { objectIds: small, limit: 200 });
    assert(plenty.objects.length === small.length, `limit=200 却只给 ${plenty.objects.length} 个（要 ${small.length} 个）`);
    assert(!plenty.truncated, 'limit 够大时不该标记截断');

    // 体检的问题条数也受控，且 issueCount 始终是总数
    const one = await call('scene.validate', { issues: 1 });
    assert(one.issues.length <= 1, `issues=1 却给了 ${one.issues.length} 条`);
    assert(one.issueCount >= one.issues.length, `issueCount = ${one.issueCount} < ${one.issues.length}`);

    return `${ids.length} 个 id：limit=1 → 1 个详情并标记截断；validate 的 issueCount 不受截断影响`;
});

await check('scene.find 报告命中总数与截断', async () =>
{
    const all = await call('scene.find', { namePattern: '.', limit: 500 });
    assert(typeof all.total === 'number', `缺 total：${JSON.stringify(Object.keys(all))}`);
    assert(all.total >= all.count, `total ${all.total} 应不小于 count ${all.count}`);
    assert(!all.truncated, `limit=500 不该截断：total=${all.total}`);

    const limited = await call('scene.find', { namePattern: '.', limit: 1 });
    assert(limited.count === 1, `limit=1 却返回 ${limited.count} 条`);
    if (all.total > 1)
    {
        assert(limited.truncated === true, `${all.total} 个命中只返回 1 个，truncated 应为 true`);
        assert(limited.total === all.total, `两次 total 应一致：${limited.total} ≠ ${all.total}`);
    }
    await expectFailure('scene.find', { namePattern: '.', limit: 0 });

    return `total=${all.total}；limit=1 → count=1 / truncated=${limited.truncated}`;
});

await check('scene.find where 支持多条件', async () =>
{
    assert(firstChildId, '没有可用的子对象');
    // 数组表示"全部满足"：单条件表达不了"既在这个范围内、又是这个类型"
    const both = await call('scene.find', {
        namePattern: '.',
        where: [
            { path: 'position.y', op: 'gte', value: -1000 },
            { path: 'position.y', op: 'lte', value: 1000 },
        ],
    });
    assert(both.count > 0, '多条件应至少匹配到默认场景里的对象');
    const impossible = await call('scene.find', {
        namePattern: '.',
        where: [
            { path: 'position.y', op: 'gte', value: 100000 },
            { path: 'position.y', op: 'lte', value: -100000 },
        ],
    });
    assert(impossible.count === 0, `自相矛盾的条件却匹配到 ${impossible.count} 个`);
    // 拼错 op 要报错，而不是静默筛不出东西
    await expectFailure('scene.find', { namePattern: '.', where: { path: 'position.y', op: 'bigger', value: 0 } });
    // in：值是数组里的某一个
    const inHit = await call('scene.find', {
        namePattern: '.',
        where: { path: 'name', op: 'in', value: ['Plane', 'Sphere'] },
    });
    assert(inHit.total >= 1, `op=in 没匹配到：${JSON.stringify(inHit.matched)}`);
    await expectFailure('scene.find', { namePattern: '.', where: { path: 'name', op: 'in', value: 'Plane' } });

    return `多条件匹配 ${both.count} 个、矛盾条件 0 个、非法 op 被拦、op=in 命中 ${inHit.total} 个`;
});

await check('scene.find includeBounds 带出各自包围盒', async () =>
{
    const found = await call('scene.find', { type: 'MeshRenderer', includeBounds: true });
    assert(found.count >= 1, '没找到可渲染对象');
    const withBounds = found.matched.filter((item) => item.bounds);
    assert(withBounds.length === found.count, `${found.count} 个里只有 ${withBounds.length} 个带包围盒`);
    const box = withBounds[0].bounds;
    assert(box.min && box.max, `包围盒结构不对：${JSON.stringify(box)}`);
    // 与逐个 scene.bounds 的结果一致
    const single = await call('scene.bounds', { objectId: withBounds[0].id });
    assert(Math.abs(single.bounds.min.x - box.min.x) < 1e-6, `min.x 不一致：${single.bounds.min.x} ≠ ${box.min.x}`);

    return `${found.count} 个对象各带包围盒，与 scene.bounds 一致`;
});

await check('scene.find includeScreen 带出视野信息', async () =>
{
    const found = await call('scene.find', { nameContains: 'Plane', includeScreen: true });
    assert(found.count >= 1, '没找到 Plane');
    const item = found.matched[0];
    assert(item.view, `缺 view 字段：${JSON.stringify(item)}`);
    assert(typeof item.view.visible === 'boolean', 'view.visible 不是布尔');
    // 与 view.probe 的 project 给同一套坐标（含屏幕像素）
    assert(item.view.screen && typeof item.view.screen.x === 'number', `view 缺屏幕像素：${JSON.stringify(item.view)}`);
    const probe = await call('view.probe', { grid: 0, project: [item.id] });
    const projected = probe.projected[0];
    assert(projected.screen.x === item.view.screen.x && projected.screen.y === item.view.screen.y,
        `两处屏幕坐标不一致：find ${JSON.stringify(item.view.screen)} vs probe ${JSON.stringify(projected.screen)}`);
    // 默认场景里 Plane 就在相机视野内
    assert(item.view.visible === true, `Plane 应在视野内：${JSON.stringify(item.view)}`);

    return `${item.id} → ndc(${item.view.x}, ${item.view.y}, ${item.view.z}) visible=${item.view.visible}`;
});

await check('camera.focus / setView 的 distance 校验', async () =>
{
    assert(firstChildId, '没有可用的子对象');
    // 非正数直接拒绝：相机会与目标重合，画面糊成一团
    await expectFailure('camera.focus', { objectId: firstChildId, distance: 0 });
    await expectFailure('camera.focus', { objectId: firstChildId, distance: -5 });
    await expectFailure('camera.setView', { preset: 'top', objectId: firstChildId, distance: 'x' });

    // 给合法距离照常工作：对象仍应可见（投影能兜住"相机跑飞了"这种错）
    const view = await call('camera.setView', { preset: 'iso', objectId: firstChildId, distance: 12 });
    assert(view.targetId === firstChildId, `targetId 不符：${view.targetId}`);
    const probe = await call('view.probe', { grid: 0, project: [firstChildId] });
    assert(probe.projected[0].visible === true, '给定距离取景后对象应仍可见');

    return '非法 distance 被拦下；distance=12 取景后对象仍可见';
});

await check('scene.get 的 includeBounds 与 find 一致', async () =>
{
    const found = await call('scene.find', { type: 'MeshRenderer', includeBounds: true });
    assert(found.count >= 1, '没找到可渲染对象');
    const target = found.matched[0];
    const detail = await call('scene.get', { objectId: target.id, includeBounds: true });
    assert(detail.bounds, `scene.get 没返回 bounds：${JSON.stringify(Object.keys(detail))}`);
    assert(Math.abs(detail.bounds.min.x - target.bounds.min.x) < 1e-6,
        `两处 min.x 不一致：${detail.bounds.min.x} ≠ ${target.bounds.min.x}`);

    return `${target.id} 两处包围盒一致（min.x=${detail.bounds.min.x.toFixed(2)}）`;
});

await check('selection.get 带出类型与视野信息', async () =>
{
    const before = await call('selection.get');
    assert(typeof before.count === 'number', '缺 count');
    if (!firstChildId) return '无对象可选中';

    const selected = await call('selection.set', { objectIds: [firstChildId] });
    assert(selected.count === 1, `选中数应为 1，实际 ${selected.count}`);

    const after = await call('selection.get');
    const item = after.objects[0];
    assert(Array.isArray(item.types), `缺 types：${JSON.stringify(item)}`);
    assert('view' in item, '缺 view（视野信息）');
    assert(item.id === firstChildId, `id 不符：${item.id}`);

    await call('selection.set', { objectIds: [] });
    const cleared = await call('selection.get');
    assert(cleared.count === 0, '清空选中失败');

    return `${item.id} 类型 ${item.types.join('/')}，可见 ${item.view?.visible}；可选中可清空`;
});

await check('camera.focus 聚焦对象', async () =>
{
    assert(firstChildId, '没有可用的子对象');
    const focused = await call('camera.focus', { objectId: firstChildId });
    assert(focused.focused === firstChildId, 'focused 不一致');

    return focused.name;
});

await check('view.screenshot 返回 PNG', async () =>
{
    const shot = await call('view.screenshot', { width: 400 });
    assert(shot.mimeType === 'image/png', `mimeType = ${shot.mimeType}`);
    assert(shot.base64 && shot.base64.length > 1000, `base64 太短：${shot.base64?.length}`);
    assert(shot.width > 0 && shot.height > 0, '尺寸无效');

    return `${shot.width}x${shot.height}，${Math.round(shot.base64.length / 1024)}KB`;
});

await check('view.screenshot 支持只截一块区域', async () =>
{
    const full = await call('view.screenshot', { width: 200 });
    const region = {
        x: Math.floor(full.sourceWidth * 0.25),
        y: Math.floor(full.sourceHeight * 0.25),
        width: Math.floor(full.sourceWidth * 0.5),
        height: Math.floor(full.sourceHeight * 0.5),
    };
    const crop = await call('view.screenshot', { width: 200, region });
    assert(crop.base64 && crop.base64.length > 500, '裁剪后的图太小');
    assert(crop.region?.width === region.width && crop.region?.height === region.height,
        `region 未按预期回显：${JSON.stringify(crop.region)}`);
    assert(crop.sourceWidth === region.width && crop.sourceHeight === region.height,
        `裁剪后尺寸不对：${crop.sourceWidth}x${crop.sourceHeight} ≠ ${region.width}x${region.height}`);
    // 与 view.probe 的 region 校验一致：整块在外面要报错
    await expectFailure('view.screenshot', { region: { x: 99999, y: 99999, width: 10, height: 10 } });

    return `${full.sourceWidth}x${full.sourceHeight} → 裁 ${crop.sourceWidth}x${crop.sourceHeight}（${Math.round(crop.base64.length / 1024)}KB）`;
});

await check('view.probe 像素统计可判断画面内容', async () =>
{
    const probe = await call('view.probe', { grid: 4 });
    assert(probe.width > 0 && probe.height > 0, '尺寸无效');
    assert(probe.sampled > 0, '没有采样到像素');
    assert(probe.art !== undefined, '缺 art（字符画）');
    // 默认不再重复给数值数组：art 已含同样的信息
    assert(probe.grid === undefined, '默认不该返回 grid 数值数组（要它请传 gridValues: true）');
    const withGrid = await call('view.probe', { grid: 4, gridValues: true });
    assert(withGrid.grid?.length === 16, `gridValues 时网格项数 = ${withGrid.grid?.length}（应为 4x4）`);
    // 同一份数据的字符画：调用方是文本模型，字符画比 64 个数字更接近"看出来"
    const artRows = typeof probe.art === 'string' ? probe.art.split('\n') : [];
    assert(artRows.length === 4, `字符画行数 = ${artRows.length}（应为 4）`);
    assert(artRows.every((row) => row.length === 4), `字符画行宽不对：${JSON.stringify(artRows)}`);
    assert(probe.dominantColors.length > 0, '没有主色');
    const ratioSum = probe.dominantColors.reduce((sum, item) => sum + item.ratio, 0);
    assert(ratioSum <= 1.001, `主色占比之和超过 1：${ratioSum}`);
    // 编辑器视图里必有网格线与对象，纯色画面说明"渲染成功了但什么都没画出来"
    assert(probe.uniqueColors > 1, `只统计到 1 种颜色（纯色画面）：${JSON.stringify(probe.dominantColors)}`);
    assert(probe.maxLuminance > probe.minLuminance, `亮度无范围（纯色画面）：${probe.minLuminance}`);
    assert(probe.maxLuminance > 0, '画面全黑（maxLuminance = 0）');
    assert(typeof probe.nonDominantRatio === 'number' && probe.nonDominantRatio > 0,
        `画面几乎只有一种颜色（nonDominantRatio=${probe.nonDominantRatio}）：${JSON.stringify(probe.dominantColors)}`);

    return `${probe.width}x${probe.height}，${probe.uniqueColors} 色，`
        + `主色 ${probe.dominantColors[0].color} 占 ${Math.round(probe.dominantColors[0].ratio * 100)}%`;
});

await check('view.probe 可一次投影所有可渲染对象', async () =>
{
    const probe = await call('view.probe', { grid: 0, projectAll: true });
    assert(Array.isArray(probe.projected), `projected 不是数组：${JSON.stringify(Object.keys(probe))}`);
    assert(probe.projected.length > 0, '一个对象都没投影');
    assert(probe.projected.length <= 50, `一次最多 50 个，实际 ${probe.projected.length}`);
    assert(probe.projected.every((item) => typeof item.visible === 'boolean'), '缺 visible');
    assert(probe.projectedTotal >= probe.projected.length,
        `projectedTotal=${probe.projectedTotal} 应不小于返回数 ${probe.projected.length}`);
    assert(probe.projected.every((item) => item.id && item.screen), '缺 id 或 screen');

    // 两个都给会互相覆盖，直接拒绝而不是静默挑一个
    await expectFailure('view.probe', { grid: 0, project: [firstChildId], projectAll: true });

    return `一次投影 ${probe.projected.length} 个（可渲染共 ${probe.projectedTotal} 个）`;
});

await check('view.probe 支持只统计一块区域', async () =>
{
    const full = await call('view.probe', { grid: 0 });
    const corner = await call('view.probe', {
        grid: 0,
        region: { x: 0, y: 0, width: Math.floor(full.width / 4), height: Math.floor(full.height / 4) },
    });
    assert(corner.region?.width > 0 && corner.region?.height > 0, `region 未回显：${JSON.stringify(corner.region)}`);
    assert(corner.sampled > 0 && corner.sampled < full.sampled,
        `区域采样 ${corner.sampled} 应少于全幅 ${full.sampled}`);
    // 整块都在画布外要报错，而不是给一份空统计
    await expectFailure('view.probe', { grid: 0, region: { x: 99999, y: 99999, width: 10, height: 10 } });

    return `全幅 ${full.sampled} 点 → 左上 1/16 区域 ${corner.sampled} 点`;
});

await check('view.probe 能把对象投影到画面坐标', async () =>
{
    // "我加的东西在画面哪儿、看得见吗"——只看世界坐标回答不了，投影补上这一环
    const added = await call('scene.add', {
        name: 'ProjProbe', shape: 'sphere', color: { r: 1, g: 1, b: 1 }, position: { x: 3, y: 1, z: 0 },
    });
    await call('camera.focus', { objectId: added.id });
    const probe = await call('view.probe', { grid: 0, project: [added.id] });
    const item = probe.projected?.[0];
    assert(item, '没有返回 projected');
    assert(item.visible === true, `聚焦后应可见：${JSON.stringify(item)}`);
    // 聚焦就是"框住它"：投影点应当落在画面中心附近（实测偏差不到 1 像素）
    const dx = Math.abs(item.screen.x - probe.width / 2) / probe.width;
    const dy = Math.abs(item.screen.y - probe.height / 2) / probe.height;
    assert(dx < 0.05 && dy < 0.05,
        `聚焦后应靠近画面中心，实际偏差 ${(dx * 100).toFixed(1)}% / ${(dy * 100).toFixed(1)}%`);
    // 路径不存在要直接报错，而不是给一个默认坐标
    await expectFailure('view.probe', { grid: 0, project: ['/Untitled/__nope__'] });

    // 自查自清：本检查跑在写段的基线**之前**，写段末尾的统一撤销覆盖不到它
    await call('scene.remove', { objectId: added.id });
    await call('camera.setView', { preset: 'iso', objectId: '/Untitled' });

    return `screen=(${item.screen.x}, ${item.screen.y})，画面中心 (${probe.width / 2}, ${probe.height / 2})`;
});

// ---------------------------------------------------------------------------
// 写方法（测完统一撤销还原）
// ---------------------------------------------------------------------------
if (skipWrite)
{
    console.log('\n[写] 已跳过（--skip-write）');
}
else
{
    console.log('\n[写]');

    const initialHistory = await call('history.status');
    if (!initialHistory.writeEnabled)
    {
        console.log('  SKIP  写通道未启用：编辑器 URL 加 ?bridge=write 后重跑');
    }
    else
    {
        await check('scene.add 用 shape 简写', async () =>
        {
            const added = await call('scene.add', {
                name: 'SmokeBall',
                shape: 'sphere',
                color: { r: 1, g: 0, b: 0 },
                position: { x: 0, y: 0.5, z: 0 },
            });
            assert(added.id.includes('SmokeBall'), `未返回预期 id：${added.id}`);
            const detail = await call('scene.get', { objectId: added.id });
            assert(detail.components.length === 1, '组件数应为 1');
            assert(detail.components[0].params.geometry.__type__ === 'SphereGeometry', '几何类型不对');
            assert(detail.components[0].params.material, '未生成材质');

            return added.id;
        });

        await check('scene.add 未知 shape 报错', async () =>
            `已拦截：${await expectFailure('scene.add', { name: 'X', shape: 'blob' })}`);

        await check('scene.set 写入 position.y', async () =>
        {
            const target0 = (await call('scene.find', { nameContains: 'SmokeBall' })).matched[0];
            assert(target0, '找不到 SmokeBall');
            const set = await call('scene.set', { objectId: target0.id, path: 'position.y', value: 2.5 });
            assert(set.after === 2.5, `after = ${set.after}`);

            return 'before → after 正确';
        });

        await check('scene.set 拼错路径被拦截', async () =>
            `已拦截：${await expectFailure('scene.set', {
                objectId: (await call('scene.find', { nameContains: 'SmokeBall' })).matched[0].id,
                path: 'postion.y',
                value: 1,
            })}`);

        await check('scene.set 类型不匹配被拦截', async () =>
            `已拦截：${await expectFailure('scene.set', {
                objectId: (await call('scene.find', { nameContains: 'SmokeBall' })).matched[0].id,
                path: 'position.y',
                value: '1.5',
            })}`);

        await check('scene.duplicate 复制对象', async () =>
        {
            const source = (await call('scene.find', { nameContains: 'SmokeBall' })).matched[0];
            const dup = await call('scene.duplicate', { objectId: source.id, count: 2 });
            assert(dup.created.length === 2, `created = ${dup.created.length}`);

            return dup.created.join(', ');
        });

        await check('scene.group 归组与撤销', async () =>
        {
            const balls = await call('scene.find', { nameContains: 'SmokeBall' });
            assert(balls.count >= 2, `需要至少 2 个测试对象，实际 ${balls.count}`);
            const ids = balls.matched.map((item) => item.id);

            const grouped = await call('scene.group', { objectIds: ids, name: 'SmokeGroup' });
            assert(grouped.groupId.includes('SmokeGroup'), `groupId = ${grouped.groupId}`);
            const detail = await call('scene.get', { objectId: grouped.groupId });
            assert(detail.children.length === ids.length, `组内应有 ${ids.length} 个成员，实际 ${detail.children.length}`);

            // 撤销后组消失、成员回到原父级——这正是最容易写错的一步（曾因成员同时挂在两处而爆栈）
            await call('history.undo');
            const groupLeft = await call('scene.find', { nameContains: 'SmokeGroup' });
            assert(groupLeft.count === 0, '撤销后组应消失');
            const restored = await call('scene.find', { nameContains: 'SmokeBall' });
            assert(restored.count === balls.count, `撤销后成员数应恢复为 ${balls.count}，实际 ${restored.count}`);

            return `${ids.length} 个成员归入 ${grouped.groupId}，撤销可完整还原`;
        });

        await check('scene.mark / scene.rollback 试验回滚', async () =>
        {
            await call('scene.mark', { name: 'smokeTry' });
            const before = (await call('scene.summary')).objectCount;
            await call('scene.add', { name: 'RollbackProbe', shape: 'cube' });
            const after = (await call('scene.summary')).objectCount;
            assert(after === before + 1, `新增后对象数应 +1：${before} → ${after}`);

            const rolled = await call('scene.rollback', { name: 'smokeTry' });
            assert(rolled.undoneCount >= 1, `undoneCount = ${rolled.undoneCount}`);
            const restored = (await call('scene.summary')).objectCount;
            assert(restored === before, `回滚后对象数应回到 ${before}，实际 ${restored}`);

            return `标记后新增 1 个；回滚撤销 ${rolled.undoneCount} 步，对象数回到 ${restored}`;
        });

        await check('scene.batch 事务：全成或全不成', async () =>
        {
            const ok = await call('scene.batch', {
                steps: [
                    { method: 'scene.add', params: { name: 'BatchA', shape: 'cube', color: { r: 1, g: 1, b: 1 } } },
                    { method: 'scene.add', params: { name: 'BatchB', shape: 'cube', color: { r: 1, g: 1, b: 1 } } },
                    { method: 'scene.setMaterial', params: { objectId: '/Untitled/BatchA', glossiness: 60 } },
                ],
            });
            assert(ok.steps === 3, `执行了 ${ok.steps} 步`);
            const created = await call('scene.find', { nameContains: 'Batch' });
            assert(created.count === 2, `应新建 2 个对象，实际 ${created.count}`);

            // 第 2 步失败 → 第 1 步必须被回滚，场景与撤销栈都回到调用前
            const depthBefore = (await call('history.status', { labels: 0 })).undoCount;
            const failure = await expectFailure('scene.batch', {
                steps: [
                    { method: 'scene.add', params: { name: 'BatchC', shape: 'cube', color: { r: 1, g: 1, b: 1 } } },
                    { method: 'scene.remove', params: { objectId: '/Untitled/__nope__' } },
                ],
            });
            assert(failure.includes('第 2 步'), `错误信息没指出是第几步：${failure}`);
            const rolled = await call('scene.find', { nameContains: 'BatchC' });
            assert(rolled.count === 0, '失败后 BatchC 还在，回滚没生效');
            const depthAfter = (await call('history.status', { labels: 0 })).undoCount;
            assert(depthAfter === depthBefore, `撤销栈深度变了：${depthBefore} → ${depthAfter}`);

            // 只读方法、嵌套 batch、空数组都不该被接受
            await expectFailure('scene.batch', { steps: [{ method: 'editor.info' }] });
            await expectFailure('scene.batch', { steps: [{ method: 'scene.batch', params: { steps: [] } }] });
            await expectFailure('scene.batch', { steps: [] });

            return `成功路径 3 步（新建 2 个）；失败路径回滚干净，栈深仍是 ${depthAfter}`;
        });

        await check('scene.add 之后可直接摆位置', async () =>
        {
            // "先建对象、再摆位置"是 AI 最自然的一步操作：add 不带 position 时对象上也该有该字段
            const added = await call('scene.add', { name: 'PosProbe', shape: 'cube', color: { r: 1, g: 1, b: 1 } });
            const detail = await call('scene.get', { objectId: added.id });
            assert(detail.position && detail.scale, `变换字段不全：${JSON.stringify(Object.keys(detail))}`);
            assert(detail.scale.x === 1, `默认 scale 应为 1，实际 ${detail.scale.x}`);
            const moved = await call('scene.set', { objectId: added.id, path: 'position.y', value: 3 });
            assert(moved.after === 3, `写入后 after=${moved.after}（应为 3）`);
            assert(moved.before === 0, `写入前 before=${moved.before}（应为 0）`);

            return `默认 position=${JSON.stringify(detail.position)}，scale=${JSON.stringify(detail.scale)}；position.y 可直接写`;
        });

        await check('scene.add 的几何参数按形状校验', async () =>
        {
            // 新形状：圆锥（复用 CylinderGeometry 字段）与四边形面片
            const cone = await call('scene.add', {
                name: 'ConeProbe',
                shape: 'cone',
                color: { r: 1, g: 1, b: 1 },
                geometryParams: { bottomRadius: 0.6, height: 1.5, segmentsW: 16 },
            });
            const coneDetail = await call('scene.get', { objectId: cone.id });
            const coneGeometry = coneDetail.components[0].params.geometry;
            assert(coneGeometry.__type__ === 'ConeGeometry', `几何类型 ${coneGeometry.__type__}`);
            assert(coneGeometry.bottomRadius === 0.6, `bottomRadius = ${coneGeometry.bottomRadius}`);

            // 参数名必须属于该形状：引擎会静默忽略多余字段，所以这里不能放行
            await expectFailure('scene.add', {
                name: 'BadParam', shape: 'sphere', geometryParams: { radiusTop: 1 },
            });
            // 数值必须为正：负分段数与负半径一样会让几何构建出问题
            await expectFailure('scene.add', {
                name: 'BadParam', shape: 'sphere', geometryParams: { segmentsW: -4 },
            });
            // 没有参数的形状不该接受参数
            await expectFailure('scene.add', { name: 'BadParam', shape: 'quad', geometryParams: { radius: 1 } });

            return `cone 参数已生效（bottomRadius=${coneGeometry.bottomRadius}）；错误参数名 / 负数 / 无参形状的额外参数均被拦下`;
        });

        await check('scene.arrange align 支持按边界对齐', async () =>
        {
            // "贴到地面"要的是包围盒下界 = 0，中心对齐会让一半埋进地里
            const balls = await call('scene.find', { nameContains: 'SmokeBall' });
            assert(balls.count >= 2, `需要至少 2 个测试对象，实际 ${balls.count}`);
            const ids = balls.matched.map((item) => item.id);
            await call('scene.arrange', { objectIds: ids, mode: 'align', axis: 'y', value: 0, edge: 'min' });

            for (const id of ids)
            {
                const bounds = await call('scene.bounds', { objectId: id });
                assert(Math.abs(bounds.bounds.min.y) < 1e-3, `${id} 的下界 y=${bounds.bounds.min.y}，未贴到 0`);
            }
            await expectFailure('scene.arrange', { objectIds: ids, mode: 'align', axis: 'y', edge: 'sideways' });

            return `${ids.length} 个对象的包围盒下界都落到了 y=0`;
        });

        await check('projectAll 在对象超过 20 个时也能用', async () =>
        {
            // project 一次最多 20 个、projectAll 最多 50 个：两条路径的上限不同，
            // 写死一个会让其中一条在对象多时莫名失败（stress 实测抓到的）
            const base = await call('scene.add', { name: 'ManyProbe', shape: 'cube', color: { r: 1, g: 1, b: 1 } });
            await call('scene.duplicate', { objectId: base.id, count: 24, name: 'ManyProbe' });
            const probe = await call('view.probe', { grid: 0, projectAll: true });
            assert(probe.projected.length > 20, `应投影超过 20 个，实际 ${probe.projected.length}`);
            assert(probe.projectedTotal > 20, `projectedTotal = ${probe.projectedTotal}`);
            // project 仍然守着自己的 20 个上限
            await expectFailure('view.probe', {
                grid: 0,
                project: probe.projected.slice(0, 25).map((item) => item.id),
            });
            await call('scene.remove', { nameContains: 'ManyProbe' });

            return `25 个可渲染对象下 projectAll 投影 ${probe.projected.length} 个；project 仍拒绝 25 个`;
        });

        await check('scene.setFields 原子写多字段', async () =>
        {
            const added = await call('scene.add', { name: 'FieldsProbe', shape: 'cube', color: { r: 1, g: 1, b: 1 } });
            const depthBefore = (await call('history.status', { labels: 0 })).undoCount;
            const result = await call('scene.setFields', {
                objectId: added.id,
                fields: { 'position.y': 2, 'scale.x': 3, 'rotation.z': 0.5 },
            });
            assert(result.updated.length === 3, `updated = ${result.updated.length}`);
            // 三个字段只占一个撤销步
            const depthAfter = (await call('history.status', { labels: 0 })).undoCount;
            assert(depthAfter === depthBefore + 1, `应只加一步：${depthBefore} → ${depthAfter}`);

            // 撤销后三个字段一起回来
            await call('history.undo');
            const back = await call('scene.get', { objectId: added.id });
            assert(back.position.y === 0 && back.scale.x === 1 && back.rotation.z === 0,
                `撤销不干净：y=${back.position.y} scaleX=${back.scale.x} rotZ=${back.rotation.z}`);
            await call('history.redo');

            // 其中一个字段非法 → 整体不落笔（只改了另一个字段是不能接受的）
            await expectFailure('scene.setFields', { objectId: added.id, fields: { 'position.y': 5, 'scale.x': 'big' } });
            const after = await call('scene.get', { objectId: added.id });
            assert(after.position.y === 2, `失败的那次却改了值：position.y=${after.position.y}`);

            return '3 个字段一次写入、只占一步撤销、失败整体不落笔';
        });

        await check('scene.setMany 批量写并原子失败', async () =>
        {
            const balls = await call('scene.find', { nameContains: 'SmokeBall', includeTransform: true });
            assert(balls.count >= 1, '测试对象不足');
            const ids = balls.matched.map((item) => item.id);
            const many = await call('scene.setMany', {
                objectIds: ids,
                path: 'components[0].material.uniforms.u_diffuse',
                value: { __type__: 'Color4', r: 0, g: 0, b: 1, a: 1 },
            });
            assert(many.updated === ids.length, `updated = ${many.updated}`);
            const failure = await expectFailure('scene.setMany', { objectIds: [...ids, '/Untitled/__nope__'], path: 'position.y', value: 9 });

            return `${many.updated} 个已改；混入坏 id 时整体失败（${failure.slice(0, 30)}…）`;
        });

        await check('scene.setEnvironment 背景与环境光', async () =>
        {
            const env = await call('scene.setEnvironment', { background: { r: 0.1, g: 0.2, b: 0.3 } });
            assert(env.updated.length >= 1, 'updated 为空');
            // 颜色必须被补全为合法的 Color4：缺 __type__ 或 a 会让清屏 clearValue 变成非有限值
            assert(env.set.background.__type__ === 'Color4', '未补全 __type__');
            assert(typeof env.set.background.a === 'number', '未补全 a 分量');
            await expectFailure('scene.setEnvironment', {});

            return `写入 ${env.updated.join(' + ')}；空参数被拦截`;
        });

        await check('setEnvironment 真的改变画面（像素闭环）', async () =>
        {
            // 这条是"数据改了、画面也得改"的闭环：只改数据不改画面，光看返回值永远发现不了
            await call('scene.setEnvironment', { background: { r: 0, g: 0, b: 0 } });
            const dark = await call('view.probe', { grid: 0 });
            await call('scene.setEnvironment', { background: { r: 1, g: 1, b: 1 } });
            const light = await call('view.probe', { grid: 0 });
            assert(light.meanLuminance > dark.meanLuminance + 0.1,
                `换成白背景后画面没变亮：${dark.meanLuminance} → ${light.meanLuminance}`);
            // 还原成暗背景，避免影响后续检查的画面判据
            await call('scene.setEnvironment', { background: { r: 0.1, g: 0.2, b: 0.3 } });

            return `黑背景亮度 ${dark.meanLuminance} → 白背景 ${light.meanLuminance}`;
        });

        await check('scene.add 可设 tag 并按其检索', async () =>
        {
            // scene.find 支持按 tag 查，但原先没有任何办法通过桥接**设置** tag——闭环缺口
            const added = await call('scene.add', {
                name: 'TagProbe', shape: 'cube', color: { r: 1, g: 1, b: 1 }, tag: 'ai-made',
            });
            const found = await call('scene.find', { tag: 'ai-made' });
            assert(found.count >= 1, '按 tag 查不到刚建的对象');
            assert(found.matched.some((item) => item.id === added.id), `结果里没有 ${added.id}`);
            const detail = await call('scene.get', { objectId: added.id });
            assert(detail.tag === 'ai-made', `tag = ${detail.tag}`);

            return `tag=ai-made 可设可查（匹配 ${found.count} 个）`;
        });

        await check('scene.add 可一次给全材质细节', async () =>
        {
            // 省掉"先 add、再 setMaterial"这一步；字段映射与 setMaterial 共用同一份
            await call('scene.add', {
                name: 'MatInline', shape: 'sphere', color: { r: 0.2, g: 0.4, b: 0.8 }, glossiness: 80, reflectivity: 0.3,
            });
            const found = await call('scene.find', {
                name: 'MatInline',
                where: { path: 'components[0].material.uniforms.u_glossiness', op: 'eq', value: 80 },
            });
            assert(found.count === 1, `按 u_glossiness=80 查不到（count=${found.count}）`);
            const reflect = await call('scene.find', {
                name: 'MatInline',
                where: { path: 'components[0].material.uniforms.u_reflectivity', op: 'eq', value: 0.3 },
            });
            assert(reflect.count === 1, `按 u_reflectivity=0.3 查不到`);
            // 非法数值要拦住
            await expectFailure('scene.add', { name: 'BadMat', shape: 'cube', glossiness: 'high' });

            return 'u_glossiness=80、u_reflectivity=0.3 一次写入；非法值被拦下';
        });

        await check('scene.duplicate 支持相对偏移', async () =>
        {
            // "在旁边再放两个"用相对偏移表达最自然，不必自己算绝对坐标
            const base = await call('scene.add', {
                name: 'OffsetBase', shape: 'cube', color: { r: 1, g: 1, b: 1 }, position: { x: 0, y: 0, z: 0 },
            });
            await call('scene.duplicate', { objectId: base.id, count: 2, name: 'OffsetCopy', offset: { x: 2, y: 1 } });
            const first = await call('scene.get', { objectId: '/Untitled/OffsetCopy1' });
            const second = await call('scene.get', { objectId: '/Untitled/OffsetCopy2' });
            assert(first.position.x === 2 && first.position.y === 1, `第 1 个副本 ${JSON.stringify(first.position)}`);
            assert(second.position.x === 4 && second.position.y === 2, `第 2 个副本 ${JSON.stringify(second.position)}`);
            // 非法偏移要拦住
            await expectFailure('scene.duplicate', { objectId: base.id, offset: { x: 1e39 } });

            return `偏移按 (i+1) 倍递增：${JSON.stringify(first.position)} / ${JSON.stringify(second.position)}`;
        });

        await check('scene.arrange align 可指定目标坐标', async () =>
        {
            // "把这一排都放到 y=0"用一次调用就能表达，不必逐个 scene.set
            const balls = await call('scene.find', { nameContains: 'SmokeBall' });
            assert(balls.count >= 2, `需要至少 2 个测试对象，实际 ${balls.count}`);
            const moved = await call('scene.arrange', {
                objectIds: balls.matched.map((item) => item.id),
                mode: 'align',
                axis: 'y',
                value: 0,
            });
            assert(moved.values.length === balls.count, `写了 ${moved.values.length} 个分量`);

            const after = await call('scene.find', { nameContains: 'SmokeBall', includeTransform: true });
            for (const item of after.matched)
            {
                assert(Math.abs(item.position.y) < 1e-6, `${item.id} 的 y=${item.position.y}`);
            }
            // 非法坐标要拦住（f32 溢出会让对象消失）
            await expectFailure('scene.arrange', { objectIds: balls.matched.map((i) => i.id), mode: 'align', axis: 'y', value: 1e39 });

            return `${after.count} 个对象对齐到 y=0；非法 value 被拦下`;
        });

        await check('scene.arrange 等间距排列', async () =>
        {
            const balls = await call('scene.find', { nameContains: 'SmokeBall' });
            assert(balls.count >= 2, `需要至少 2 个测试对象，实际 ${balls.count}`);
            const arranged = await call('scene.arrange', {
                objectIds: balls.matched.map((item) => item.id),
                axis: 'z',
                mode: 'line',
                spacing: 2,
            });
            const values = arranged.values;
            for (let i = 1; i < values.length; i++)
            {
                const gap = Math.abs(values[i] - values[i - 1]);
                assert(Math.abs(gap - 2) < 0.01, `第 ${i} 段间距 ${gap} ≠ 2`);
            }

            return `间距均为 2：${values.join(' / ')}`;
        });

        await check('scene.arrange circle 圆周分布', async () =>
        {
            const balls = await call('scene.find', { nameContains: 'SmokeBall' });
            assert(balls.count >= 3, `需要至少 3 个测试对象，实际 ${balls.count}`);
            const arranged = await call('scene.arrange', {
                objectIds: balls.matched.map((item) => item.id),
                mode: 'circle',
                axis: 'y',
                radius: 3,
            });
            // circle 模式每个对象写三个轴：平面上的两个轴 + 法线方向（对齐到圆心所在高度）
            assert(arranged.values.length === balls.count * 3, `应有 ${balls.count * 3} 个分量，实际 ${arranged.values.length}`);

            return `${balls.count} 个对象按半径 3 分布到水平圆周上`;
        });

        await check('scene.reparent 与防环', async () =>
        {
            const balls = await call('scene.find', { nameContains: 'SmokeBall' });
            const [a, b] = balls.matched;
            if (!a || !b) return '测试对象不足，跳过';

            const moved = await call('scene.reparent', { objectId: a.id, parentId: b.id });
            assert(moved.to === b.id, 'to 不一致');
            const blocked = await expectFailure('scene.reparent', { objectId: b.id, parentId: moved.newId });
            await call('scene.reparent', { objectId: moved.newId, parentId: '/Untitled' });

            return `可移动；防环生效（${blocked.slice(0, 30)}…）`;
        });

        await check('scene.remove 批量删除', async () =>
        {
            const balls = await call('scene.find', { nameContains: 'SmokeBall' });
            assert(balls.count > 0, '没有可删对象');
            const removed = await call('scene.remove', { objectIds: balls.matched.map((item) => item.id) });
            assert(removed.count === balls.count, `removed = ${removed.count}`);
            const after = await call('scene.find', { nameContains: 'SmokeBall' });
            assert(after.count === 0, `仍有 ${after.count} 个残留`);

            return `删除 ${removed.count} 个`;
        });

        // ---- 边界：这些调用都该被拦住，而不是静默做错事 ----
        await check('scene.setMaterial 设置材质外观', async () =>
        {
            // 自带临时对象，避免依赖前面用例留下的东西（它们可能已被删除）
            const added = await call('scene.add', { name: 'MatProbe', shape: 'sphere', color: { r: 1, g: 1, b: 1 } });
            const applied = await call('scene.setMaterial', {
                objectId: added.id,
                color: { r: 0.9, g: 0.8, b: 0.2 },
                glossiness: 90,
            });
            assert(applied.applied.glossiness === 90, `glossiness = ${applied.applied.glossiness}`);

            const detail = await call('scene.get', { objectId: added.id });
            const material = detail.components[0].params.material;
            assert(material.uniforms.u_glossiness === 90, `u_glossiness = ${material.uniforms.u_glossiness}`);
            assert(material.uniforms.u_diffuse.r === 0.9, 'u_diffuse 未写入');

            await call('scene.remove', { objectId: added.id });

            return `color + glossiness 已写入 ${added.id}`;
        });

        await check('边界：场景根不可删 / 不可移 / 不可归组', async () =>
        {
            const messages = [];
            for (const [method, params] of [
                ['scene.remove', { objectId: '/Untitled' }],
                ['scene.reparent', { objectId: '/Untitled', parentId: '/Untitled/Plane' }],
                ['scene.group', { objectIds: ['/Untitled'] }],
            ])
            {
                messages.push((await expectFailure(method, params)).slice(0, 22));
            }

            return messages.join(' / ');
        });

        await check('边界：非法参数被拦住', async () =>
        {
            const cases = [
                ['scene.arrange', { objectIds: ['/Untitled/Plane'], mode: 'line' }],
                ['scene.arrange', { objectIds: ['/Untitled/Plane', '/Untitled/Sphere'], mode: 'blob' }],
                ['scene.setMany', { objectIds: [], path: 'position.y', value: 1 }],
                ['scene.group', { objectIds: [] }],
                ['scene.rollback', { name: '__no_such_mark__' }],
            ];
            for (const [method, params] of cases) await expectFailure(method, params);

            return `${cases.length} 项均被拦住`;
        });

        await check('边界：类型与数值防呆', async () =>
        {
            const cases = [
                // 对象与原始类型不能互转：把 position 设成字符串会让渲染直接崩
                ['scene.set', { objectId: '/Untitled/Plane', path: 'position', value: 'not-an-object' }],
                // 数字字段写字符串：JSON 传不了 NaN/Infinity（会被序列化成 null），
                // 真正能从外部传进来的"坏数值"就是这种类型不符
                ['scene.set', { objectId: '/Untitled/Plane', path: 'position.y', value: '0.5' }],
                ['scene.setMaterial', { objectId: '/Untitled/Plane', glossiness: 'high' }],
                // 负半径几何会让渲染栈溢出（实测把整页卡死）
                ['scene.add', { name: 'BadGeo', shape: 'sphere', geometryParams: { radius: -1 } }],
                ['scene.add', { name: 'BadGeo', shape: 'sphere', geometryParams: { radius: 'big' } }],
            ];
            for (const [method, params] of cases) await expectFailure(method, params);

            return `${cases.length} 项均被拦住`;
        });

        await check('边界：重复项被拦住', async () =>
        {
            // 自带对象：前面用例可能已经把 SmokeBall 删掉了
            const added = await call('scene.add', { name: 'DupProbe', shape: 'cube', color: { r: 1, g: 1, b: 1 } });
            // 重复项会让同一对象被移进组两次 / 撤销时插回两次，场景树随即损坏
            await expectFailure('scene.group', { objectIds: [added.id, added.id] });
            await expectFailure('scene.remove', { objectIds: [added.id, added.id] });
            // 这三个批量方法若重复，写入与撤销会各作用两次——撤销后回不到原值
            await expectFailure('scene.setMany', { objectIds: [added.id, added.id], path: 'position.y', value: 1 });
            await expectFailure('scene.arrange', { objectIds: [added.id, added.id], mode: 'line' });
            await expectFailure('scene.setMaterial', { objectIds: [added.id, added.id], glossiness: 50 });
            await call('scene.remove', { objectId: added.id });

            return 'group / remove / setMany / arrange / setMaterial 都拒绝了重复对象';
        });

        await check('history.status 的 labels 有上限', async () =>
        {
            // 两百个对象的场景里全量标签会让每次调用多出几百个字符串，必须有上限
            const none = await call('history.status', { labels: 0 });
            assert(none.labels === undefined, 'labels: 0 仍返回了标签');
            assert(none.undoCount > 0, '此处撤销栈应非空');
            assert(typeof none.limit === 'number' && none.limit >= 100, `limit = ${none.limit}`);
            // 当前打过哪些标记：AI 隔几步就忘了自己标过什么
            assert(Array.isArray(none.marks), `缺 marks：${JSON.stringify(Object.keys(none))}`);
            const two = await call('history.status', { labels: 2 });
            assert(two.labels?.length === 2, `labels: 2 返回了 ${two.labels?.length} 条`);
            const auto = await call('history.status');
            assert(auto.labels?.length <= 20, `默认返回了 ${auto.labels?.length} 条（应 ≤ 20）`);

            return `栈深 ${auto.undoCount}，默认只给最近 ${auto.labels.length} 条，上限 ${auto.limit}`;
        });

        await check('写操作自动带上本次新增报错（正常写法应为空）', async () =>
        {
            // 桥接调用成功 ≠ 场景没问题：把"改完必须查日志"变成返回体的一部分
            const clean = await call('scene.set', { objectId: '/Untitled/Plane', path: 'position.y', value: 0 });
            assert(clean.newLogErrors === undefined, `正常写操作却报告了报错：${JSON.stringify(clean.newLogErrors)}`);

            return '未出现 newLogErrors';
        });

        await check('scene.validate 能发现纯黑材质', async () =>
        {
            // 黑物体在深色背景下就是"看不见"，且不会有任何报错——正是体检该抓的东西
            const before = await call('scene.validate');
            assert(!before.issues.some((issue) => issue.code === 'black-material'), '测试前就有黑材质，判据不成立');
            const added = await call('scene.add', { name: 'BlackProbe', shape: 'cube', color: { r: 0, g: 0, b: 0 } });
            const after = await call('scene.validate');
            const hits = after.issues.filter((issue) => issue.code === 'black-material');
            assert(hits.length >= 1, '没有报出 black-material');
            assert(hits.some((issue) => issue.objectId === added.id), `报的不是新对象：${JSON.stringify(hits)}`);

            return `报出 ${hits.length} 个：${hits[0].objectId}`;
        });

        await check('scene.batch dryRun 预演后场景不变', async () =>
        {
            const before = await call('scene.summary');
            const historyBefore = await call('history.status', { labels: 0 });
            const depthBefore = historyBefore.undoCount;
            const redoBefore = historyBefore.redoCount;
            const preview = await call('scene.batch', {
                dryRun: true,
                steps: [
                    { method: 'scene.add', params: { name: 'PreviewA', shape: 'cube', color: { r: 1, g: 1, b: 1 } } },
                    { method: 'scene.add', params: { name: 'PreviewB', shape: 'sphere', color: { r: 1, g: 1, b: 1 } } },
                    { method: 'scene.setMaterial', params: { objectId: '/Untitled/PreviewA', glossiness: 30 } },
                ],
            });
            assert(preview.dryRun === true, '返回里没有 dryRun 标记');
            assert(preview.results.length === 3, `预演了 ${preview.results.length} 步`);
            assert(preview.results[0].id === '/Untitled/PreviewA', `预演给出的 id 是 ${preview.results[0].id}`);

            const after = await call('scene.summary');
            assert(after.objectCount === before.objectCount,
                `预演改变了对象数：${before.objectCount} → ${after.objectCount}`);
            const historyAfter = await call('history.status', { labels: 0 });
            assert(historyAfter.undoCount === depthBefore,
                `预演改变了撤销栈深度：${depthBefore} → ${historyAfter.undoCount}`);
            // 重做栈也必须没变化：预演的命令若落进重做栈，一次 history.redo 就把它变成真实写入
            assert(historyAfter.redoCount === redoBefore,
                `预演改变了重做栈：${redoBefore} → ${historyAfter.redoCount}`);
            const leftover = await call('scene.find', { nameContains: 'Preview' });
            assert(leftover.count === 0, `预演留下了 ${leftover.count} 个对象`);

            return `预演 ${preview.steps} 步并全部回滚；对象数与撤销栈深度均未变`;
        });

        await check('dryRun 之后 history.redo 不会把预演变成真实写入', async () =>
        {
            const added = await call('scene.add', {
                name: 'DryRunProbe', shape: 'cube', position: { x: 0, y: 1, z: 0 },
            });
            const historyBefore = await call('history.status', { labels: 0 });

            await call('scene.set', { objectId: added.id, path: 'position.y', value: 7, dryRun: true });

            const afterDry = await call('history.status', { labels: 0 });
            assert(afterDry.undoCount === historyBefore.undoCount,
                `预演改了撤销栈：${historyBefore.undoCount} → ${afterDry.undoCount}`);
            assert(afterDry.redoCount === historyBefore.redoCount,
                `预演把命令留进了重做栈：${historyBefore.redoCount} → ${afterDry.redoCount}`);
            assert((await call('scene.get', { objectId: added.id })).position.y === 1, '预演后位置已被改动');

            // 预演之后按一次重做：曾因预演命令留在重做栈里，这一步会把它真的执行掉
            if (afterDry.redoCount > 0) await call('history.redo', { count: 1 });
            const y = (await call('scene.get', { objectId: added.id })).position.y;
            assert(y === 1, `预演被 history.redo 变成了真实写入：position.y = ${y}`);

            return `预演后 redoCount 保持 ${afterDry.redoCount}，position.y 仍是 1`;
        });

        await check('scene.batch 拒绝不能回滚的方法', async () =>
        {
            const sentinel = await call('scene.add', { name: 'BatchGuardSentinel', shape: 'cube' });

            // history.undo 会把撤销栈弄**短**，scene.save / log.clear 的效果根本不在栈上——
            // 放进事务里，"失败即回到调用前"就成了空话：曾报"已回滚 0 步"，而它前面那步的
            // 撤销已经生效、哨兵对象已经消失
            const reason = await expectFailure('scene.batch', {
                steps: [
                    { method: 'history.undo' },
                    { method: 'scene.set', params: { objectId: '/Untitled/__nope__', path: 'position.y', value: 1 } },
                ],
            });
            const found = await call('scene.find', { name: 'BatchGuardSentinel' });
            assert(found.count === 1, `哨兵对象被 batch 里的 history.undo 撤掉了（${reason}）`);
            await call('scene.remove', { objectId: sentinel.id });

            return `已拒绝：${reason.slice(0, 36)}`;
        });

        await check('scene.group 拒绝把组挂到成员自己或后代下', async () =>
        {
            const root = await call('scene.add', { name: 'CycleRoot', shape: 'cube' });
            const child = await call('scene.add', { name: 'CycleChild', shape: 'cube', parentId: root.id });

            // 成环后遍历爆栈、页面卡死，而且事后**修不回来**（reparent 的防环检查会拒掉修复尝试），
            // 所以在建组这一步就要拦住——reparent 一直有这道检查，group 曾漏掉
            const selfReason = await expectFailure('scene.group', { objectIds: [root.id], parentId: root.id });
            const childReason = await expectFailure('scene.group', { objectIds: [root.id], parentId: child.id });

            const stillThere = await call('scene.find', { namePattern: '^Cycle(Root|Child)$' });
            assert(stillThere.count === 2, `成环尝试留下了 ${stillThere.count} 个对象（预期 2）`);

            return `已拒绝自身（${selfReason.slice(0, 20)}）与后代（${childReason.slice(0, 20)}）`;
        });

        await check('scene.find 排序作用在全部命中上', async () =>
        {
            await call('scene.batch', {
                steps: [0, 1, 2].map((i) => ({
                    method: 'scene.add',
                    params: { name: `SortProbe${i}`, shape: 'cube', position: { x: 30, y: i, z: 0 } },
                })),
            });
            // 先收集满 limit 个再排序时，desc 会返回**最低**的那个（实测 12 个对象上给了 y=2,1,0）
            const top = await call('scene.find', {
                namePattern: '^SortProbe', sortBy: 'position.y', order: 'desc', limit: 1, includeTransform: true,
            });
            assert(top.matched.length === 1, `只该返回 1 个，实际 ${top.matched.length}`);
            assert(top.matched[0].position.y === 2,
                `desc 应取最高的（y=2），实际 y=${top.matched[0].position.y}`);

            // 拼错的排序轴要报错，而不是每个键都取 0、静默按"没排序"返回
            await expectFailure('scene.find', { namePattern: '^SortProbe', sortBy: 'position.zzz' });

            return `desc + limit=1 取到 y=${top.matched[0].position.y}（共命中 ${top.total} 个）`;
        });

        await check('scene.set 拒绝 null', async () =>
        {
            const probe = await call('scene.add', { name: 'NullProbe', shape: 'cube', position: { x: 0, y: 1, z: 0 } });

            // null / undefined 的 primitiveTypeOf 都是 null，会让类型比对整段跳过；
            // 实测 position.y = null 被接受，写进变换后矩阵变 NaN、对象从画面消失
            const reason = await expectFailure('scene.set', { objectId: probe.id, path: 'position.y', value: null });
            const y = (await call('scene.get', { objectId: probe.id })).position.y;
            assert(y === 1, `position.y 被改成了 ${JSON.stringify(y)}`);

            return `已拒绝：${reason.slice(0, 40)}`;
        });

        await check('scene.validate 报出视野外的对象', async () =>
        {
            // 先把镜头对准场景：否则相机还停在很远的地方，x=5000 也可能在视野内，
            // 这条检查就变成了"看相机当时在哪"（新开的页面里会误报）
            await call('camera.setView', { preset: 'iso', objectId: '/Untitled' });
            // "为什么看不到"最常见的原因就是不在视野里——数据上完全看不出来，体检该说出来
            const added = await call('scene.add', {
                name: 'FarProbe', shape: 'cube', color: { r: 1, g: 1, b: 1 }, position: { x: 5000, y: 0, z: 0 },
            });
            const report = await call('scene.validate');
            const hit = report.issues.filter((issue) => issue.code === 'outside-view');
            assert(hit.length === 1, `应汇总为一条 outside-view，实际 ${hit.length} 条`);
            assert(hit[0].message.includes(added.id), `没提到新对象：${hit[0].message}`);

            // 聚焦之后它就不再"在视野外"了（同一个判据两头都对得上）
            await call('camera.focus', { objectId: added.id });
            const focused = await call('scene.validate');
            const stillOutside = focused.issues.filter((issue) => issue.code === 'outside-view' && issue.message.includes(added.id));
            assert(stillOutside.length === 0, `聚焦后仍被判为视野外：${stillOutside[0]?.message}`);
            await call('camera.setView', { preset: 'iso', objectId: '/Untitled' });

            return hit[0].message.slice(0, 56);
        });

        await check('scene.validate 报出完全重叠的对象', async () =>
        {
            // "复制之后忘了挪开"是最常见的重叠来源：其中一个永远看不见，数据上却毫无异常。
            // 注意消息只列前几对，所以这里比对**对数**而不是看有没有提到自己
            const parsePairs = (report) =>
            {
                const issue = report.issues.find((item) => item.code === 'overlapping');

                return issue ? Number((issue.message.match(/^(\d+) 对/) ?? [0, 0])[1]) : 0;
            };
            const before = parsePairs(await call('scene.validate'));
            const base = await call('scene.add', {
                name: 'OverlapBase', shape: 'cube', color: { r: 1, g: 1, b: 1 }, position: { x: 100, y: 0, z: 100 },
            });
            await call('scene.duplicate', {
                objectId: base.id, count: 1, name: 'OverlapCopy', position: { x: 100, y: 0, z: 100 },
            });
            const report = await call('scene.validate');
            const after = parsePairs(report);
            assert(after > before, `重叠对数没有增加：${before} → ${after}`);
            assert(report.issues.filter((item) => item.code === 'overlapping').length === 1,
                '重叠问题应汇总为一条，而不是逐对刷屏');

            return `重叠对数 ${before} → ${after}（每对都是"其中一个看不见"）`;
        });

        await check('写方法统一支持 dryRun 预演', async () =>
        {
            const depthBefore = (await call('history.status', { labels: 0 })).undoCount;
            const preview = await call('scene.set', {
                objectId: '/Untitled/Plane', path: 'position.y', value: 42, dryRun: true,
            });
            assert(preview.dryRun === true, '返回里没有 dryRun 标记');
            assert(preview.result?.after === 42, `预演结果应含 after=42：${JSON.stringify(preview.result)}`);

            // 场景与撤销栈都必须回到调用前
            const depthAfter = (await call('history.status', { labels: 0 })).undoCount;
            assert(depthAfter === depthBefore, `预演改变了撤销栈：${depthBefore} → ${depthAfter}`);
            const plane = await call('scene.get', { objectId: '/Untitled/Plane' });
            assert(plane.position.y !== 42, `预演真的落笔了：position.y=${plane.position.y}`);

            // 效果不进撤销栈的方法要明确拒绝，而不是"预演"完却真的生效了
            await expectFailure('log.clear', { dryRun: true });
            await expectFailure('scene.save', { dryRun: true });

            return `scene.set 预演 after=42 且未落笔；log.clear / scene.save 明确拒绝`;
        });

        await check('scene.add 的对象可直接隐藏/显示', async () =>
        {
            const added = await call('scene.add', {
                name: 'ActiveProbe', shape: 'sphere', color: { r: 1, g: 1, b: 1 }, position: { x: 0, y: 5, z: 0 },
            });
            const detail = await call('scene.get', { objectId: added.id });
            assert(detail.activeSelf === true, `新增对象默认应为 true，实际 ${detail.activeSelf}`);

            // 关掉：数据字段可写，也能按它检索（"哪些被隐藏了"）
            await call('scene.set', { objectId: added.id, path: 'activeSelf', value: false });
            const hidden = await call('scene.find', { where: { path: 'activeSelf', op: 'eq', value: false } });
            assert(hidden.total >= 1, '按 activeSelf=false 查不到被隐藏的对象');
            const after = await call('scene.get', { objectId: added.id });
            assert(after.activeSelf === false, `关闭失败：activeSelf=${after.activeSelf}`);

            // 关掉的对象：仍在视锥内，但"看得见"必须为 false（只报视锥会误导）
            await call('camera.focus', { objectId: added.id });
            const probe = await call('view.probe', { grid: 0, project: [added.id] });
            const projected = probe.projected[0];
            assert(projected.inFrustum === true, `聚焦后应在视锥内：${JSON.stringify(projected)}`);
            assert(projected.active === false, `active 应为 false：${JSON.stringify(projected)}`);
            assert(projected.visible === false, `被隐藏的对象不该报成可见：${JSON.stringify(projected)}`);
            await call('camera.setView', { preset: 'iso', objectId: '/Untitled' });

            // 也能一次建出隐藏对象
            const born = await call('scene.add', { name: 'BornHidden', shape: 'cube', color: { r: 1, g: 1, b: 1 }, activeSelf: false });
            assert((await call('scene.get', { objectId: born.id })).activeSelf === false, 'activeSelf: false 未生效');

            return '默认 true、可关掉并按其检索，也能一次建出隐藏对象';
        });

        await check('scene.remove 支持按选择器批量删除', async () =>
        {
            await call('scene.add', { name: 'TempA', shape: 'cube', color: { r: 1, g: 1, b: 1 } });
            await call('scene.add', { name: 'TempB', shape: 'cube', color: { r: 1, g: 1, b: 1 } });
            await call('scene.add', { name: 'KeepC', shape: 'cube', color: { r: 1, g: 1, b: 1 } });
            assert((await call('scene.find', { nameContains: 'Temp' })).total >= 2, '测试对象没建够');

            const removed = await call('scene.remove', { nameContains: 'Temp' });
            assert(removed.count >= 2, `只删了 ${removed.count} 个`);
            assert((await call('scene.find', { nameContains: 'Temp' })).total === 0, '还有 Temp 残留');
            assert((await call('scene.find', { nameContains: 'KeepC' })).total === 1, 'KeepC 被误删');
            // 名字匹配到场景根时要拦住（否则整批都会失败）
            await expectFailure('scene.remove', { nameContains: 'Untitled' });
            // 选择器没匹配到任何对象时明确报错
            await expectFailure('scene.remove', { nameContains: '__不存在的名字__' });

            return `按 nameContains 删掉 ${removed.count} 个，未误删其它，场景根与空匹配都被拦`;
        });

        await check('history.undo / redo 支持一次多步', async () =>
        {
            await call('scene.add', { name: 'UndoA', shape: 'cube', color: { r: 1, g: 1, b: 1 } });
            await call('scene.add', { name: 'UndoB', shape: 'cube', color: { r: 1, g: 1, b: 1 } });
            await call('scene.add', { name: 'UndoC', shape: 'cube', color: { r: 1, g: 1, b: 1 } });
            const depth = (await call('history.status', { labels: 0 })).undoCount;

            const undone = await call('history.undo', { count: 3 });
            assert(undone.undoneCount === 3, `只退了 ${undone.undoneCount} 步`);
            assert(undone.labels?.length === 3, `labels = ${JSON.stringify(undone.labels)}`);
            assert((await call('history.status', { labels: 0 })).undoCount === depth - 3, '栈深不对');
            assert((await call('scene.find', { nameContains: 'Undo' })).total === 0, '还有 Undo 对象残留');

            const redone = await call('history.redo', { count: 3 });
            assert(redone.redoneCount === 3, `只重做了 ${redone.redoneCount} 步`);
            assert((await call('scene.find', { nameContains: 'Undo' })).total === 3, '重做没恢复');

            // 非法步数要拦住
            await expectFailure('history.undo', { count: 0 });

            return `一次退 3 步、一次重做 3 步：${undone.labels.join('、')}`;
        });

        await check('scene.import 能把导出数据放回来', async () =>
        {
            // 与 export 配对：导出的东西要能放回来（含子树），否则"导出复用"只完成一半
            const parent = await call('scene.add', { name: 'ImpParent', shape: 'cube', color: { r: 1, g: 1, b: 1 } });
            const child = await call('scene.add', {
                parentId: parent.id, name: 'ImpChild', shape: 'sphere', color: { r: 0, g: 1, b: 0 },
            });
            const exported = await call('scene.export', { objectId: parent.id });
            // 子树确实在导出结果里
            assert(exported.data.children?.length === 1, `导出结果应含 1 个子对象：${JSON.stringify(exported.data.children)}`);

            const imported = await call('scene.import', { data: exported.data });
            assert(imported.imported === 1, `imported = ${imported.imported}`);
            const back = await call('scene.get', { objectId: imported.ids[0] });
            assert(back.name === 'ImpParent', `名字不对：${back.name}`);
            assert(back.children?.length === 1, `子树没带回来：${JSON.stringify(back.children)}`);
            assert(back.children[0].name === 'ImpChild', `子对象名字不对：${back.children[0].name}`);

            // 撤销要把整棵子树移除
            await call('history.undo');
            await expectFailure('scene.get', { objectId: imported.ids[0] });
            await call('history.redo');
            assert((await call('scene.find', { nameContains: 'ImpParent' })).total === 2, '重做后应有两个 ImpParent');

            // 非法输入
            await expectFailure('scene.import', { data: '{}' });
            await expectFailure('scene.import', { data: [] });

            return `含子树的导出数据可放回（${back.children.length} 个子对象），撤销/重做对称`;
        });

        // 统一还原：把所有写操作撤销回初始状态，场景内容与跑测试前完全一致
        await check('history.undo 还原全部写操作', async () =>
        {
            let status = await call('history.status');
            let guard = 0;
            // 上限给足：检查项多了之后，从几十步撤回基线是正常的（原先 50 步会提前停下，
            // 表现为"撤销后 undoCount = 8，期望 5"这种看起来像漏撤的失败）
            while (status.undoCount > initialHistory.undoCount && guard++ < 200)
            {
                await call('history.undo');
                status = await call('history.status');
            }
            assert(status.undoCount === initialHistory.undoCount, `撤销后 undoCount = ${status.undoCount}，期望 ${initialHistory.undoCount}`);
            const nowSummary = await call('scene.summary');
            assert(nowSummary.objectCount === sceneObjectCount, `对象数未还原：${nowSummary.objectCount} ≠ ${sceneObjectCount}`);

            return `回到 ${status.undoCount} 步，对象数 ${nowSummary.objectCount}`;
        });

        await check('history.redo 可重做', async () =>
        {
            const redone = await call('history.redo');
            assert(redone.redone, '没有可重做的操作');
            await call('history.undo');

            return redone.redone;
        });

        await check('scene.save 写回存储', async () =>
        {
            const saved = await call('scene.save');

            return `${saved.saved}（${saved.childCount} 个子对象）`;
        });

        await check('log.tail 支持正则过滤', async () =>
{
    const all = await call('log.tail', { limit: 200 });
    if (all.total === 0) return '日志为空，跳过（不影响其它结论）';

    // 拿真实日志做样本：正则匹配应当至少命中这一条
    const sample = all.entries[all.entries.length - 1].message.slice(0, 6);
    const escaped = sample.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const byRegex = await call('log.tail', { limit: 200, grepRegex: escaped });
    assert(byRegex.total >= 1, `正则 ${escaped} 没匹配到任何日志`);
    // 非法正则要报错，而不是静默返回全部或空
    await expectFailure('log.tail', { grepRegex: '[' });

    return `正则 ${escaped} 匹配 ${byRegex.total} 条；非法正则被拦下`;
});

await check('log.clear 清空日志', async () =>
        {
            const cleared = await call('log.clear');
            const after = await call('log.tail', { limit: 1 });

            return `清掉 ${cleared.cleared} 条，剩余 ${after.total}`;
        });
    }
}

// ---------------------------------------------------------------------------
// 汇总
// ---------------------------------------------------------------------------
const failed = results.filter((item) => !item.ok);
console.log(`\n共 ${results.length} 项：通过 ${results.length - failed.length}，失败 ${failed.length}`);
for (const item of failed) console.log(`  FAIL  ${item.name} — ${item.message}`);

process.exit(failed.length === 0 ? 0 : 1);
