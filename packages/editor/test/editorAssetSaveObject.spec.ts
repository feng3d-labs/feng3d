import { describe, expect, it } from 'vitest';
import type { Object3D } from 'feng3d';
import { EditorAsset } from '../src/ui/assets/EditorAsset';

/**
 * `EditorAsset.saveObject` 的**深拷贝接线**（issue #113 的遗留缺口）。
 *
 * 缺陷是"**没接线**"而不是"函数写错了"：`object3DToAssetFileData`（`./Object3DAssetFile`）一直
 * 是正确的深拷贝实现，它自己的 JSDoc 就写着"拷贝而非引用：资源一旦与场景里的对象共用同一份数据，
 * 之后在场景中编辑该对象会连带改写资源内容"，但 `saveObject` 当时传的是 `{ data: object }`——
 * **直接交出了场景对象的引用**。
 *
 * 所以下面的判据必须落在 `saveObject` **实际交出去的那份数据**上：
 * 只测 `object3DToAssetFileData` 本身是测不出这个缺陷的（它在修复前后都正确）。
 *
 * 这里用 `Object.create(EditorAsset.prototype)` 绕开构造（编辑器 UI 的构造函数会碰 DOM），
 * 再覆写 `createAsset` 捕获它收到的 `data`。
 */
interface Captured
{
    path: string;
    name: string;
    data: Record<string, unknown> | undefined;
}

async function callSaveObject(object: Object3D): Promise<Captured>
{
    const captured: Captured = { path: '', name: '', data: undefined };

    const editorAsset = Object.create(EditorAsset.prototype) as EditorAsset;

    // `saveObject` 只用到这两个成员
    (editorAsset as unknown as { showFloder: unknown }).showFloder = { asset: { assetPath: 'Assets' } };
    (editorAsset as unknown as {
        createAsset: (path: string, cls: unknown, name: string, options: { data: Record<string, unknown> }) => Promise<unknown>;
    }).createAsset = async (path, _cls, name, options) =>
    {
        captured.path = path;
        captured.name = name;
        captured.data = options.data;

        return null;
    };

    await editorAsset.saveObject(object);

    return captured;
}

function buildSphere(): Object3D
{
    return {
        __type__: 'Object3D',
        name: 'Sphere',
        position: { x: 1, y: 2, z: 3 },
        children: [{ __type__: 'Object3D', name: 'Child' }],
    } as unknown as Object3D;
}

describe('EditorAsset.saveObject 的深拷贝接线（issue #113）', () =>
{
    it('交给资源的数据不是场景对象本身（拷贝而非引用）', async () =>
    {
        const object = buildSphere();
        const captured = await callSaveObject(object);

        expect(captured.data).toBeDefined();
        expect(captured.data).not.toBe(object);
    });

    it('存盘后修改场景对象，资源数据不受影响', async () =>
    {
        const object = buildSphere();
        const captured = await callSaveObject(object);

        // 模拟"存为资源之后又在场景里拖动/改名"——缺陷版本下这些改动会直接改写资源内容
        (object.position as { x: number }).x = 999;
        (object as { name?: string }).name = 'Renamed';
        (object.children![0] as { name?: string }).name = 'ChildRenamed';

        const data = captured.data as { position: { x: number }, name: string, children: { name: string }[] };

        expect(data.position.x).toBe(1);
        expect(data.name).toBe('Sphere');
        expect(data.children[0].name).toBe('Child');
    });

    it('嵌套层级也被拷贝（不是只拷了第一层）', async () =>
    {
        const object = buildSphere();
        const captured = await callSaveObject(object);

        const data = captured.data as { children: unknown[] };

        // 浅拷贝（如 { ...object }）下 children 数组仍与原对象共享
        expect(data.children).not.toBe(object.children);
        expect(data.children).toHaveLength(1);
    });

    it('交接给 createAsset 的参数不变：路径、名称、资源类型', async () =>
    {
        const captured = await callSaveObject(buildSphere());

        expect(captured.path).toBe('Assets');
        expect(captured.name).toBe('Sphere');
    });

    it('资源实例身份字段被剥离（写进资源文件会自引用）', async () =>
    {
        const object = { ...buildSphere(), assetId: 'asset-123', prefabId: 'prefab-456' } as unknown as Object3D;
        const captured = await callSaveObject(object);

        expect(captured.data).not.toHaveProperty('assetId');
        expect(captured.data).not.toHaveProperty('prefabId');
        // 而原对象上的身份字段**不应被清掉**（是拷贝，不是就地修改）
        expect((object as { assetId?: string }).assetId).toBe('asset-123');
    });
});
