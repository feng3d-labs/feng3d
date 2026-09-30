import { beforeEach, describe, expect, it, vi } from 'vitest';
import JSZip from 'jszip';

// `saveAs` 会触发浏览器下载，测试里换成 spy，好从它的入参把产出的 zip 取回来
vi.mock('file-saver', () => ({ saveAs: vi.fn() }));

import { saveAs } from 'file-saver';
import { EditorRS } from '../src/assets/EditorRS';

/**
 * issue #338：`EditorRS` 的 zip 导出/导入**回调永不执行**。
 *
 * 原实现是 `filepaths.map((p) => async () => {...})`——`map` 返回的是**函数数组**，
 * `Promise.all` 对"非 thenable"直接算完成，于是**里面那个 async 函数从未被调用**：
 * 导出得到空 zip（还照样弹下载），导入静默什么都不写。
 *
 * 修法是把 `() => async (p) =>` 换回 `async (p) =>`（正确写法见 `AssetNode.ts:369`）。
 * 下面的用例在**修复前会失败**（zip 里一个文件都没有），修复后通过。
 */

/** 内存可读写文件系统：只实现 EditorRS 在这两条链路上用到的方法 */
class MemoryFS
{
    /** 路径 → 内容（目录用 null 标记） */
    readonly entries = new Map<string, Uint8Array | null>();

    constructor(files: Record<string, string> = {})
    {
        for (const [path, text] of Object.entries(files))
        {
            this.entries.set(path, new TextEncoder().encode(text));
        }
    }

    async getAllPathsInFolder(folderpath: string): Promise<string[]>
    {
        const prefix = folderpath === '' ? '' : `${folderpath}/`;

        return [...this.entries.keys()].filter((p) => p.startsWith(prefix));
    }

    async isDirectory(path: string): Promise<boolean>
    {
        return this.entries.get(path) === null;
    }

    async readArrayBuffer(path: string): Promise<ArrayBuffer | undefined>
    {
        const data = this.entries.get(path);

        if (!data) return undefined;
        // 复制一份，避免测试之间共享同一个 buffer
        return data.slice().buffer;
    }

    async mkdir(path: string): Promise<void>
    {
        this.entries.set(path, null);
    }

    async writeFile(path: string, data: ArrayBuffer): Promise<void>
    {
        this.entries.set(path, new Uint8Array(data.slice(0)));
    }

    /** 取文本内容，便于断言 */
    text(path: string): string | undefined
    {
        const data = this.entries.get(path);

        return data ? new TextDecoder().decode(data) : undefined;
    }
}

function makeRS(files: Record<string, string> = {}): { rs: EditorRS, fs: MemoryFS }
{
    const fs = new MemoryFS(files);

    // 构造签名是 (fs?: ReadWriteFS)，但内存实现只覆盖了用到的部分
    const rs = new EditorRS(fs as never);

    return { rs, fs };
}

/** 把 saveAs 收到的那份 blob 解析回 JSZip，用来断言产物内容 */
async function zipFromSaveAs(): Promise<JSZip>
{
    const calls = (saveAs as unknown as { mock: { calls: unknown[][] } }).mock.calls;

    expect(calls.length).toBeGreaterThan(0);

    const blob = calls[calls.length - 1][0] as Blob;

    return JSZip.loadAsync(blob);
}

describe('EditorRS 的 zip 导出/导入（issue #338）', () =>
{
    beforeEach(() =>
    {
        (saveAs as unknown as { mockClear: () => void }).mockClear();
    });

    it('导出：zip 里真的有文件，且内容与文件系统一致', async () =>
    {
        const { rs } = makeRS({ 'a.txt': 'hello', 'dir/b.txt': 'world' });

        await rs.exportFilesToJSZip('out.zip', ['a.txt', 'dir/b.txt']);

        const zip = await zipFromSaveAs();

        // 修复前：zip 里一个文件都没有（回调没执行），这两条会失败
        expect(await zip.file('a.txt')?.async('string')).toBe('hello');
        expect(await zip.file('dir/b.txt')?.async('string')).toBe('world');
    });

    it('导出：saveAs 收到的文件名与调用方一致', async () =>
    {
        const { rs } = makeRS({ 'a.txt': 'x' });

        await rs.exportFilesToJSZip('我的项目.zip', ['a.txt']);

        const calls = (saveAs as unknown as { mock: { calls: unknown[][] } }).mock.calls;

        expect(calls[calls.length - 1][1]).toBe('我的项目.zip');
    });

    it('导入：zip 里的文件与目录真的被写进文件系统', async () =>
    {
        const zip = new JSZip();

        zip.file('a.txt', 'hello');
        zip.folder('sub');
        zip.file('sub/b.txt', 'world');

        const blob = await zip.generateAsync({ type: 'blob' });
        const { rs, fs } = makeRS();

        await rs.importProject(blob as unknown as File);

        // 修复前：整段回调不执行，下面每一条都会失败
        expect(fs.text('a.txt')).toBe('hello');
        expect(fs.text('sub/b.txt')).toBe('world');
        // 注意：JSZip 的目录 key **带尾斜杠**（`sub/`），所以 importProject 调的是 `mkdir('sub/')`。
        // 这是既有行为（filepaths 直接取自 `Object.keys(value.files)`），本 issue 不改它，
        // 这里如实按 `'sub/'` 断言——顺带把这个事实固定下来，免得以后有人以为目录名是 `sub`。
        expect(fs.entries.get('sub/')).toBeNull();
    });

    it('往返等价：导出后再导入到空文件系统，文件集合与内容一致', async () =>
    {
        const source = { 'a.txt': 'hello', 'dir/b.txt': 'world', 'dir/c.txt': 'again' };
        const { rs: exporter } = makeRS(source);

        await exporter.exportFilesToJSZip('out.zip', Object.keys(source));

        const zip = await zipFromSaveAs();
        const blob = await zip.generateAsync({ type: 'blob' });
        const { rs: importer, fs: target } = makeRS();

        await importer.importProject(blob as unknown as File);

        for (const [path, text] of Object.entries(source))
        {
            expect(target.text(path)).toBe(text);
        }
    });
});
