// 先加载 feng3d 让循环依赖（FileAsset → feng3d → assets/index → ArrayBufferAsset → FileAsset）
// 的入口从 feng3d 这一侧进入，避免 FileAsset 在自身初始化过程中被反向 import 成 undefined
import 'feng3d';
import { describe, expect, it, vi } from 'vitest';
import { ReadRS } from 'feng3d';
import type { Object3D } from 'feng3d';
import { serialization } from '@feng3d/serialization';
import { isLegacyAssetData, isPureDataAssetData } from '../src/ObjectAsset';
import { Object3DAsset } from '../src/assets/Object3DAsset';
import type { ReadWriteRS } from '../src/rs/ReadWriteRS';

/**
 * "对象存为资源"的读回链路（issue #113 缺口 1）。
 *
 * 背景：`ObjectAsset.saveFile` 写出的是 `serialization.serialize` 的**纯数据**
 * （`__type__` 字面量、无 `__class__`），而 `readFile` 原先无条件走
 * `ReadRS.deserializeWithAssets`（取 `object['__class__']` → `classUtils.getInstanceByName`），
 * 于是保存出去的对象资源读不回来（实测 `无法获取名称为 undefined 的实例!`）。
 *
 * 这些用例走的是**真实的 `saveFile` / `readFile`**，只把文件系统换成内存实现——
 * 不用 `node:fs`（本包 tsconfig 未开 node 类型），也不碰真实磁盘。
 */
class MemoryAssetStorage
{
    /** 写出的文件内容，按路径存放 */
    readonly written: Record<string, unknown> = {};

    /** 旧链路（`deserializeWithAssets`）收到的载荷，用来断言分流走向 */
    readonly legacyObjects: unknown[] = [];

    /** 内存文件系统：写与读共用一份数据，模拟落盘再读回 */
    readonly fs = {
        writeObject: async (path: string, object: unknown) => { this.written[path] = object; },
        readObject: async (path: string) => this.written[path],
    };

    /** 旧链路替身：记录调用并回一个可辨识的实例 */
    async deserializeWithAssets(object: unknown)
    {
        this.legacyObjects.push(object);

        return { __type__: 'Object3D', name: '来自旧链路' };
    }
}

/** 造一个挂到内存文件系统上的对象资源 */
function createAsset(storage: MemoryAssetStorage, assetPath = 'Assets/Root.gameobject.json')
{
    const asset = new Object3DAsset();

    asset.rs = storage as unknown as ReadWriteRS;
    asset.assetPath = assetPath;
    asset.assetId = 'asset-1';

    return asset;
}

/** 造一棵三层嵌套、每层带组件的对象子树 */
function buildTree(): Object3D
{
    return {
        __type__: 'Object3D',
        name: 'Root',
        position: { x: 1, y: 2, z: 3 },
        children: [
            {
                __type__: 'Object3D',
                name: 'Middle',
                components: [
                    {
                        __type__: 'MeshRenderer',
                        geometry: { __type__: 'CubeGeometry', width: 2 },
                        material: {
                            __type__: 'StandardMaterial',
                            uniforms: { u_diffuse: { __type__: 'Color4', r: 0.9, g: 0.45, b: 0.2, a: 1 } },
                        },
                    },
                ],
                children: [
                    { __type__: 'Object3D', name: 'Leaf', activeSelf: false },
                ],
            },
            { __type__: 'Object3D', name: 'Sibling' },
        ],
    } as unknown as Object3D;
}

/** 走一遍真实落盘会经历的 JSON 化（去掉 undefined、断开引用） */
function throughJson(value: unknown): unknown
{
    return JSON.parse(JSON.stringify(value)) as unknown;
}

/** 取出子树上的 children，便于断言层级与顺序 */
function childrenOf(object: unknown): { name: string, children?: { name: string }[], components?: unknown[] }[]
{
    return (object as { children: { name: string, children?: { name: string }[], components?: unknown[] }[] }).children;
}

describe('ObjectAsset 读回纯数据资源（issue #113 缺口 1）', () =>
{
    it('往返：saveFile 写出的纯数据能被 readFile 读回，结构等价', async () =>
    {
        const storage = new MemoryAssetStorage();
        const source = createAsset(storage);

        source.data = buildTree();
        await source.saveFile();

        const saved = storage.written[source.assetPath] as Record<string, unknown>;

        // 写出形态就是纯数据：有 __type__、没有 __class__
        expect(isPureDataAssetData(saved)).toBe(true);
        expect(JSON.stringify(saved)).not.toContain('__class__');

        // 读回（修复前这里会抛 `无法获取名称为 undefined 的实例!`）
        const target = createAsset(storage);
        await target.readFile();

        // 纯数据不该落到旧链路上
        expect(storage.legacyObjects).toHaveLength(0);
        // 结构等价：读回后再序列化，与写出的载荷一致（含嵌套组件与构造参数）
        expect(throughJson(serialization.serialize(target.data))).toEqual(throughJson(saved));
    });

    it('往返：__type__ 与 children 的层级、顺序都保留', async () =>
    {
        const storage = new MemoryAssetStorage();
        const source = createAsset(storage);

        source.data = buildTree();
        await source.saveFile();

        const target = createAsset(storage);
        await target.readFile();

        expect((target.data as { __type__?: string }).__type__).toBe('Object3D');
        expect((target.data as { name?: string }).name).toBe('Root');

        const children = childrenOf(target.data);

        expect(children.map((c) => c.name)).toEqual(['Middle', 'Sibling']);
        expect(children[0].children!.map((c) => c.name)).toEqual(['Leaf']);
        // 深层节点的 __type__ 也要在（序列化保留类型字面量）
        expect((children[0].children![0] as { __type__?: string }).__type__).toBe('Object3D');
        // 组件及其构造参数保留
        expect(children[0].components).toEqual([
            {
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry', width: 2 },
                material: {
                    __type__: 'StandardMaterial',
                    uniforms: { u_diffuse: { __type__: 'Color4', r: 0.9, g: 0.45, b: 0.2, a: 1 } },
                },
            },
        ]);
    });

    it('回归（核心）：修复前必然失败的路径现在成功', async () =>
    {
        const storage = new MemoryAssetStorage();
        const source = createAsset(storage);

        source.data = buildTree();
        await source.saveFile();

        const saved = throughJson(storage.written[source.assetPath]);
        // 反射构造链路会先 console.assert 报"取不到类名"，再由 deserializeWithAssets 显式抛错
        // （#402 之后这里不再是一句 TypeError: Cannot read properties of undefined，而是带类名的显式错误）
        const assertMessages: unknown[][] = [];
        const assertSpy = vi.spyOn(console, 'assert').mockImplementation((...args: unknown[]) =>
        {
            assertMessages.push(args);
        });

        try
        {
            // 纯数据（没有 `__class__`）交给资源系统的反射构造链路，必然失败——这是分流的依据
            await expect(ReadRS.rs.deserializeWithAssets(saved)).rejects.toThrow(/取不到类名或类未注册/);
        }
        finally
        {
            assertSpy.mockRestore();
        }
        expect(assertMessages.map((args) => String(args[1])).join('\n')).toContain('无法获取名称为 undefined 的实例');

        // 修复后：同一个载荷经 readFile 能读回
        const target = createAsset(storage);
        await expect(target.readFile()).resolves.toBeUndefined();
        expect((target.data as { name?: string }).name).toBe('Root');
        // 读回的数据确实带上了自身资源编号
        expect((target.data as { assetId?: string }).assetId).toBe('asset-1');
    });

    it('旧格式不被破坏：带 __class__ 的数据仍走 deserializeWithAssets', async () =>
    {
        const storage = new MemoryAssetStorage();
        const assetPath = 'Assets/Legacy.gameobject.json';
        const legacy = { __class__: 'Object3D', name: '旧资源' };

        storage.written[assetPath] = legacy;

        const asset = createAsset(storage, assetPath);
        await asset.readFile();

        // 判定：不是纯数据，是旧格式
        expect(isPureDataAssetData(legacy)).toBe(false);
        expect(isLegacyAssetData(legacy)).toBe(true);
        // 走向：交给旧链路，且收到的是原载荷
        expect(storage.legacyObjects).toEqual([legacy]);
        // 读回的是旧链路给的实例（说明纯数据分支没被触发）
        expect((asset.data as { name?: string }).name).toBe('来自旧链路');
    });

    it('纯数据与旧格式判定互斥，两者同时出现时按旧格式处理', () =>
    {
        const pure = throughJson(serialization.serialize(buildTree()));

        expect(isPureDataAssetData(pure)).toBe(true);
        expect(isLegacyAssetData(pure)).toBe(false);

        expect(isPureDataAssetData({ __class__: 'Object3D', name: 'x' })).toBe(false);
        expect(isLegacyAssetData({ __class__: 'Object3D', name: 'x' })).toBe(true);
        // 同时带两个键：旧格式优先，避免把旧资源当纯数据读
        expect(isPureDataAssetData({ __class__: 'Object3D', __type__: 'Object3D' })).toBe(false);
        expect(isLegacyAssetData({ __class__: 'Object3D', __type__: 'Object3D' })).toBe(true);

        // 非对象（null / 数组 / 原始值）一律不当成资源数据
        expect(isPureDataAssetData(null)).toBe(false);
        expect(isPureDataAssetData([])).toBe(false);
        expect(isPureDataAssetData('__type__')).toBe(false);
        expect(isPureDataAssetData({})).toBe(false);
        expect(isLegacyAssetData(undefined)).toBe(false);
    });

    it('对象资源后缀符合 issue #40 约定（.gameobject.json）', () =>
    {
        // `ReadRS.createAsset` 用它生成新对象资源的路径（`Cls['extenson']`），
        // 编辑器侧同一约定见 packages/editor 的 GAMEOBJECT_ASSET_FILE_EXT
        expect(Object3DAsset.extenson).toBe('.gameobject.json');
        expect(`Assets/Trunk${Object3DAsset.extenson}`).toBe('Assets/Trunk.gameobject.json');
    });
});
