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
    assert(info.methods.includes('view.screenshot'), 'methods 缺 view.screenshot');
    assert(typeof info.writeEnabled === 'boolean', '缺 writeEnabled');

    return `${info.sceneName}，${info.methods.length} 个方法，写通道${info.writeEnabled ? '已启用' : '未启用'}`;
});

const summary = await call('scene.summary');
sceneObjectCount = summary.objectCount;
await check('scene.summary 对象数 > 0', () =>
{
    assert(summary.objectCount > 0, `objectCount = ${summary.objectCount}`);
    assert(summary.rootId, '缺 rootId');

    return `${summary.objectCount} 个对象 / ${summary.componentCount} 个组件`;
});

let firstChildId = summary.children?.[0]?.id ?? null;
await check('scene.list 能展开根', async () =>
{
    const listed = await call('scene.list', { depth: 1 });
    assert(listed.node, '缺 node');
    assert(Array.isArray(listed.node.children), 'node.children 不是数组');

    return `${listed.node.children.length} 个一级子节点`;
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

await check('scene.validate 场景健康检查', async () =>
{
    const report = await call('scene.validate');
    assert(typeof report.ok === 'boolean', '缺 ok');
    assert(Array.isArray(report.issues), 'issues 不是数组');
    assert(report.stats.objects > 0, `stats.objects = ${report.stats.objects}`);
    assert(report.stats.cameras > 0, '场景里没有相机');
    assert(typeof report.stats.triangles === 'number', '缺 triangles 统计');
    // 默认场景不该有无材质的 MeshRenderer——那正是历史上引发栈溢出的形态
    assert(report.stats.withMaterial === report.stats.renderers,
        `有 ${report.stats.renderers - report.stats.withMaterial} 个 MeshRenderer 没有材质`);

    return `ok=${report.ok}，${report.issueCount} 个问题，${report.stats.objects} 个对象，${report.stats.triangles} 个三角面`;
});

await check('scene.find includeScreen 带出视野信息', async () =>
{
    const found = await call('scene.find', { nameContains: 'Plane', includeScreen: true });
    assert(found.count >= 1, '没找到 Plane');
    const item = found.matched[0];
    assert(item.view, `缺 view 字段：${JSON.stringify(item)}`);
    assert(typeof item.view.visible === 'boolean', 'view.visible 不是布尔');
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

await check('view.probe 像素统计可判断画面内容', async () =>
{
    const probe = await call('view.probe', { grid: 4 });
    assert(probe.width > 0 && probe.height > 0, '尺寸无效');
    assert(probe.sampled > 0, '没有采样到像素');
    assert(probe.grid?.length === 16, `网格项数 = ${probe.grid?.length}（应为 4x4）`);
    assert(probe.dominantColors.length > 0, '没有主色');
    const ratioSum = probe.dominantColors.reduce((sum, item) => sum + item.ratio, 0);
    assert(ratioSum <= 1.001, `主色占比之和超过 1：${ratioSum}`);
    // 编辑器视图里必有网格线与对象，纯色画面说明"渲染成功了但什么都没画出来"
    assert(probe.uniqueColors > 1, `只统计到 1 种颜色（纯色画面）：${JSON.stringify(probe.dominantColors)}`);
    assert(probe.maxLuminance > probe.minLuminance, `亮度无范围（纯色画面）：${probe.minLuminance}`);
    assert(probe.maxLuminance > 0, '画面全黑（maxLuminance = 0）');

    return `${probe.width}x${probe.height}，${probe.uniqueColors} 色，`
        + `主色 ${probe.dominantColors[0].color} 占 ${Math.round(probe.dominantColors[0].ratio * 100)}%`;
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
            const depthBefore = (await call('history.status', { labels: 0 })).undoCount;
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
            const depthAfter = (await call('history.status', { labels: 0 })).undoCount;
            assert(depthAfter === depthBefore, `预演改变了撤销栈深度：${depthBefore} → ${depthAfter}`);
            const leftover = await call('scene.find', { nameContains: 'Preview' });
            assert(leftover.count === 0, `预演留下了 ${leftover.count} 个对象`);

            return `预演 ${preview.steps} 步并全部回滚；对象数与撤销栈深度均未变`;
        });

        await check('scene.validate 报出视野外的对象', async () =>
        {
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

        // 统一还原：把所有写操作撤销回初始状态，场景内容与跑测试前完全一致
        await check('history.undo 还原全部写操作', async () =>
        {
            let status = await call('history.status');
            let guard = 0;
            while (status.undoCount > initialHistory.undoCount && guard++ < 50)
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
