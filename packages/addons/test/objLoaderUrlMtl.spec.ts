import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';

// 必须最先：feng3d barrel 会拉起 @feng3d/webgpu，先 stub 全局（与 addons 其它 spec 同模式）
import './browser-stub';

import { loadOBJFromUrl, loadOBJWithMaterialsFromUrl, parseOBJ, parseOBJWithMTLInfo } from '../src/loaders/OBJLoader';

/**
 * URL 级 OBJ + MTL 加载（issue #352）。
 *
 * 全程 mock `globalThis.fetch`（Node 22 自带 `Response`），**不访问网络**：
 * 每个用例在 `beforeEach` 里装 mock、`afterEach` 里还原，`afterAll` 自检已还原，
 * 避免把 mock 泄漏给同进程的其它 spec。
 */

/** 模块加载时的真实 fetch：用于最后自检「没有留下全局副作用」 */
const initialFetch = globalThis.fetch;

/** 一个三角形（3 个顶点），各用例据此拼出 OBJ 文本 */
const TRIANGLE = ['v 0 0 0', 'v 1 0 0', 'v 0 1 0'].join('\n');

/** 被测的 OBJ 地址（绝对 URL：`mtllib` 相对它解析） */
const OBJ_URL = 'https://host/dir/a.obj';

/** 三个颜色互不相同的 MTL：断言材质有没有真的绑定上时靠颜色区分 */
const MTL_RED = ['newmtl red', 'Kd 1 0 0', ''].join('\n');
const MTL_BLUE = ['newmtl blue', 'Kd 0 0 1', ''].join('\n');
const MTL_GREEN = ['newmtl green', 'Kd 0 1 0', ''].join('\n');

/** mock 的 fetch 状态：记录实际请求地址 + 路由表 */
const mock =
{
    /** 实际被 fetch 的地址（按调用顺序） */
    requested: [] as string[],
    /** 路由表：地址 → 响应构造器；未登记的地址一律返回 404 */
    routes: new Map<string, () => Response>(),
};

/** 登记一个 200 文本响应 */
function routeText(url: string, body: string): void
{
    mock.routes.set(url, () => new Response(body, { status: 200, statusText: 'OK' }));
}

/** 登记一个指定状态码的响应（用于 404 场景） */
function routeStatus(url: string, status: number): void
{
    mock.routes.set(url, () => new Response('<html><body>Not Found</body></html>', { status, statusText: 'Not Found' }));
}

let previousFetch: typeof globalThis.fetch;

beforeEach(() =>
{
    previousFetch = globalThis.fetch;
    mock.requested.length = 0;
    mock.routes.clear();
    globalThis.fetch = async (input: RequestInfo | URL) =>
    {
        const url = String(input);
        mock.requested.push(url);
        const handler = mock.routes.get(url);

        // 未登记的地址返回 404 错误页（模拟真实服务端的 404 响应）
        return handler === undefined
            ? new Response('<html><body>404 Not Found</body></html>', { status: 404, statusText: 'Not Found' })
            : handler();
    };
});

afterEach(() =>
{
    // 务必还原：否则 mock 会泄漏到同进程的其它 spec
    globalThis.fetch = previousFetch;
});

afterAll(() =>
{
    // 全局副作用自检：所有用例跑完后 fetch 必须已回到最初的真实实现
    expect(globalThis.fetch).toBe(initialFetch);
});

describe('loadOBJWithMaterialsFromUrl（issue #352）', () =>
{
    it('mtllib 相对 OBJ 的 URL 解析：实际请求 https://host/dir/a.mtl，而不是原文 a.mtl', async () =>
    {
        routeText(OBJ_URL, ['mtllib a.mtl', TRIANGLE, 'o cube', 'usemtl red', 'f 1 2 3', ''].join('\n'));
        routeText('https://host/dir/a.mtl', MTL_RED);

        const items = await loadOBJWithMaterialsFromUrl(OBJ_URL);

        // 第一条是 OBJ 本身，第二条必须是**解析后的绝对地址**（原样 fetch('a.mtl') 会让这条失败）
        expect(mock.requested).toEqual([OBJ_URL, 'https://host/dir/a.mtl']);
        expect(items.length).toBe(1);
        expect(items[0].name).toBe('cube');
        expect(items[0].materials.map((m) => m.name)).toEqual(['red']);
    });

    it('mtllib 带子目录 / 带 .. 时同样相对 OBJ 的 URL 解析', async () =>
    {
        routeText(OBJ_URL, ['mtllib mtl/red.mtl', 'mtllib ../lib/blue.mtl', TRIANGLE, 'o cube', 'usemtl red', 'f 1 2 3', ''].join('\n'));
        routeText('https://host/dir/mtl/red.mtl', MTL_RED);
        routeText('https://host/lib/blue.mtl', MTL_BLUE);

        await loadOBJWithMaterialsFromUrl(OBJ_URL);

        // `mtl/red.mtl` → OBJ 所在目录的子目录；`../lib/blue.mtl` → 上一级的 lib
        expect(mock.requested).toEqual([
            OBJ_URL,
            'https://host/dir/mtl/red.mtl',
            'https://host/lib/blue.mtl',
        ]);
    });

    it('mtllib 是绝对 URL 时原样使用', async () =>
    {
        routeText(OBJ_URL, ['mtllib https://cdn.example.com/lib/abs.mtl', TRIANGLE, 'o cube', 'usemtl red', 'f 1 2 3', ''].join('\n'));
        routeText('https://cdn.example.com/lib/abs.mtl', MTL_RED);

        const items = await loadOBJWithMaterialsFromUrl(OBJ_URL);

        expect(mock.requested).toEqual([OBJ_URL, 'https://cdn.example.com/lib/abs.mtl']);
        expect(items[0].materials.map((m) => m.name)).toEqual(['red']);
    });

    it('材质真的绑定上了：两个 usemtl 分组各自拿到正确的材质名与材质数据', async () =>
    {
        routeText(OBJ_URL, [
            'mtllib scene.mtl',
            TRIANGLE,
            'o cube_a',
            'usemtl red',
            'f 1 2 3',
            'o cube_b',
            'usemtl blue',
            'f 1 3 2',
            '',
        ].join('\n'));
        routeText('https://host/dir/scene.mtl', `${MTL_RED}\n${MTL_BLUE}`);

        const items = await loadOBJWithMaterialsFromUrl(OBJ_URL);

        expect(items.map((item) => item.name)).toEqual(['cube_a', 'cube_b']);
        expect(items[0].materials.map((m) => m.name)).toEqual(['red']);
        expect(items[1].materials.map((m) => m.name)).toEqual(['blue']);
        // 返回的是**绑定关系**（几何 + 材质），不是只返回几何
        expect(items[0].geometry.__type__).toBe('CustomGeometry');
        expect(Array.from(items[0].geometry.indices!)).toEqual([0, 1, 2]);
        // 材质数据按 mtl 里的 Kd 各自正确（red: r=1,g=0；blue: b=1）
        expect(items[0].materials[0].material.uniforms!.u_diffuse!.r).toBeCloseTo(1, 6);
        expect(items[0].materials[0].material.uniforms!.u_diffuse!.g).toBeCloseTo(0, 6);
        expect(items[1].materials[0].material.uniforms!.u_diffuse!.b).toBeCloseTo(1, 6);
    });

    it('多个 mtllib（含一行多个文件名）全部被请求，且请求顺序与书写顺序一致', async () =>
    {
        routeText(OBJ_URL, [
            'mtllib m1.mtl m2.mtl',
            'mtllib m3.mtl',
            TRIANGLE,
            'o cube',
            'usemtl blue',
            'f 1 2 3',
            '',
        ].join('\n'));
        routeText('https://host/dir/m1.mtl', MTL_RED);
        routeText('https://host/dir/m2.mtl', MTL_BLUE);
        routeText('https://host/dir/m3.mtl', MTL_GREEN);

        const items = await loadOBJWithMaterialsFromUrl(OBJ_URL);

        // 3 个 mtl 都被请求（跳过第一条 OBJ 本身），顺序 = 书写顺序
        expect(mock.requested.slice(1)).toEqual([
            'https://host/dir/m1.mtl',
            'https://host/dir/m2.mtl',
            'https://host/dir/m3.mtl',
        ]);
        // m2.mtl 里的 blue 用上了（一行多个文件名时第二个也被加载）
        expect(items[0].materials.map((m) => m.name)).toEqual(['blue']);
    });

    it('同名材质在多个 mtl 里重复定义：按书写顺序后者覆盖（#12 语义）', async () =>
    {
        routeText(OBJ_URL, ['mtllib first.mtl second.mtl', TRIANGLE, 'o cube', 'usemtl dup', 'f 1 2 3', ''].join('\n'));
        routeText('https://host/dir/first.mtl', ['newmtl dup', 'Kd 1 0 0', ''].join('\n'));
        routeText('https://host/dir/second.mtl', ['newmtl dup', 'Kd 0 1 0', ''].join('\n'));

        const items = await loadOBJWithMaterialsFromUrl(OBJ_URL);

        // 后写的 second.mtl（Kd 0 1 0）胜出
        const diffuse = items[0].materials[0].material.uniforms!.u_diffuse!;
        expect(diffuse.r).toBeCloseTo(0, 6);
        expect(diffuse.g).toBeCloseTo(1, 6);
        expect(items[0].materials[0].name).toBe('dup');
    });

    it('OBJ 没有 mtllib：不发起额外请求，分组材质为空数组（不杜撰默认材质）', async () =>
    {
        routeText(OBJ_URL, [TRIANGLE, 'o plain', 'f 1 2 3', ''].join('\n'));

        const items = await loadOBJWithMaterialsFromUrl(OBJ_URL);

        expect(mock.requested).toEqual([OBJ_URL]);
        expect(items.length).toBe(1);
        expect(items[0].name).toBe('plain');
        expect(items[0].materials).toEqual([]);
    });

    it('某个 mtl 404：抛错（错误信息含 OBJ 地址、mtl 地址与状态码），不静默返回默认材质', async () =>
    {
        routeText(OBJ_URL, ['mtllib missing.mtl', TRIANGLE, 'o cube', 'usemtl red', 'f 1 2 3', ''].join('\n'));
        routeStatus('https://host/dir/missing.mtl', 404);

        const error = await loadOBJWithMaterialsFromUrl(OBJ_URL).then(
            () => null,
            (e: Error) => e,
        );

        expect(error).not.toBeNull();
        expect(error!.message).toContain('https://host/dir/missing.mtl');
        expect(error!.message).toContain('404');
        expect(error!.message).toContain(OBJ_URL);
    });

    it('OBJ 本身 404：抛错（修复前会把 404 错误页当 OBJ 解析，静默产出空几何）', async () =>
    {
        routeStatus(OBJ_URL, 404);

        const error = await loadOBJWithMaterialsFromUrl(OBJ_URL).then(
            () => null,
            (e: Error) => e,
        );

        expect(error).not.toBeNull();
        expect(error!.message).toContain(OBJ_URL);
        expect(error!.message).toContain('404');
        // 修复前的静默行为：404 错误页 HTML 被当 OBJ 解析 ⇒ 空数组（"加载成功但没东西"）
        expect(parseOBJ('<html><body>404 Not Found</body></html>')).toEqual([]);
    });
});

describe('loadOBJFromUrl（issue #352：补 resp.ok 检查）', () =>
{
    it('OBJ 404 时抛错，错误信息含地址与状态码', async () =>
    {
        routeStatus(OBJ_URL, 404);

        const error = await loadOBJFromUrl(OBJ_URL).then(
            () => null,
            (e: Error) => e,
        );

        expect(error).not.toBeNull();
        expect(error!.message).toContain(OBJ_URL);
        expect(error!.message).toContain('404');
    });

    it('HTTP 正常时仍只返回几何（不取 mtllib），且既有解析层行为不变', async () =>
    {
        routeText(OBJ_URL, ['mtllib a.mtl', TRIANGLE, 'o cube', 'usemtl red', 'f 1 2 3', ''].join('\n'));

        const geometries = await loadOBJFromUrl(OBJ_URL);

        // 只请求了 OBJ 本身：loadOBJFromUrl 不加载 mtl（这一点写在文件头）
        expect(mock.requested).toEqual([OBJ_URL]);
        expect(Array.isArray(geometries)).toBe(true);
        expect(geometries.length).toBe(1);
        expect(geometries[0].__type__).toBe('CustomGeometry');
        expect(geometries[0].positions!.length).toBe(9);
        expect(Array.from(geometries[0].indices!)).toEqual([0, 1, 2]);
        // 解析层入口未被改动：parseOBJ 仍是 CustomGeometry[]，parseOBJWithMTLInfo 仍报出 mtllib
        const localGeometries = parseOBJ(['mtllib a.mtl', TRIANGLE, 'o cube', 'usemtl red', 'f 1 2 3', ''].join('\n'));
        expect(localGeometries.length).toBe(1);
        expect(localGeometries[0].__type__).toBe('CustomGeometry');
        expect(parseOBJWithMTLInfo('mtllib a.mtl\nmtllib b.mtl c.mtl\n').mtlLibs).toEqual(['a.mtl', 'b.mtl', 'c.mtl']);
    });
});
