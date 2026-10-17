import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FS } from 'feng3d';
import { HostFS } from '../src/assets/HostFS';
import { isHostAvailable, pickBaseFS } from '../src/assets/EditorRS';

/**
 * `pickBaseFS()` 的宿主探测（#274 / 决策 ①）。
 *
 * ## 它守的是「没有宿主」这个**正常态**
 *
 * dev server（`npm run dev`）只有 vite 的桥接中继、**没有宿主调用器**；静态部署更是连中继都没有。
 * 这时页面若直接调 `host.workspace.info` 会拿到 **400** —— 而每一次 400 在控制台都是一条
 * `Failed to load resource`，于是「没有宿主」这个正常状态看起来像页面坏了。
 *
 * 所以探测走 `/ping`（只读能力探针，固定 200）：服务端说没有宿主时**一个 host.* 都不发**。
 */

/** 记录下来的请求（验「发没发、发的是哪条」） */
const calls: { url: string; method: string }[] = [];

/** 服务端是否接入了宿主调用器（`/ping` 的 `host` 字段） */
let pingHost = false;

/** 宿主是否打开了项目（`host.workspace.info` 的 `open`） */
let projectOpen = true;

/**
 * 造一个 JSON 响应（Node 18+ 有全局 Response）。
 *
 * @param body 响应体
 * @param status 状态码
 * @returns 响应
 */
function json(body: unknown, status = 200): Response
{
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('pickBaseFS（#274 宿主探测）', () =>
{
    beforeEach(() =>
    {
        calls.length = 0;
        pingHost = false;
        projectOpen = true;

        vi.stubGlobal('fetch', vi.fn(async (input: unknown, init?: { method?: string }) =>
        {
            const url = String(typeof input === 'string' ? input : (input as { url?: string })?.url ?? input);
            const method = (init?.method ?? 'GET').toUpperCase();

            calls.push({ url, method });

            if (url.endsWith('/ping')) return json({ ok: true, name: 'feng3d-editor-bridge', host: pingHost, clients: [], duplicated: [] });
            if (url.endsWith('/call')) return json({ id: 'req-1', host: true });
            if (url.includes('/result?id=')) return json({ ok: true, result: { open: projectOpen, root: '/tmp/project' } });

            throw new Error(`用例没有考虑这个请求：${method} ${url}`);
        }));
    });

    afterEach(() =>
    {
        vi.unstubAllGlobals();
    });

    it('★ 服务端没有宿主调用器时：只探一次 /ping，一个 host.* 都不发', async () =>
    {
        pingHost = false;

        expect(await pickBaseFS()).toBe(false);
        expect(isHostAvailable()).toBe(false);
        // 关键：**没有** POST /call（那正是原来 400 与未捕获异常的来源）
        expect(calls).toEqual([{ url: '/__editor-bridge/ping', method: 'GET' }]);
    });

    it('宿主接入了但没打开项目：返回 false，也不切 HostFS', async () =>
    {
        pingHost = true;
        projectOpen = false;

        expect(await pickBaseFS()).toBe(false);
        expect(isHostAvailable()).toBe(false);
        // 能力探测之后才问「开没开项目」——两步都走了，但都不产生 4xx
        expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
            'GET /__editor-bridge/ping',
            'POST /__editor-bridge/call',
            'GET /__editor-bridge/result?id=req-1',
        ]);
    });

    it('宿主开着项目：切到 HostFS 并记住「宿主可用」', async () =>
    {
        pingHost = true;
        projectOpen = true;

        expect(await pickBaseFS()).toBe(true);
        expect(isHostAvailable()).toBe(true);
        expect(FS.basefs).toBeInstanceOf(HostFS);
    });

    it('桥接不可达（/ping 抛错）：静默返回 false，不往外抛', async () =>
    {
        vi.stubGlobal('fetch', vi.fn(async () =>
        {
            throw new Error('fetch failed');
        }));

        await expect(pickBaseFS()).resolves.toBe(false);
        expect(isHostAvailable()).toBe(false);
    });
});
