import { describe, expect, it, vi } from 'vitest';

// ⚠️ dataTransform 的真实实现依赖浏览器 FileReader（本包没有 browser-stub，
// loaderHttpStatus.spec.ts 的做法是"按需内联 stub"）。这里直接替换成确定性的 Node 实现，
// 让本 spec 只验证「ReadWriteFS 把 ArrayBuffer 交给了哪个方法」，不依赖 polyfill 内部。
vi.mock('@feng3d/polyfill', () => ({
    dataTransform: {
        arrayBufferToString: async (ab: ArrayBuffer) => new TextDecoder().decode(ab),
        arrayBufferToObject: async (ab: ArrayBuffer) => JSON.parse(new TextDecoder().decode(ab)),
    },
}));

import { ReadWriteFS } from '../src/ReadWriteFS';
import type { IReadWriteFS } from '../src/IReadWriteFS';

/**
 * `ReadWriteFS`（`packages/filesystem/src/ReadWriteFS.ts`，287 行，此前**未被任何 spec 触及**）。
 *
 * 它 `extends ReadFS`，是**可写文件系统的代理**：绝大多数方法只是转发给 `this.fs`
 * （构造参数注入，未注入时回退到 `FS.basefs`，见 `ReadFS`）。
 *
 * **真正有逻辑的三处**（本文件重点覆盖）：
 *
 * 1. **`writeFile(path, arraybuffer)` 按扩展名分派**。实测的分派表是
 *    `{ meta: 'txt', json: 'object', jpg/png/mp3: 'arraybuffer', js: 'txt', ts: 'txt', … }`：
 *    - `'txt'` → `fs.writeString`
 *    - `'object'` → `fs.writeObject`
 *    - `'arraybuffer'` → `this.writeArrayBuffer`
 *    - **其它（包括不在表里的 `txt` 小写扩展名）→ `console.error('无法导入文件 …')`，不写文件**；
 *    另有**特例**：`tsconfig.json` 与 `.vscode/settings.json` **强制走 `txt` 分支**；
 * 2. **`moveFiles` = `copyFiles(movelists.concat())` 然后 `deleteFiles(源路径)`**
 *    （传 `concat()` 副本，因为紧接着要用原数组取源路径）；
 * 3. 批量方法都是 `Promise.all(list.map(...))`。
 *
 * 测试用**记录调用的假 fs** 驱动，不需要真实文件系统。
 */

interface FakeCall { method: string; args: unknown[] }

/** 记录所有调用的假文件系统（只实现本文件用到的方法，末尾整体断言成 IReadWriteFS） */
function makeFakeFs()
{
    const calls: FakeCall[] = [];
    const rec = (method: string) =>
        (...args: unknown[]) =>
        {
            calls.push({ method, args });

            return Promise.resolve(undefined);
        };

    const fs = {
        calls,
        exists: rec('exists'),
        readdir: rec('readdir'),
        mkdir: rec('mkdir'),
        deleteFile: rec('deleteFile'),
        writeString: rec('writeString'),
        writeObject: rec('writeObject'),
        writeArrayBuffer: rec('writeArrayBuffer'),
        copyFile: rec('copyFile'),
        isDirectory: rec('isDirectory'),
    };

    return fs;
}

const utf8 = (s: string) => new TextEncoder().encode(s).buffer as ArrayBuffer;
const methodsOf = (calls: FakeCall[]) => calls.map((c) => c.method);

describe('ReadWriteFS（filesystem）', () =>
{
    describe('转发给注入的 fs', () =>
    {
        it('★ exists / readdir / mkdir / deleteFile / isDirectory / copyFile 都转发', async () =>
        {
            const fs = makeFakeFs();
            const rwfs = new ReadWriteFS(fs as unknown as IReadWriteFS);

            await rwfs.exists('a.txt');
            await rwfs.readdir('dir');
            await rwfs.mkdir('newdir');
            await rwfs.deleteFile('gone.txt');
            await rwfs.isDirectory('dir');
            await rwfs.copyFile('a', 'b');

            // ⚠️ isDirectory 内部会**再调一次 exists**，所以不断言完整序列，只断言每个该发生的调用都发生了
            const ms = methodsOf(fs.calls);

            for (const m of ['exists', 'readdir', 'mkdir', 'deleteFile', 'isDirectory', 'copyFile'])
            {
                expect(ms, m).toContain(m);
            }
            expect(fs.calls[0].args).toEqual(['a.txt']);
            expect(fs.calls.filter((c) => c.method === 'copyFile')[0].args).toEqual(['a', 'b']);
        });
    });

    describe('★ writeFile 按扩展名分派', () =>
    {
        it('★★ .meta / .js / .ts → fs.writeString', async () =>
        {
            for (const name of ['asset.meta', 'main.js', 'main.ts'])
            {
                const fs = makeFakeFs();
                const rwfs = new ReadWriteFS(fs as unknown as IReadWriteFS);

                await rwfs.writeFile(name, utf8('hello'));

                expect(methodsOf(fs.calls), name).toEqual(['writeString']);
                expect(fs.calls[0].args[0], name).toBe(name);
                expect(fs.calls[0].args[1], name).toBeTypeOf('string');
            }
        });

        it('★★ .json → fs.writeObject（内容被解析成对象）', async () =>
        {
            const fs = makeFakeFs();
            const rwfs = new ReadWriteFS(fs as unknown as IReadWriteFS);

            await rwfs.writeFile('data.json', utf8('{"a":1}'));

            expect(methodsOf(fs.calls)).toEqual(['writeObject']);
            expect(fs.calls[0].args[1]).toEqual({ a: 1 });
        });

        it('★★ .png / .jpg / .mp3 → writeArrayBuffer（原样透传 ArrayBuffer）', async () =>
        {
            for (const name of ['pic.png', 'pic.jpg', 'sound.mp3'])
            {
                const fs = makeFakeFs();
                const rwfs = new ReadWriteFS(fs as unknown as IReadWriteFS);
                const buf = utf8('binary');

                await rwfs.writeFile(name, buf);

                // ⚠️ writeArrayBuffer 的实现内部会先 exists / mkdir，所以断言"包含"而不是完整序列
                const ms = methodsOf(fs.calls);

                expect(ms, name).toContain('writeArrayBuffer');
                const call = fs.calls.find((c) => c.method === 'writeArrayBuffer')!;

                expect(call.args[0], name).toBe(name);
                expect(call.args[1], name).toBe(buf);   // ArrayBuffer 原样透传
            }
        });

        it('★★ 未知扩展名 → console.error("无法导入文件 …")，且不写任何东西', async () =>
        {
            const fs = makeFakeFs();
            const rwfs = new ReadWriteFS(fs as unknown as IReadWriteFS);
            const spy = vi.spyOn(console, 'error').mockImplementation(() => { /* 静音 */ });

            try
            {
                await rwfs.writeFile('weird.xyz', utf8('?'));

                expect(fs.calls.length).toBe(0);
                expect(spy).toHaveBeenCalledTimes(1);
                expect(String(spy.mock.calls[0][0])).toContain('无法导入文件');
                expect(String(spy.mock.calls[0][0])).toContain('weird.xyz');
            }
            finally
            {
                spy.mockRestore();
            }
        });

        it('★ 实测：小写 .txt 不在分派表里，因此也走"无法导入文件"', async () =>
        {
            const fs = makeFakeFs();
            const rwfs = new ReadWriteFS(fs as unknown as IReadWriteFS);
            const spy = vi.spyOn(console, 'error').mockImplementation(() => { /* 静音 */ });

            try
            {
                await rwfs.writeFile('note.txt', utf8('hi'));

                expect(fs.calls.length).toBe(0);
                expect(String(spy.mock.calls[0][0])).toContain('无法导入文件');
            }
            finally
            {
                spy.mockRestore();
            }
        });

        it('★★ tsconfig.json / .vscode/settings.json 是特例：走 writeString（而不是 writeObject）', async () =>
        {
            for (const name of ['tsconfig.json', '.vscode/settings.json'])
            {
                const fs = makeFakeFs();
                const rwfs = new ReadWriteFS(fs as unknown as IReadWriteFS);

                await rwfs.writeFile(name, utf8('{ "compilerOptions": {} }'));

                expect(methodsOf(fs.calls), name).toEqual(['writeString']);
            }
        });
    });

    describe('★ 批量方法', () =>
    {
        it('★ deleteFiles 对每个路径调用 deleteFile', async () =>
        {
            const fs = makeFakeFs();
            const rwfs = new ReadWriteFS(fs as unknown as IReadWriteFS);

            await rwfs.deleteFiles(['a', 'b', 'c']);

            expect(methodsOf(fs.calls)).toEqual(['deleteFile', 'deleteFile', 'deleteFile']);
            expect(fs.calls.map((c) => c.args[0])).toEqual(['a', 'b', 'c']);
        });

        it('★ copyFiles 对每一对调用 copyFile', async () =>
        {
            const fs = makeFakeFs();
            const rwfs = new ReadWriteFS(fs as unknown as IReadWriteFS);

            await rwfs.copyFiles([['a', 'x'], ['b', 'y']]);

            expect(methodsOf(fs.calls)).toEqual(['copyFile', 'copyFile']);
            expect(fs.calls.map((c) => c.args)).toEqual([['a', 'x'], ['b', 'y']]);
        });

        it('★★ moveFiles = 先 copyFiles 再 deleteFiles（删的是源路径）', async () =>
        {
            const fs = makeFakeFs();
            const rwfs = new ReadWriteFS(fs as unknown as IReadWriteFS);

            await rwfs.moveFiles([['src1', 'dst1'], ['src2', 'dst2']]);

            expect(methodsOf(fs.calls)).toEqual(['copyFile', 'copyFile', 'deleteFile', 'deleteFile']);

            const copies = fs.calls.filter((c) => c.method === 'copyFile').map((c) => c.args);
            const deletes = fs.calls.filter((c) => c.method === 'deleteFile').map((c) => c.args[0]);

            expect(copies).toEqual([['src1', 'dst1'], ['src2', 'dst2']]);
            expect(deletes).toEqual(['src1', 'src2']);   // 删的是源，不是目标
        });

        it('★ moveFiles 不修改传入的数组（实现里先做 concat 副本）', async () =>
        {
            const fs = makeFakeFs();
            const rwfs = new ReadWriteFS(fs as unknown as IReadWriteFS);
            const lists: [string, string][] = [['s1', 'd1']];
            const snapshot = JSON.stringify(lists);

            await rwfs.moveFiles(lists);

            expect(JSON.stringify(lists)).toBe(snapshot);
        });

        it('空列表时批量方法不抛异常、也不调用底层', async () =>
        {
            const fs = makeFakeFs();
            const rwfs = new ReadWriteFS(fs as unknown as IReadWriteFS);

            await rwfs.deleteFiles([]);
            await rwfs.copyFiles([]);
            await rwfs.moveFiles([]);

            expect(fs.calls.length).toBe(0);
        });
    });

    /**
     * `getAllPathsInFolder`：**能批量就批量、不能就并发**（#274）。
     *
     * 它原来有两处串行：列目录只拿名字、再对**每个**条目问一次 `isDirectory`。
     * 在宿主 FS 上那就是"每个条目多两趟 HTTP"（实测串行读 40 个文件 1137ms、并发 44ms）。
     *
     * 这里守三件事：
     * 1. 底层有 `readdirWithTypes`（宿主 FS 有）→ **一次列目录拿到类型**，`isDirectory` 一次都不问；
     * 2. 底层没有 → 退回并发问（不是串行）；
     * 3. **两条通路的路径列表逐项相等**（批量只是更快的同一条路，不是另一套结果）。
     *
     * 第 2 条的"并发"用**只有并发才可能过**的判据，不靠耗时阈值：串行时同时在飞的请求恒为 1。
     */
    describe('★ getAllPathsInFolder：能批量就批量、不能就并发（#274）', () =>
    {
        /** 目录树：key 是目录（`''` 是根），value 是该目录下的条目名 */
        const TREE: Record<string, string[]> = {
            '': ['a.txt', 'sub'],
            sub: ['b.txt', 'deep'],
            'sub/deep': ['c.txt'],
        };

        /** BFS 顺序的期望结果（与实现无关，照定义写死） */
        const EXPECTED = ['a.txt', 'sub', 'sub/b.txt', 'sub/deep', 'sub/deep/c.txt'];

        const isDirPath = (path: string) => Object.prototype.hasOwnProperty.call(TREE, path);

        /**
         * 造一个假 FS：目录树固定，`isDirectory` **故意慢 5ms**（好让并发与串行的形状可区分）。
         *
         * @param withTypes 是否提供 `readdirWithTypes`（= 底层有没有批量能力）
         */
        function makeTreeFs(withTypes: boolean)
        {
            const calls: FakeCall[] = [];
            /** 同时在飞的 isDirectory 数量（并发判据；串行下恒为 1） */
            const probe = { inFlight: 0, maxInFlight: 0 };

            const fs: Record<string, unknown> = {
                calls,
                probe,
                readdir: async (dir: string) =>
                {
                    calls.push({ method: 'readdir', args: [dir] });

                    return TREE[dir] ?? [];
                },
                isDirectory: async (path: string) =>
                {
                    calls.push({ method: 'isDirectory', args: [path] });
                    probe.inFlight++;
                    probe.maxInFlight = Math.max(probe.maxInFlight, probe.inFlight);
                    await new Promise((resolve_) => setTimeout(resolve_, 5));
                    probe.inFlight--;

                    return isDirPath(path);
                },
            };

            if (withTypes)
            {
                fs.readdirWithTypes = async (dir: string) =>
                {
                    calls.push({ method: 'readdirWithTypes', args: [dir] });

                    return (TREE[dir] ?? []).map((name) => ({
                        name,
                        directory: isDirPath(dir === '' ? name : `${dir}/${name}`),
                    }));
                };
            }

            return fs as unknown as IReadWriteFS & { calls: FakeCall[], probe: { maxInFlight: number } };
        }

        it('★ 底层有 readdirWithTypes → 一次列目录拿到类型，**isDirectory 一次都不问**', async () =>
        {
            const fs = makeTreeFs(true);
            const rwfs = new ReadWriteFS(fs);

            expect(await rwfs.getAllPathsInFolder('')).toEqual(EXPECTED);
            expect(methodsOf(fs.calls)).not.toContain('isDirectory');
            expect(fs.calls.filter((c) => c.method === 'readdirWithTypes').length).toBe(3);
        });

        it('★ 底层没有 → 退回**并发**问类型（"只有并发才可能过"的判据，不靠耗时）', async () =>
        {
            const fs = makeTreeFs(false);
            const rwfs = new ReadWriteFS(fs);

            expect(await rwfs.getAllPathsInFolder('')).toEqual(EXPECTED);
            // 5 个条目 = 5 次 isDirectory；**同时最多有 >1 个在飞** ⇒ 不是串行
            expect(fs.calls.filter((c) => c.method === 'isDirectory').length).toBe(5);
            expect(fs.probe.maxInFlight).toBeGreaterThan(1);
        });

        it('★ 两条通路的路径列表**逐项相等**（批量只更快，不改结果）', async () =>
        {
            const byBatch = await new ReadWriteFS(makeTreeFs(true)).getAllPathsInFolder('');
            const byProbe = await new ReadWriteFS(makeTreeFs(false)).getAllPathsInFolder('');

            expect(byBatch).toEqual(byProbe);
            expect(byBatch).toEqual(EXPECTED);
        });

        it('子目录入参：起点是那个子目录（路径以它为前缀）', async () =>
        {
            const fs = makeTreeFs(true);

            expect(await new ReadWriteFS(fs).getAllPathsInFolder('sub')).toEqual(['sub/b.txt', 'sub/deep', 'sub/deep/c.txt']);
        });
    });
});
