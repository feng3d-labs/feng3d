// 模糊测试：用非法 / 边界参数调用写方法，每次之后检查场景是否仍健康。
// 目的不是"每个都该报错"，而是找出「接受了却把场景弄坏」的静默损坏路径。
// 用法：node .verify/fuzz-probe.mjs
import { resolveBridgeBase } from './editor-bridge-base.mjs';

const PREFIX = '/__editor-bridge';
const base = await resolveBridgeBase();
const target = 'probe';

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
console.log(`起始撤销栈深度：${startUndoCount}\n`);

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

console.log(`\n共 ${cases.length} 例：被接受 ${accepted}，拒绝 ${cases.length - accepted}，把场景弄坏 ${broke}，setEnvironment 探针失败 ${probeFailed}`);

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
console.log(`清理后对象数：${after}（起始 ${before}）${after === before ? ' ✓' : ' ✗'}`);
