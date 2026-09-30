import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { loadGltfFromUrl } from '../src/loaders/GLTFLoader';

/**
 * `loadGltfFromUrl` 的失败路径（issue #364）。
 *
 * 背景：它与 OBJ 的 URL 入口（#352）原本都有同一个疏漏——**不检查 `resp.ok`**。
 * 于是 404 时 `resp.arrayBuffer()` 拿到的是错误页字节，再交给解析器，用户看到的是
 * "JSON 解析失败"这类**指向错误地方的报错**，而不是"这个 URL 没取到"。
 * 本文件专门守住失败路径的报错质量。
 */

/** 一个最小的合法 .gltf（自包含：buffer 走内嵌 base64） */
function minimalGltf(): string
{
    // 12 字节的数据（POSITION 用不到，只为让 buffers[0] 有内容）
    const base64 = Buffer.from(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])).toString('base64');

    return JSON.stringify({
        asset: { version: '2.0' },
        scene: 0,
        scenes: [{ nodes: [] }],
        buffers: [{ byteLength: 12, uri: `data:application/octet-stream;base64,${base64}` }],
    });
}

/** 一个最小 GLB（magic + version + 长度 + 空 JSON chunk） */
function minimalGlb(): ArrayBuffer
{
    const json = JSON.stringify({ asset: { version: '2.0' }, scenes: [{ nodes: [] }], scene: 0 });
    const jsonBytes = new TextEncoder().encode(json);
    const padded = jsonBytes.length + ((4 - (jsonBytes.length % 4)) % 4);
    const total = 12 + 8 + padded;
    const buffer = new ArrayBuffer(total);
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);

    view.setUint32(0, 0x46546c67, true); // 'glTF'
    view.setUint32(4, 2, true);
    view.setUint32(8, total, true);
    view.setUint32(12, padded, true);
    view.setUint32(16, 0x4e4f534a, true); // 'JSON'
    bytes.set(jsonBytes, 20);
    // glTF 规范：JSON chunk 用**空格**（0x20）填充（BIN chunk 才是 0x00）
    for (let i = 20 + jsonBytes.length; i < total; i++) bytes[i] = 0x20;

    return buffer;
}

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

describe('loadGltfFromUrl 的失败路径（issue #364）', () =>
{
    it('主文件 404 时抛错，且信息里带 URL 与 HTTP 状态码', async () =>
    {
        globalThis.fetch = (async (input: string | URL | Request) =>
        {
            requested.push(String(input));

            return new Response('<!doctype html><h1>404 Not Found</h1>', { status: 404, statusText: 'Not Found' });
        }) as typeof fetch;

        await expect(loadGltfFromUrl('https://host/missing.gltf')).rejects.toThrow(
            /加载 "https:\/\/host\/missing\.gltf" 失败（HTTP 404 Not Found）/,
        );
        expect(requested).toEqual(['https://host/missing.gltf']);
    });

    it('404 的报错来自"加载失败"，而不是解析器报出的 JSON 解析错误', async () =>
    {
        globalThis.fetch = (async () =>
            new Response('<html>not a gltf at all</html>', { status: 404, statusText: 'Not Found' })) as typeof fetch;

        let message = '';
        try
        {
            await loadGltfFromUrl('https://host/x.gltf');
        }
        catch (e)
        {
            message = (e as Error).message;
        }

        // 修复前这里会是解析器对 HTML 报出的错（与"URL 取不到"这个真实原因无关）
        expect(message).toContain('HTTP 404');
        expect(message).not.toMatch(/JSON|Unexpected token|解析/i);
    });

    it('正常 200 的 .gltf 仍然解析（修复没有破坏成功路径）', async () =>
    {
        globalThis.fetch = (async () => new Response(minimalGltf(), { status: 200 })) as typeof fetch;

        await expect(loadGltfFromUrl('https://host/ok.gltf')).resolves.toBeDefined();
    });

    it('.glb 路径不受影响（200 + GLB magic 走 parseGLB）', async () =>
    {
        globalThis.fetch = (async () => new Response(minimalGlb(), { status: 200 })) as typeof fetch;

        await expect(loadGltfFromUrl('https://host/ok.glb')).resolves.toBeDefined();
    });
});