import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * **宿主真实存在的方法**（与 `bin/serve.mjs` 的注册清单一致）。
 *
 * mock 只认这些名字——于是"把 `host.workspace.readText` 拼成 `readString`"这类错误会被抓出来，
 * 而不是静默通过。`HostFS` 是薄封装，"转发到哪个方法"正是它唯一容易错的地方，
 * 所以这条约束（而不是"有没有调用 callHost"）才是这个测试的核心。
 */
const HOST_METHODS = [
    'host.build.run',
    'host.build.status',
    'host.publish.run',
    'host.workspace.exists',
    'host.workspace.info',
    'host.workspace.isDirectory',
    'host.workspace.list',
    'host.workspace.mkdir',
    'host.workspace.readBinary',
    'host.workspace.readText',
    'host.workspace.remove',
    'host.workspace.writeBinary',
    'host.workspace.writeText',
];

/** 记录下来的调用（验"转发到哪、参数什么形状"） */
const calls: { method: string; params: Record<string, unknown> }[] = [];

/** 每个用例自己设定的应答 */
let respond: (method: string, params: Record<string, unknown>) => unknown = () =>
{
    throw new Error('这个用例没有设定应答');
};

vi.mock('../src/bridge/hostCall', () => ({
    callHost: async (method: string, params: Record<string, unknown> = {}) =>
    {
        if (!HOST_METHODS.includes(method)) throw new Error(`未知宿主方法 ${method}`);

        calls.push({ method, params });

        return respond(method, params);
    },
}));

const { HostFS } = await import('../src/assets/HostFS');

/** 造一个"文件系统"应答，够这些用例用 */
function setupFakeHost()
{
    const files = new Map<string, Uint8Array>();
    const dirs = new Set<string>(['.']);

    respond = (method, params) =>
    {
        const path = String(params.path ?? params.dir ?? '');

        switch (method)
        {
            case 'host.workspace.readText':
                return new TextDecoder().decode(files.get(path) ?? new Uint8Array());
            case 'host.workspace.readBinary':
                return bytesToBase64(files.get(path) ?? new Uint8Array());
            case 'host.workspace.writeText':
                files.set(path, new TextEncoder().encode(String(params.text)));
                return { written: path };
            case 'host.workspace.writeBinary':
                files.set(path, base64ToBytes(String(params.base64)));
                return { written: path };
            case 'host.workspace.exists':
                return files.has(path) || dirs.has(path);
            case 'host.workspace.isDirectory':
                return dirs.has(path);
            case 'host.workspace.list':
                return [...files.keys()].filter((key) => key.startsWith(path === '.' ? '' : `${path}/`))
                    .map((key) => ({ name: key.split('/').pop(), path: key, directory: false }));
            case 'host.workspace.mkdir':
                dirs.add(path);
                return { made: path };
            case 'host.workspace.remove':
                files.delete(path);
                dirs.delete(path);
                return { removed: true };
            case 'host.workspace.info':
                return { open: true, root: '/tmp/project' };
            default:
                throw new Error(`这个用例不该调 ${method}`);
        }
    };

    return { files, dirs };
}

/**
 * Uint8Array → base64（测试里自己实现，不依赖被测代码）。
 *
 * @param bytes 字节
 * @returns base64
 */
function bytesToBase64(bytes: Uint8Array): string
{
    let binary = '';

    for (const byte of bytes) binary += String.fromCharCode(byte);

    return btoa(binary);
}

/**
 * base64 → Uint8Array（同上）。
 *
 * @param base64 base64
 * @returns 字节
 */
function base64ToBytes(base64: string): Uint8Array
{
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    return bytes;
}

describe('HostFS（#274）：把宿主目录当文件系统用', () =>
{
    beforeEach(() =>
    {
        calls.length = 0;
        setupFakeHost();
    });

    it('getAbsolutePath 返回的是**项目内相对路径**（页面视角的"在哪"）', () =>
    {
        const fs = new HostFS();

        expect(fs.getAbsolutePath('./scenes/a.json')).toBe('scenes/a.json');
        expect(fs.getAbsolutePath('scenes/a.json')).toBe('scenes/a.json');
    });

    it('type 是 FSType.host（能被"当前用的是哪个 FS"这类诊断认出来）', () =>
    {
        expect(new HostFS().type).toBe('host');
    });

    it('写文本 → 读文本（走的是 readText / writeText 两个方法）', async () =>
    {
        const fs = new HostFS();

        await fs.writeString('notes/a.txt', '你好');
        expect(await fs.readString('notes/a.txt')).toBe('你好');
        expect(calls.map((call) => call.method)).toEqual(['host.workspace.writeText', 'host.workspace.readText']);
    });

    it('写 JSON → 读 JSON（缩进 4 空格，与编辑器其它 json 一致）', async () =>
    {
        const fs = new HostFS();

        await fs.writeObject('a.json', { a: 1 });
        expect(calls[0].params.text).toBe('{\n    "a": 1\n}');
        expect(await fs.readObject('a.json')).toEqual({ a: 1 });
    });

    it('**二进制往返**：ArrayBuffer → base64 → 宿主 → 读回来逐字节一致', async () =>
    {
        const fs = new HostFS();
        // 含 0 与 >127 的字节：UTF-8 文本编码会把它弄坏，所以必须走二进制那条路
        const original = new Uint8Array([0, 1, 127, 128, 200, 255]);

        await fs.writeArrayBuffer('a.bin', original.buffer);
        expect(calls[0].params.base64).toBe(bytesToBase64(original));

        const readBack = new Uint8Array(await fs.readArrayBuffer('a.bin'));

        expect([...readBack]).toEqual([...original]);
    });

    it('readdir 走 `list` 且**只回名字**（接口约定；不是把 path 也塞回去）', async () =>
    {
        const fs = new HostFS();

        await fs.writeString('scenes/a.json', '{}');
        expect(await fs.readdir('scenes')).toEqual(['a.json']);
        expect(calls.at(-1)?.params).toEqual({ dir: 'scenes' });
    });

    it('exists / isDirectory / mkdir / deleteFile 各自转发到对应的宿主方法', async () =>
    {
        const fs = new HostFS();

        await fs.mkdir('assets');
        await fs.writeString('assets/a.txt', 'x');

        expect(await fs.exists('assets/a.txt')).toBe(true);
        expect(await fs.isDirectory('assets')).toBe(true);
        expect(await fs.isDirectory('assets/a.txt')).toBe(false);

        await fs.deleteFile('assets/a.txt');
        expect(await fs.exists('assets/a.txt')).toBe(false);

        expect(calls.map((call) => call.method)).toEqual([
            'host.workspace.mkdir',
            'host.workspace.writeText',
            'host.workspace.exists',
            'host.workspace.isDirectory',
            'host.workspace.isDirectory',
            'host.workspace.remove',
            'host.workspace.exists',
        ]);
    });

    it('copyFile 是"读出再写回"（宿主侧没有 copy，也不打算为它单独加一个方法）', async () =>
    {
        const fs = new HostFS();

        await fs.writeArrayBuffer('a.bin', new Uint8Array([1, 2, 3]).buffer);
        calls.length = 0;

        await fs.copyFile('a.bin', 'b.bin');

        expect(calls.map((call) => call.method))
            .toEqual(['host.workspace.readBinary', 'host.workspace.writeBinary']);
        expect([...new Uint8Array(await fs.readArrayBuffer('b.bin'))]).toEqual([1, 2, 3]);
    });

    it('hasProject 如实反映"宿主开没开项目"（页面没有"选项目"这个动作）', async () =>
    {
        const fs = new HostFS();

        expect(await fs.hasProject()).toBe(true);

        respond = () => ({ open: false, root: null });
        expect(await fs.hasProject()).toBe(false);
    });

    it('initproject 如实把项目名回出去（不假装做了什么）', async () =>
    {
        const fs = new HostFS();

        expect(await fs.initproject('my-project')).toBe('my-project');
        // 它不该顺手调任何宿主方法
        expect(calls).toEqual([]);
    });

    it('**转发的方法名都真实存在**（mock 只认真实清单，拼错即失败）', async () =>
    {
        const fs = new HostFS();

        await fs.writeString('a.txt', 'x');
        await fs.readString('a.txt');
        await fs.exists('a.txt');
        await fs.isDirectory('.');
        await fs.readdir('.');
        await fs.mkdir('d');
        await fs.deleteFile('d');
        await fs.readObject('a.json').catch(() => undefined);
        await fs.writeObject('a.json', {});
        await fs.writeArrayBuffer('a.bin', new Uint8Array([1]).buffer);
        await fs.readArrayBuffer('a.bin');
        await fs.copyFile('a.bin', 'b.bin');
        await fs.hasProject();

        // 每个调用都能在真实清单里找到（mock 已经在调用时挡过了）
        for (const call of calls) expect(HOST_METHODS).toContain(call.method);
    });
});
