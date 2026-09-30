import { afterEach, beforeEach, describe, expect, it } from 'vitest';

// 必须最先：feng3d barrel 会拉起 @feng3d/webgpu，先 stub 全局（与既有 spec 同模式）
import './browser-stub';

import { loadPLYFromUrl } from '../src/loaders/PLYLoader';
import { loadSTLFromUrl } from '../src/loaders/STLLoader';

/**
 * PLY / STL 的 URL 入口失败路径（issue #384）。
 *
 * 背景：`addons` 里 6 个 URL 入口中，`OBJLoader` 与 `GLTFLoader` 的 4 处都已经检查 `resp.ok`
 * （分别由 #352 / #364 修），只剩 `PLYLoader` / `STLLoader` 没检查 —— 非 2xx 时
 * `arrayBuffer()` 拿到的是错误页字节，交给解析器后用户看到的是**"这个文件格式不对"**
 * 而不是**"这个 URL 没取到"**。本文件守住这两处的报错质量。
 *
 * 顺带：这批用例也是"这一类缺陷在 addons 里已清零"的守卫 —— 将来谁再加 URL 入口，
 * 照着这里的模式补失败路径用例即可。
 */

const initialFetch = globalThis.fetch;
let requested: string[] = [];

beforeEach(() =>
{
    requested = [];
});

afterEach(() =>
{
    globalThis.fetch = initialFetch;
});

/** 造一个"404 且响应体是错误页"的响应 */
function notFound(): Response
{
    return new Response('<!doctype html><h1>404 Not Found</h1>', { status: 404, statusText: 'Not Found' });
}

describe('PLY / STL 的 URL 入口失败路径（issue #384）', () =>
{
    it('PLY：主文件 404 时抛错，信息里带 URL 与 HTTP 状态码', async () =>
    {
        globalThis.fetch = (async (input: string | URL | Request) =>
        {
            requested.push(String(input));

            return notFound();
        }) as typeof fetch;

        await expect(loadPLYFromUrl('https://host/missing.ply')).rejects.toThrow(
            /PLY: 加载 "https:\/\/host\/missing\.ply" 失败（HTTP 404 Not Found）/,
        );
        expect(requested).toEqual(['https://host/missing.ply']);
    });

    it('PLY：404 的报错来自"加载失败"，而不是解析器对错误页报出的格式问题', async () =>
    {
        globalThis.fetch = (async () => notFound()) as typeof fetch;

        const error = await loadPLYFromUrl('https://host/x.ply').then(
            () => null,
            (e: Error) => e,
        );

        expect(error).toBeInstanceOf(Error);
        expect(error?.message).toContain('HTTP 404');
        // 修复前的报错会来自解析器（说文件头不对之类），与"URL 取不到"这个真实原因无关
        expect(error?.message).not.toMatch(/header|magic|format|格式/i);
    });

    it('STL：主文件 404 时抛错，信息里带 URL 与 HTTP 状态码', async () =>
    {
        globalThis.fetch = (async (input: string | URL | Request) =>
        {
            requested.push(String(input));

            return notFound();
        }) as typeof fetch;

        await expect(loadSTLFromUrl('https://host/missing.stl')).rejects.toThrow(
            /STL: 加载 "https:\/\/host\/missing\.stl" 失败（HTTP 404 Not Found）/,
        );
        expect(requested).toEqual(['https://host/missing.stl']);
    });

    it('STL：404 的报错同样来自"加载失败"', async () =>
    {
        globalThis.fetch = (async () => notFound()) as typeof fetch;

        const error = await loadSTLFromUrl('https://host/x.stl').then(
            () => null,
            (e: Error) => e,
        );

        expect(error?.message).toContain('HTTP 404');
        expect(error?.message).not.toMatch(/header|magic|format|格式/i);
    });

    it('正常 200 的响应仍能解析（成功路径没被破坏）', async () =>
    {
        // 一份最小的 ASCII PLY：1 个三角形
        const plyText = [
            'ply', 'format ascii 1.0', 'element vertex 3',
            'property float x', 'property float y', 'property float z',
            'element face 1', 'property list uchar int vertex_indices', 'end_header',
            '0 0 0', '1 0 0', '0 1 0', '3 0 1 2', '',
        ].join('\n');

        globalThis.fetch = (async () => new Response(plyText, { status: 200 })) as typeof fetch;

        const geometry = await loadPLYFromUrl('https://host/ok.ply');

        expect(geometry).toBeTruthy();
        // CustomGeometry 上直接挂 positions / indices（不是 vertices.a_position）
        expect(Array.from(geometry.positions!)).toEqual([0, 0, 0, 1, 0, 0, 0, 1, 0]);
        expect(Array.from(geometry.indices!)).toEqual([0, 1, 2]);
    });
});