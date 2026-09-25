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

    return `${info.sceneName}，${info.methods.length} 个方法`;
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

    return `ok=${report.ok}，${report.issueCount} 个问题，${report.stats.objects} 个对象`;
});

await check('selection.get / selection.set 往返', async () =>
{
    const before = await call('selection.get');
    assert(typeof before.count === 'number', '缺 count');
    if (!firstChildId) return '无对象可选中';

    const selected = await call('selection.set', { objectIds: [firstChildId] });
    assert(selected.count === 1, `选中数应为 1，实际 ${selected.count}`);
    await call('selection.set', { objectIds: [] });
    const cleared = await call('selection.get');
    assert(cleared.count === 0, '清空选中失败');

    return '可选中可清空';
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
