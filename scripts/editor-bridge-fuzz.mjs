// 模糊测试：用非法 / 边界参数调用写方法，每次之后检查场景是否仍健康。
// 目的不是"每个都该报错"，而是找出「接受了却把场景弄坏」的静默损坏路径。
// 用法：node .verify/fuzz-probe.mjs
import { resolveBridgeBase } from './editor-bridge-base.mjs';

const PREFIX = '/__editor-bridge';
const base = await resolveBridgeBase();
const target = 'probe';

/** 写操作会自动附带「本次调用期间新出现的报错」——收集起来，让"被接受了、却让引擎报错"也能被发现 */
const newLogErrors = [];

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

    const result = payload.result;
    if (result && typeof result === 'object' && Array.isArray(result.newLogErrors))
    {
        newLogErrors.push({ method, errors: result.newLogErrors });
    }

    return result;
}

// 等场景稳定
let before = 0;
for (let i = 0; i < 24; i++)
{
    const count = (await call('scene.summary')).objectCount;
    if (count > 0 && count === before) break;
    before = count;
    await new Promise((resolve) => setTimeout(resolve, 500));
}

const cases = [
    ['scene.set', { objectId: '/Untitled/Plane', path: '../../../etc/passwd', value: 1 }],
    ['scene.set', { objectId: '/Untitled/Plane', path: 'position', value: 'not-an-object' }],
    ['scene.set', { objectId: '/Untitled/Plane', path: 'components[99].x', value: 1 }],
    ['scene.set', { objectId: '', path: 'position.y', value: 1 }],
    ['scene.add', { parentId: '/Untitled/Plane', name: '', shape: 'cube' }],
    ['scene.add', { name: 'X', shape: 'sphere', color: { r: 999, g: -5, b: 0 } }],
    ['scene.add', { name: 'X', shape: 'cube', geometryParams: { radius: -1 } }],
    ['scene.duplicate', { objectId: '/Untitled', count: 999 }],
    ['scene.duplicate', { objectId: '/Untitled/Plane', count: 0 }],
    ['scene.duplicate', { objectId: '/Untitled/Plane', count: -3 }],
    ['scene.reparent', { objectId: '/Untitled/Plane', parentId: '/Untitled/Plane' }],
    ['scene.reparent', { objectId: '/Untitled/Plane', parentId: '/Untitled/Plane/child' }],
    ['scene.group', { objectIds: ['/Untitled/Plane', '/Untitled/Plane'] }],
    ['scene.arrange', { objectIds: ['/Untitled/Plane'], mode: 'grid' }],
    ['scene.arrange', { objectIds: ['/Untitled/Plane', '/Untitled/Sphere'], mode: 'circle', radius: -5 }],
    ['scene.setMany', { objectIds: ['/Untitled/Plane', '/Untitled/Sphere'], path: 'position.y', value: 'xxx' }],
    ['scene.setMaterial', { objectId: '/Untitled/Plane', color: 'red' }],
    ['scene.setMaterial', { objectId: '/Untitled/Plane', glossiness: 'high' }],
    ['scene.setEnvironment', { background: { r: Number.NaN } }],
    // 溢出到 Infinity 的数值：JSON 表达得了、f32 装不下——既可能被静默接受，也可能让 clearValue 变成非有限值
    ['scene.setEnvironment', { background: { r: 1e39, g: 0, b: 0 } }],
    ['scene.setEnvironment', { background: { r: -1e39, g: 0, b: 0 } }],
    // f32 溢出（JS 里是有限数、GPU 侧是 Infinity）在各类入口都不该被放进去
    ['scene.set', { objectId: '/Untitled/Plane', path: 'position.y', value: 1e39 }],
    ['scene.set', { objectId: '/Untitled/Plane', path: 'position', value: { x: 1e39, y: 0, z: 0 } }],
    ['scene.add', { name: 'F32Probe', shape: 'cube', color: { r: 1, g: 1, b: 1 }, position: { x: 1e39 } }],
    ['scene.add', { name: 'GeoProbe', shape: 'sphere', geometryParams: { radius: 1e39 } }],
    ['scene.setMaterial', { objectId: '/Untitled/Plane', glossiness: 1e39 }],
    ['scene.arrange', { objectIds: ['/Untitled/Plane', '/Untitled/Sphere'], mode: 'line', spacing: 1e39 }],
    ['scene.arrange', { objectIds: ['/Untitled/Plane', '/Untitled/Sphere'], mode: 'grid', columns: 1e39 }],
    // 事务入口的边界：空数组、只读方法、嵌套 batch、方法名不存在
    ['scene.batch', { steps: [] }],
    ['scene.batch', { steps: 'not-an-array' }],
    ['scene.batch', { steps: [{ method: 'editor.info' }] }],
    ['scene.batch', { steps: [{ method: 'scene.batch', params: { steps: [] } }] }],
    ['scene.batch', { steps: [{ method: 'scene.__nope__' }] }],
    ['scene.batch', { steps: [{ method: 'scene.add', params: { name: 'BatchFuzz', shape: 'cube', color: { r: 1, g: 1, b: 1 } } }, { method: 'scene.remove', params: { objectId: '/Untitled/__nope__' } }] }],
    ['scene.remove', { objectIds: ['/Untitled/Plane', '/Untitled/Plane'] }],
    ['scene.mark', { name: '' }],
    ['scene.rollback', { name: '' }],

    // 特殊字符与极端尺寸：路径式 id 用的是名字拼接，名字里出现分隔符会怎样？
    ['scene.add', { name: '含/斜杠', shape: 'cube', color: { r: 1, g: 1, b: 1 } }],
    ['scene.add', { name: '#井号', shape: 'cube', color: { r: 1, g: 1, b: 1 } }],
    ['scene.add', { name: '../上跳', shape: 'cube', color: { r: 1, g: 1, b: 1 } }],
    ['scene.add', { name: 'x'.repeat(2000), shape: 'cube', color: { r: 1, g: 1, b: 1 } }],
    ['scene.find', { nameContains: 'x'.repeat(500) }],
    ['scene.setMany', { objectIds: Array.from({ length: 300 }, () => '/Untitled/Plane'), path: 'position.y', value: 1 }],
    ['scene.arrange', { objectIds: ['/Untitled/Plane', '/Untitled/Sphere'], mode: 'grid', columns: 0 }],
    ['scene.arrange', { objectIds: ['/Untitled/Plane', '/Untitled/Sphere'], mode: 'circle', radius: 0 }],
    ['scene.setEnvironment', { background: { r: 'x' } }],
    ['scene.setMaterial', { objectId: '/Untitled/Plane', alphaThreshold: -1 }],
];

console.log(`起始对象数：${before}`);

// 记下起始撤销栈深度：清理时只撤到这一层，否则会把页面更早的操作也一起撤掉
const startUndoCount = (await call('history.status')).undoCount;
// 也记下起始的对象 id：中途的 scene.rollback 会让栈深度回退得比起始还浅，
// 只靠撤销无法清理干净，最后还要删掉所有"开始时不存在"的对象
const startIds = (await call('scene.find', { namePattern: '.', limit: 500 })).matched.map((item) => item.id);
console.log(`起始撤销栈深度：${startUndoCount}，起始对象 ${startIds.length} 个\n`);

let accepted = 0;
let broke = 0;
let probeFailed = 0;
for (const [method, params] of cases)
{
    const label = `${method} ${JSON.stringify(params).slice(0, 72)}`;
    let outcome;
    try
    {
        await call(method, params);
        outcome = '接受';
        accepted++;
    }
    catch (e)
    {
        outcome = `拒绝（${String(e.message).slice(0, 40)}）`;
    }

    // 每次之后先探活：栈溢出会让页面彻底卡住，后续结果都不再可信
    let health = 'ok';
    try
    {
        await call('scene.summary');
    }
    catch (e)
    {
        console.log(`${outcome.padEnd(46)} ✗ 页面失去响应  <- ${label}`);
        console.log(`\n定位到失效点：${label}`);
        console.log(`错误：${String(e.message).slice(0, 200)}`);
        broke++;
        break;
    }

    // 再体检：只看 error 级（warn 可能是有意为之）
    try
    {
        const report = await call('scene.validate');
        const errors = report.issues.filter((issue) => issue.level === 'error');
        if (errors.length > 0)
        {
            health = `✗ 场景出现 error：${errors.map((issue) => issue.code).join(',')}`;
            broke++;
        }
    }
    catch (e)
    {
        health = `✗ 体检本身失败：${String(e.message).slice(0, 40)}`;
        broke++;
    }

    console.log(`${outcome.padEnd(46)} ${health}  <- ${label}`);

    // 专用探针：setEnvironment 曾在一组非法输入之后开始栈溢出。
    // 这里只记录、不中断——探活已确认页面仍可用，后面还有用例要跑
    try
    {
        await call('scene.setEnvironment', { background: { r: 0.3, g: 0.3, b: 0.3 } });
    }
    catch (e)
    {
        console.log(`    ↳ setEnvironment 探针失败（已知限制）：${String(e.message).slice(0, 60)}`);
        probeFailed++;
    }
}

// ---- 合法但折腾的操作序列：单个调用都没问题，组合起来会不会留下坏状态 ----
const sequences = [
    {
        name: '建 → 复制 → 排列 → 归组 → 删除',
        run: async () =>
        {
            const added = await call('scene.add', { name: 'SeqBase', shape: 'cube', position: { x: 0, y: 0.5, z: 0 } });
            const dup = await call('scene.duplicate', { objectId: added.id, count: 3, name: 'SeqCopy' });
            await call('scene.arrange', { objectIds: [added.id, ...dup.created], mode: 'grid', axis: 'y', columns: 2 });
            const grouped = await call('scene.group', { objectIds: [added.id, ...dup.created], name: 'SeqGroup' });
            await call('scene.remove', { objectId: grouped.groupId });
        },
    },
    {
        name: '同一字段反复写 10 次',
        run: async () =>
        {
            for (let i = 0; i < 10; i++)
            {
                await call('scene.set', { objectId: '/Untitled/Plane', path: 'position.y', value: i });
            }
        },
    },
    {
        name: '六级深层嵌套',
        run: async () =>
        {
            let parentId = '/Untitled';
            for (let i = 0; i < 6; i++)
            {
                const added = await call('scene.add', {
                    parentId,
                    name: `Deep${i}`,
                    shape: 'cube',
                    color: { r: 0.5, g: 0.5, b: 0.5 },
                });
                parentId = added.id;
            }
        },
    },
    {
        name: '无材质对象 + 排列（曾经会让页面栈溢出的最小复现）',
        run: async () =>
        {
            await call('scene.add', { parentId: '/Untitled/Plane', name: 'NoMatSeq', shape: 'cube' });
            await call('scene.arrange', {
                objectIds: ['/Untitled/Plane', '/Untitled/Sphere'],
                mode: 'circle',
                axis: 'y',
                radius: -5,
            });
        },
    },
];

console.log('\n[合法操作序列]');
for (const sequence of sequences)
{
    let outcome;
    try
    {
        await sequence.run();
        outcome = '执行完成';
    }
    catch (e)
    {
        outcome = `抛错（${String(e.message).slice(0, 40)}）`;
    }

    // 序列跑完后同样要探活 + 体检
    let health = 'ok';
    try
    {
        await call('scene.summary');
        const report = await call('scene.validate');
        const errors = report.issues.filter((issue) => issue.level === 'error');
        if (errors.length > 0) health = `✗ 场景出现 error：${errors.map((issue) => issue.code).join(',')}`;
        await call('scene.setEnvironment', { background: { r: 0.3, g: 0.3, b: 0.3 } });
    }
    catch (e)
    {
        health = `✗ ${String(e.message).slice(0, 46)}`;
    }

    if (health !== 'ok') broke++;
    console.log(`${outcome.padEnd(46)} ${health}  <- ${sequence.name}`);
}

console.log(`\n共 ${cases.length} 例 + ${sequences.length} 个序列：被接受 ${accepted}，拒绝 ${cases.length - accepted}，把场景弄坏 ${broke}，setEnvironment 探针失败 ${probeFailed}，引擎报错 ${newLogErrors.length} 次`);
// 写操作会把「本次调用期间新出现的报错」带回来：被接受、场景结构也没坏，但引擎报了错，同样是问题
for (const item of newLogErrors.slice(0, 5))
{
    console.log(`  ! ${item.method} 引发报错：${String(item.errors[0]).slice(0, 90)}`);
}

// 清理：撤销回起始状态（若页面已因极端输入进入异常状态，这里如实报告而不是崩掉）
let status;
try
{
    status = await call('history.status');
}
catch (e)
{
    console.log(`清理无法进行：${String(e.message).slice(0, 60)}——该页面需要刷新`);
    process.exit(0);
}
let guard = 0;
while (status.undoCount > startUndoCount && guard++ < 60)
{
    await call('history.undo');
    status = await call('history.status');
}
const after = (await call('scene.summary')).objectCount;

// 第二步：删掉所有开始时不存在、现在还残留的对象
const nowIds = (await call('scene.find', { namePattern: '.', limit: 500 })).matched.map((item) => item.id);
const leftovers = nowIds.filter((id) => !startIds.includes(id));
// 只留最上层：删父对象会连带删掉整棵子树，重复列出子对象没有意义
const topLeftovers = leftovers.filter((id) => !leftovers.some((other) => other !== id && id.startsWith(`${other}/`)));
if (topLeftovers.length > 0)
{
    try
    {
        await call('scene.remove', { objectIds: topLeftovers });
    }
    catch (e)
    {
        console.log(`清理残留对象失败：${String(e.message).slice(0, 50)}`);
    }
}

const final = (await call('scene.summary')).objectCount;
// 判据用「对象集合」而不是「撤销栈深度」：rollback 会把命令挪进 redo 栈，
// 栈深度相同并不代表场景相同（深度只适合当清理的起点，不能当状态指纹）
const finalIds = (await call('scene.find', { namePattern: '.', limit: 500 })).matched.map((item) => item.id);
const missing = startIds.filter((id) => !finalIds.includes(id));
const verdict = missing.length === 0 ? ' ✓' : ` ✗ 丢了 ${missing.slice(0, 5).join('、')}`;
console.log(`清理后对象数：${final}（起始 ${before}）${verdict}${leftovers.length ? `（删掉 ${topLeftovers.length} 棵残留子树）` : ''}`);
