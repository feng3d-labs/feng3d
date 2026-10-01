import { describe, expect, it } from 'vitest';

import { FS } from '../src/FS';
// HttpFS 在被 import 时会执行模块级的 `FS.basefs = new HttpFS();` —— 这是 basefs 的来源，
// 不引入它的话 FS.basefs 就是 undefined（测试环境里没有别的模块会装它）。
import '../src/HttpFS';
import { FSType } from '../src/FSType';
import { IReadFS } from '../src/IReadFS';
import { ReadFS } from '../src/ReadFS';

/**
 * `ReadFS`（filesystem 包；81 行，此前没测）。
 *
 * 它是个**纯代理**：自己不读文件，所有调用都转发给 `this.fs`，而 `fs` 的 getter 在
 * **未显式设置时回退到 `FS.basefs`**：
 *
 * ```ts
 * get fs(): IReadFS { return this._fs || FS.basefs; }
 * set fs(v: IReadFS | undefined) { this._fs = v; }
 * ```
 *
 * 所以真正值得钉的是**代理语义**，而不是"能不能读文件"：
 * - 未设置 → 回退到 `FS.basefs`；
 * - **切换 `fs` 之后，转发目标随之改变**（这是"代理"最容易写错的地方）；
 * - 每个方法都**原样转发参数**、并**原样返回结果**。
 */

interface Call { method: string; path: string }

/** 记录调用的假文件系统 */
function makeFakeFS(type: FSType = FSType.http, tag = 'A')
{
    const calls: Call[] = [];

    const fake = {
        calls,
        type,
        async readArrayBuffer(path: string)
        {
            calls.push({ method: 'readArrayBuffer', path });

            return `buffer:${tag}:${path}`;
        },
        async readString(path: string)
        {
            calls.push({ method: 'readString', path });

            return `text:${tag}:${path}`;
        },
        async readObject(path: string)
        {
            calls.push({ method: 'readObject', path });

            return { tag, path };
        },
        async readImage(path: string)
        {
            calls.push({ method: 'readImage', path });

            return `image:${tag}:${path}`;
        },
        getAbsolutePath(path: string)
        {
            calls.push({ method: 'getAbsolutePath', path });

            return `abs:${tag}:${path}`;
        },
    };

    return fake as typeof fake & IReadFS;
}

describe('ReadFS（filesystem 包）', () =>
{
    it('★ 未显式设置 fs 时回退到 FS.basefs', () =>
    {
        const rs = new ReadFS();

        // FS.basefs 是模块级默认：HttpFS 在被 import 时把自己装了进去（见文件顶部 import）
        expect(FS.basefs, 'FS.basefs 应当已由 HttpFS 的模块级副作用装好').toBeTruthy();
        expect(rs.fs).toBe(FS.basefs);
    });

    it('constructor(fs) 会把它设为底层文件系统', () =>
    {
        const fake = makeFakeFS();
        const rs = new ReadFS(fake);

        expect(rs.fs).toBe(fake);
    });

    it('★ 切换 fs 之后，转发目标随之改变（代理的核心语义）', async () =>
    {
        const a = makeFakeFS(FSType.http, 'A');
        const b = makeFakeFS(FSType.indexedDB, 'B');
        const rs = new ReadFS(a);

        expect(await rs.readString('x.txt')).toBe('text:A:x.txt');
        expect(a.calls.length).toBe(1);
        expect(b.calls.length).toBe(0);

        rs.fs = b;

        expect(await rs.readString('x.txt')).toBe('text:B:x.txt');
        expect(a.calls.length).toBe(1);   // a 不再被调用
        expect(b.calls.length).toBe(1);
    });

    it('把 fs 设为 undefined 会退回 basefs', () =>
    {
        const fake = makeFakeFS();
        const rs = new ReadFS(fake);

        rs.fs = undefined;

        expect(rs.fs).toBe(FS.basefs);
        expect(rs.fs).not.toBe(fake);
    });

    it('readArrayBuffer / readString / readObject / readImage 都原样转发并原样返回', async () =>
    {
        const fake = makeFakeFS(FSType.http, 'X');
        const rs = new ReadFS(fake);

        expect(await rs.readArrayBuffer('a.bin')).toBe('buffer:X:a.bin');
        expect(await rs.readString('a.txt')).toBe('text:X:a.txt');
        expect(await rs.readObject('a.json')).toEqual({ tag: 'X', path: 'a.json' });
        expect(await rs.readImage('a.png')).toBe('image:X:a.png');

        expect(fake.calls.map((c) => c.method)).toEqual(['readArrayBuffer', 'readString', 'readObject', 'readImage']);
        expect(fake.calls.map((c) => c.path)).toEqual(['a.bin', 'a.txt', 'a.json', 'a.png']);
    });

    it('getAbsolutePath 转发（同步方法）', () =>
    {
        const fake = makeFakeFS(FSType.http, 'X');
        const rs = new ReadFS(fake);

        expect(rs.getAbsolutePath('p/q.png')).toBe('abs:X:p/q.png');
    });

    it('type 从底层 fs 读取', () =>
    {
        expect(new ReadFS(makeFakeFS(FSType.http)).type).toBe(FSType.http);
        expect(new ReadFS(makeFakeFS(FSType.indexedDB)).type).toBe(FSType.indexedDB);
    });

    it('type 随 fs 切换而变化', () =>
    {
        const rs = new ReadFS(makeFakeFS(FSType.http));
        expect(rs.type).toBe(FSType.http);

        rs.fs = makeFakeFS(FSType.indexedDB);
        expect(rs.type).toBe(FSType.indexedDB);
    });
});
