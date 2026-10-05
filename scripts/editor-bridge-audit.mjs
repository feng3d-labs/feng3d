#!/usr/bin/env node
/**
 * 写操作**审计**的验收（#281 的「可审计」那一截）。
 *
 * `history.audit` 回答的是 `history.status` 答不了的问题：
 * **「刚才这段时间谁改了什么、有没有被拒」**。判据落在"每个出口都要留痕"上，缺一条都有漏洞：
 *
 * | 出口 | 少了它会漏掉什么 |
 * |---|---|
 * | 成功 | 记了但没记对（method / 摘要不对） |
 * | `dryRun` 预演 | 预演同样"碰过"场景再回滚，不记就等于"这段改动查不到" |
 * | 失败（抛错 / 写通道被拒） | 出事后最需要查的，恰恰是被拒的那几次 |
 * | 「清空」自己 | 清空后被审计反手记一条，是**有意的**：谁读了审计也是审计信息 |
 *
 * 另一条判据是「**入参只记摘要**」：写场景的入参可能有几万个顶点，全记会把内存与可读性一起毁掉。
 *
 * 用法（需要宿主或 dev server 在跑；本脚本自己用 Playwright 开页面）：
 *
 * ```bash
 * EDITOR_BRIDGE_URL=http://127.0.0.1:3010 node scripts/editor-bridge-audit.mjs
 * ```
 *
 * 退出码：0 全部通过；1 有失败。
 */
const { openBridgePage } = await import('./editor-bridge-page.mjs');

const base = (process.env.EDITOR_BRIDGE_URL ?? 'http://127.0.0.1:3040').replace(/\/$/, '');
const target = 'audit-verify';

const opened = await openBridgePage(base, target, { locale: 'zh-CN' });

console.log(`[审计验收] 页面已开：${base}`);

let total = 0;
let failed = 0;

function check(title, condition, detail = '')
{
    total += 1;
    if (condition) console.log(`  PASS  ${title}${detail ? ` — ${detail}` : ''}`);
    else { failed += 1; console.log(`  FAIL  ${title}${detail ? ` — ${detail}` : ''}`); }
}

/**
 * 调桥接方法。
 *
 * @param {string} method 方法名
 * @param {object} params 参数
 * @returns {Promise<unknown>} 结果
 */
async function call(method, params = {})
{
    const res = await fetch(`${base}/__editor-bridge/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, params, target }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const { id } = await res.json();
    const deadline = Date.now() + 30000;

    for (;;)
    {
        const payload = await fetch(`${base}/__editor-bridge/result?id=${encodeURIComponent(id)}`).then((one) => one.json());

        if (payload.pending)
        {
            await new Promise((settle) => setTimeout(settle, 150));
            continue;
        }
        if (payload.ok === false) throw new Error(`${payload.error}`);

        return payload.result;
        if (Date.now() > deadline) throw new Error(`${method} 超时`);

        await new Promise((settle) => setTimeout(settle, 120));
    }
}

try
{
    // ① 先清干净（这也顺带验了 history.auditClear 可用）
    const cleared = await call('history.auditClear');

    check('history.auditClear 可用', cleared !== undefined && cleared !== null, JSON.stringify(cleared));

    const before = await call('history.audit');

    // **注意**：「清空」这条调用**自己也被审计**（`withAudit` 覆盖全部写方法 —— 这是有意的取舍：
    // 「谁读了审计」也是审计信息）。所以这里断言的是"只剩它自己那一条"，而不是"空"。
    check('清空后只剩「清空」自己那一条（它也被审计）',
        before.entries?.length === 1 && before.entries[0].method === 'history.auditClear',
        JSON.stringify(before.entries?.map((one) => one.method)));

    // ② 做一次真写操作（加一个对象），再读审计 —— 必须有它
    const added = await call('scene.add', {
        parent: '',
        object: { __type__: 'Object3D', name: 'AuditProbe' },
    });

    const after = await call('history.audit');

    const hit = (after.entries ?? []).find((one) => one.method === 'scene.add');

    check('★ 写操作在审计里留了一条（method=scene.add）', !!hit,
        hit ? JSON.stringify({ seq: hit.seq, ok: hit.ok, params: hit.params }) : JSON.stringify(after.entries));

    check('★ 那条记了 `ok: true` 与入参摘要（不记全值）',
        hit?.ok === true && hit?.params !== undefined && !JSON.stringify(hit.params).includes('__type__'),
        JSON.stringify(hit?.params));

    check('审计条目带时间与序号', typeof hit?.at === 'string' && typeof hit?.seq === 'number');

    // ③ 预演也要留记录（它同样"碰过"场景再回滚）
    const beforeDry = (await call('history.audit')).entries.length;

    await call('scene.add', {
        parent: '',
        object: { __type__: 'Object3D', name: 'AuditProbeDryRun' },
        dryRun: true,
    });

    const afterDry = await call('history.audit');

    check('★ `dryRun` 预演也留一条（且标了 dryRun）',
        afterDry.entries.some((one) => one.dryRun === true),
        `${beforeDry} → ${afterDry.entries.length}`);

    // ④ 失败也要留记录（用一条必然失败的写：不存在的 id）
    let threw = false;

    try { await call('scene.remove', { id: '不存在的对象' }); }
    catch { threw = true; }

    const afterFail = await call('history.audit');
    const failedEntry = afterFail.entries.find((one) => one.ok === false);

    check('★ 失败的写也留一条（ok: false + error 摘要）', threw && !!failedEntry,
        failedEntry ? `${failedEntry.method}: ${String(failedEntry.error).slice(0, 40)}` : '没有失败记录');

    // ⑤ 收尾：把探针对象删掉（保持场景整洁）。**用 name 选择器**，且失败不影响结论 ——
    // 审计那四条才是被测对象，清理是顺手。
    try
    {
        await call('scene.remove', { name: 'AuditProbe' });
    }
    catch (error)
    {
        console.log(`  NOTE  探针对象没删掉（不影响结论）：${error.message}`);
    }

    console.log(`\n共 ${total} 项：通过 ${total - failed}，失败 ${failed}`);
}
finally
{
    await opened.close();
}

if (failed > 0) process.exit(1);

console.log('✅ 审计验收通过：写 / 预演 / 失败三个出口都留痕，且入参只记摘要');
