import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createTextureCubeFromUrls } from './createTexture';

/**
 * `createTextureCubeFromUrls` 的失败路径（issue #386）。
 *
 * 它此前**不检查 `resp.ok`**：某个面的 URL 404 时，`response.blob()` 拿到的是错误页 HTML，
 * 再交给 `createImageBitmap` —— 用户看到的是"这个图片解析不了"，而不是"这个 URL 没取到"。
 *
 * 与 `AudioSource` 的处理**故意不同**：那里是可选资源、取不到就降级；这里**没有降级路径**
 * （cube 少一个面就没有意义，后面还要用 `imageBitmaps[0]` 的尺寸），所以明确抛错。
 */

const initialFetch = globalThis.fetch;
const initialCreateImageBitmap = (globalThis as Record<string, unknown>).createImageBitmap;
let requested: string[] = [];

/** 6 个面的地址（feng3d 约定顺序 [+X, +Y, +Z, -X, -Y, -Z]） */
const FACE_URLS = ['px.png', 'py.png', 'pz.png', 'nx.png', 'ny.png', 'nz.png'].map((n) => `https://host/${n}`);

beforeEach(() =>
{
    requested = [];
    // 只为"成功路径"用：造一个带尺寸的假 bitmap
    (globalThis as Record<string, unknown>).createImageBitmap = async () => ({ width: 4, height: 4, close() { } });
});

afterEach(() =>
{
    globalThis.fetch = initialFetch;
    (globalThis as Record<string, unknown>).createImageBitmap = initialCreateImageBitmap;
});

describe('createTextureCubeFromUrls 的失败路径（issue #386）', () =>
{
    it('某个面 404 时抛错，信息里带是哪个面与 HTTP 状态码', async () =>
    {
        globalThis.fetch = (async (input: string | URL | Request) =>
        {
            const url = String(input);
            requested.push(url);

            // 第 3 个面（pz.png）失败
            if (url.endsWith('pz.png'))
            {
                return new Response('<!doctype html><h1>404</h1>', { status: 404, statusText: 'Not Found' });
            }

            return new Response('png-bytes', { status: 200 });
        }) as typeof fetch;

        const error = await createTextureCubeFromUrls(FACE_URLS).then(
            () => null,
            (e: Error) => e,
        );

        expect(error).toBeInstanceOf(Error);
        expect(error?.message).toContain('createTextureCubeFromUrls');
        expect(error?.message).toContain('https://host/pz.png');
        expect(error?.message).toContain('HTTP 404 Not Found');
    });

    it('报错来自"加载失败"，而不是 createImageBitmap 对错误页报出的解析问题', async () =>
    {
        globalThis.fetch = (async () => new Response('<html>not an image</html>', { status: 500, statusText: 'Server Error' })) as typeof fetch;

        const error = await createTextureCubeFromUrls(FACE_URLS).then(
            () => null,
            (e: Error) => e,
        );

        expect(error?.message).toContain('HTTP 500');
        expect(error?.message).not.toMatch(/bitmap|decode|image/i);
    });

    it('全部 200 时仍能正常构造（成功路径没被破坏）', async () =>
    {
        globalThis.fetch = (async (input: string | URL | Request) =>
        {
            requested.push(String(input));

            return new Response('png-bytes', { status: 200 });
        }) as typeof fetch;

        const texture = await createTextureCubeFromUrls(FACE_URLS);

        expect(texture).toBeTruthy();
        // 6 个面都请求了（顺序即传入顺序）
        expect(requested).toEqual(FACE_URLS);
    });
});