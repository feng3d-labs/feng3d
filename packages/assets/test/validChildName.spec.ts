import 'feng3d';
import { describe, expect, it } from 'vitest';
import { ReadRS } from 'feng3d';
import type { FolderAsset } from '../src/FolderAsset';

/**
 * 子资源命名判重（`ReadRS.getValidChildName`）。
 *
 * 缺陷：判重原先比较 `FileAsset.fileName`，而它走 `pathUtils.nameWithOutExt`——只剥掉
 * **最后一个**后缀，多段后缀下会残留类型标记（有测试固定该语义：
 * `'assets/scene.tar.gz'` → `'scene.tar'`）。而候选名是**不带任何后缀**的，两者基准不同：
 *
 * - 已存在 `Assets/Sphere.gameobject.json` → `v.fileName === 'Sphere.gameobject'`
 * - 新建名为 `'Sphere'` → 查 `'Sphere'` **查不到冲突** → 最终仍拼成
 *   `Assets/Sphere.gameobject.json`，**覆盖同名文件**（改前本应得到 `Sphere1.…`）
 *
 * 实测影响入口：`packages/editor/src/ui/assets/EditorAsset.ts` 的 `saveObject`
 * （`createAsset(..., Object3DAsset, object.name, ...)`）——「对象存为资源」两次同名就会互相覆盖。
 *
 * 修法是给 `getValidChildName` 加可选第 3 参 `extenson`，按**完整文件名**判重；
 * 不传时保持旧行为（返回不带后缀的名）。
 */
const rs = new ReadRS();

/** 造一个只带 `assetPath` 的假父文件夹：`childrenAssets` 是 getter，真实现依赖 rs，这里只需列表 */
function makeParent(childPaths: string[]): FolderAsset
{
    return {
        assetPath: 'Assets',
        childrenAssets: childPaths.map((assetPath) => ({ assetPath })),
    } as unknown as FolderAsset;
}

describe('子资源命名判重（多段后缀）', () =>
{
    it('多段后缀下判重生效：不会覆盖同名资源', () =>
    {
        const parent = makeParent(['Assets/Sphere.gameobject.json']);

        // 修复前这里返回 'Sphere'，会与已存在的资源拼出同一个 assetPath
        expect(rs.getValidChildName(parent, 'Sphere', '.gameobject.json')).toBe('Sphere1');
    });

    it('连续同名会继续递增', () =>
    {
        const parent = makeParent([
            'Assets/Sphere.gameobject.json',
            'Assets/Sphere1.gameobject.json',
            'Assets/Sphere2.gameobject.json',
        ]);

        expect(rs.getValidChildName(parent, 'Sphere', '.gameobject.json')).toBe('Sphere3');
    });

    it('后缀不同不算冲突（各自独立）', () =>
    {
        const parent = makeParent(['Assets/Sphere.gameobject.json']);

        // `Sphere.json` 与 `Sphere.gameobject.json` 是两个不同文件
        expect(rs.getValidChildName(parent, 'Sphere', '.json')).toBe('Sphere');
    });

    it('没有同名时返回原名', () =>
    {
        const parent = makeParent(['Assets/Cube.gameobject.json']);

        expect(rs.getValidChildName(parent, 'Sphere', '.gameobject.json')).toBe('Sphere');
    });

    it('不传 extenson 时保持旧行为（只比 fileName，向后兼容）', () =>
    {
        const parent = makeParent(['Assets/Sphere.gameobject.json']);

        // 旧契约：返回不带后缀的名；也说明"加了参数但不传"不会改变既有调用方语义
        expect(rs.getValidChildName(parent, 'Sphere')).toBe('Sphere');
        expect(rs.getValidChildName(parent, 'Sphere1')).toBe('Sphere1');
    });

    it('父文件夹为空时不冲突', () =>
    {
        expect(rs.getValidChildName(makeParent([]), 'Sphere', '.gameobject.json')).toBe('Sphere');
    });
});
