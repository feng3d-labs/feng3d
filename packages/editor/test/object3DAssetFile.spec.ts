import { describe, expect, it } from 'vitest';
import { ReadRS } from 'feng3d';
import type { Object3D } from 'feng3d';
import {
    GAMEOBJECT_ASSET_FILE_EXT,
    isGameObjectAssetFilePath,
    isLegacyAssetFile,
    isPureDataAssetFile,
    object3DDataFromAssetFile,
    object3DToAssetFileData,
} from '../src/ui/assets/Object3DAssetFile';

/**
 * "对象存为资源"（issue #113）的纯数据往返。
 *
 * 这里的判据都是**不依赖编辑器 UI / 文件系统**的部分：把一棵 `Object3D` 子树转成
 * `.gameobject.json` 形态的纯数据、再从该形态读回来。写出链路（`ObjectAsset.saveFile`）
 * 用的就是 `serialization.serialize`，所以这份载荷与真实写盘内容同构。
 */
describe('assets/Object3DAssetFile', () =>
{
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

    it('往返等价：序列化 → JSON → 反序列化 → 再序列化，结构不变', () =>
    {
        const first = object3DToAssetFileData(buildTree());
        const restored = object3DDataFromAssetFile(throughJson(first));

        expect(restored).not.toBeNull();
        expect(object3DToAssetFileData(restored!)).toEqual(first);
    });

    it('保留嵌套 children 的层级、顺序与名称', () =>
    {
        const first = object3DToAssetFileData(buildTree());
        const restored = object3DDataFromAssetFile(throughJson(first))!;

        const children = (restored as unknown as { children: { name: string, children?: { name: string }[] }[] }).children;

        expect(children.map((c) => c.name)).toEqual(['Middle', 'Sibling']);
        expect(children[0].children!.map((c) => c.name)).toEqual(['Leaf']);
    });

    it('保留组件及其构造参数（几何体、材质、颜色）', () =>
    {
        const restored = object3DDataFromAssetFile(throughJson(object3DToAssetFileData(buildTree())))!;
        const middle = (restored as unknown as { children: { components: unknown[] }[] }).children[0];

        expect(middle.components).toHaveLength(1);
        expect(middle.components[0]).toEqual({
            __type__: 'MeshRenderer',
            geometry: { __type__: 'CubeGeometry', width: 2 },
            material: {
                __type__: 'StandardMaterial',
                uniforms: { u_diffuse: { __type__: 'Color4', r: 0.9, g: 0.45, b: 0.2, a: 1 } },
            },
        });
    });

    it('整棵树的 __type__ 正确，且不含旧格式的 __class__', () =>
    {
        const data = object3DToAssetFileData(buildTree());
        const restored = object3DDataFromAssetFile(throughJson(data))!;

        const nodes = [
            restored,
            ...(restored as unknown as { children: Object3D[] }).children,
            (restored as unknown as { children: { children: Object3D[] }[] }).children[0].children[0],
        ];

        for (const node of nodes)
        {
            expect((node as { __type__?: string }).__type__).toBe('Object3D');
        }
        expect(JSON.stringify(data)).not.toContain('__class__');
    });

    it('剥离资源实例身份字段（assetId / prefabId），且不改动原对象', () =>
    {
        const tree = buildTree() as unknown as Record<string, unknown>;
        tree.assetId = 'asset-1';
        tree.prefabId = 'prefab-1';

        const data = object3DToAssetFileData(tree as unknown as Object3D);

        expect('assetId' in data).toBe(false);
        expect('prefabId' in data).toBe(false);
        // 写资源文件是深拷贝：动的是副本，场景里的对象不受影响
        expect(tree.assetId).toBe('asset-1');
        expect(tree.prefabId).toBe('prefab-1');
    });

    it('后缀约定：只有 .gameobject.json 才算对象资源文件', () =>
    {
        expect(GAMEOBJECT_ASSET_FILE_EXT).toBe('.gameobject.json');
        expect(isGameObjectAssetFilePath('Assets/Trident.gameobject.json')).toBe(true);
        // 场景文件、普通 json 都不是对象资源
        expect(isGameObjectAssetFilePath('default.scene.json')).toBe(false);
        expect(isGameObjectAssetFilePath('Assets/New Json.json')).toBe(false);
    });

    it('纯数据与旧格式的判定互斥', () =>
    {
        const pure = object3DToAssetFileData(buildTree());

        expect(isPureDataAssetFile(pure)).toBe(true);
        expect(isLegacyAssetFile(pure)).toBe(false);
        expect(isPureDataAssetFile({ __class__: 'Object3D' })).toBe(false);
        expect(isLegacyAssetFile({ __class__: 'Object3D' })).toBe(true);
        // 非对象（null / 数组 / 原始值）一律不当成资源数据
        expect(isPureDataAssetFile(null)).toBe(false);
        expect(isPureDataAssetFile([])).toBe(false);
        expect(isPureDataAssetFile('__type__')).toBe(false);
    });

    it('旧格式不假装能读：分流返回 null，交由资源系统的异步链路处理', async () =>
    {
        // 旧格式（`__class__`）在本函数里直接判掉
        expect(object3DDataFromAssetFile({ __class__: 'Object3D', name: 'Legacy' })).toBeNull();

        // 对照：旧格式走资源系统的异步链路——它靠 `__class__` 反射构造，取不到类名时**必须失败**
        // （#402 之后是带类名的显式错误，而不是此前的 `TypeError: Cannot read properties of undefined`）
        await expect(ReadRS.rs.deserializeWithAssets({ __class__: 'Object3D', name: 'Legacy' })).rejects.toThrow(/取不到类名或类未注册/);

        // 而纯数据（没有 `__class__`）走同一条链路同样失败——缺口在数据本身（取不到类名），
        // 这正是"纯数据走同步链路、旧格式走异步链路"这条分流存在的理由
        await expect(ReadRS.rs.deserializeWithAssets(object3DToAssetFileData(buildTree()))).rejects.toThrow(/取不到类名或类未注册/);
    });
});
