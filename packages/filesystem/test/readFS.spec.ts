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
        const b = makeFakeFS(FSType.native, 'B');
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
        expect(new ReadFS(makeFakeFS(FSType.native)).type).toBe(FSType.native);
    });

    it('type 随 fs 切换而变化', () =>
    {
        const rs = new ReadFS(makeFakeFS(FSType.http));
        expect(rs.type).toBe(FSType.http);

        rs.fs = makeFakeFS(FSType.native);
        expect(rs.type).toBe(FSType.native);
    });
});

/**
 * `readStrings`：**优先批量、退回并发**（#274）。
 *
 * 这条链把两件事连起来：引擎侧的 `ReadFS` **只认接口**（`IReadFS.readStrings` 是可选的），
 * 宿主侧的 `HostFS` 恰好实现了它。所以这里要守的**两向**都得验：
 *
 * - 底层**有**批量能力 → 真的走批量（一次调用，不是偷偷退回逐个——否则"接了批量"只是说法）；
 * - 底层**没有** → 退回**并发**逐个（不是串行：宿主 FS 串行比并发慢 20× 以上）。
 *
 * 外加一条最容易含糊过去的：**两条通路的结果必须逐项一致**（含失败时的错误消息）。
 * 批量只是"更快的同一条路"，不是"另一套语义"。
 */
describe('ReadFS.readStrings：优先批量、退回并发（#274）', () =>
{
    it('底层**没有**批量能力时退回**并发**逐个', async () =>
    {
        const fake = makeFakeFS(FSType.native, 'A');
        const rs = new ReadFS(fake);

        expect(await rs.readStrings(['a.txt', 'b.txt'])).toEqual(['text:A:a.txt', 'text:A:b.txt']);
        expect(fake.calls.map((c) => c.method)).toEqual(['readString', 'readString']);
    });

    it('★ 底层**有**批量能力时走批量（一次调用，不再逐个读）', async () =>
    {
        const fake = makeFakeFS(FSType.host, 'H');
        const batchArgs: string[][] = [];

        fake.readStrings = async (paths) =>
        {
            batchArgs.push(paths);

            return paths.map((path) => ({ path, text: `batch:${path}` }));
        };

        const rs = new ReadFS(fake);

        expect(await rs.readStrings(['a.txt', 'b.txt'])).toEqual(['batch:a.txt', 'batch:b.txt']);
        // 一次调用，且**入参顺序原样传下去**（批量实现要按这个顺序回结果）
        expect(batchArgs).toEqual([['a.txt', 'b.txt']]);
        // 没有偷偷逐个读
        expect(fake.calls).toEqual([]);
    });

    it('★ 批量与逐个的**结果逐项一致**（同一份底层数据，两条通路相等）', async () =>
    {
        const files = new Map([['a.txt', 'AAA'], ['b.txt', 'BBB'], ['c/d.txt', 'CCC']]);
        const paths = ['a.txt', 'b.txt', 'c/d.txt'];

        const withBatch = makeFakeFS(FSType.host, 'H');
        withBatch.readString = async (path) => files.get(path) ?? '';
        withBatch.readStrings = async (list) => list.map((path) => ({ path, text: files.get(path) ?? '' }));

        const withoutBatch = makeFakeFS(FSType.host, 'H');
        withoutBatch.readString = async (path) => files.get(path) ?? '';

        const byBatch = await new ReadFS(withBatch).readStrings(paths);
        const byFallback = await new ReadFS(withoutBatch).readStrings(paths);

        expect(byBatch).toEqual(['AAA', 'BBB', 'CCC']);
        expect(byBatch).toEqual(byFallback);
    });

    it('★ 批量里某条失败：抛出的**原因**与逐个读失败时一致', async () =>
    {
        const readOne = async (path: string) =>
        {
            if (path === 'bad.txt') throw new Error('读不到 bad.txt');

            return 'ok';
        };

        const batched = makeFakeFS(FSType.host, 'H');
        batched.readString = readOne;
        batched.readStrings = async (paths) => paths.map((path) => (path === 'bad.txt'
            ? { path, error: '读不到 bad.txt' }
            : { path, text: 'ok' }));

        const plain = makeFakeFS(FSType.host, 'H');
        plain.readString = readOne;

        const reasonOf = (fs: ReturnType<typeof makeFakeFS>) =>
            new ReadFS(fs).readStrings(['ok.txt', 'bad.txt']).then(() => null, (error: Error) => error.message);

        expect(await reasonOf(batched)).toBe('读不到 bad.txt');
        expect(await reasonOf(plain)).toBe('读不到 bad.txt');
    });

    it('批量实现"既没内容也没原因"→ 如实抛错（不让坏实现静默返回 undefined）', async () =>
    {
        const fake = makeFakeFS(FSType.host, 'H');

        fake.readStrings = async (paths) => paths.map((path) => ({ path }));

        await expect(new ReadFS(fake).readStrings(['a.txt'])).rejects.toThrow(/既没有内容也没有失败原因/);
    });

    it('空路径列表：不该出错（也不需要真的读什么）', async () =>
    {
        const fake = makeFakeFS(FSType.host, 'H');

        fake.readStrings = async (paths) => paths.map((path) => ({ path, text: '不该被读到' }));

        expect(await new ReadFS(fake).readStrings([])).toEqual([]);
    });
});
