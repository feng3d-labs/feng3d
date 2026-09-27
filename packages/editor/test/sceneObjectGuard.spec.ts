import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
// 副作用导入：判据要查引擎的 logic 注册表（`isLogicRegistered`），不导入时注册表是空的
import 'feng3d';
import { describeInvalidSceneObject, filterValidSceneObjects } from '../src/utils/sceneObjectGuard';

/**
 * 「场景树子节点是否损坏」的判据（issue #140）。
 *
 * `children` 里的坏东西既不会被导出（序列化会丢掉），也不会被察觉，只会在某个路径
 * 真正去读它时炸：`Hierarchy.add` 的 `getLogic(object3D).parent` 抛
 * `Cannot read properties of null (reading 'parent')`。层级面板（跳过它）与桥接体检
 * （报出它）共用这份判据，所以这里逐类覆盖。
 */
describe('describeInvalidSceneObject', () =>
{
    it('放行有效对象', () =>
    {
        expect(describeInvalidSceneObject({ __type__: 'Object3D' })).toBeNull();
        expect(describeInvalidSceneObject({ __type__: 'MeshRenderer', geometry: { __type__: 'CubeGeometry' } })).toBeNull();
    });

    it('抓出 undefined 与 null（历史路径会把 undefined push 进 children）', () =>
    {
        expect(describeInvalidSceneObject(undefined)).toMatch(/undefined/);
        expect(describeInvalidSceneObject(null)).toMatch(/null/);
    });

    it('抓出非对象', () =>
    {
        expect(describeInvalidSceneObject('Object3D')).toMatch(/不是对象/);
        expect(describeInvalidSceneObject(3)).toMatch(/不是对象/);
    });

    it('抓出 #140 现场那个坏节点（有键但没有 __type__）', () =>
    {
        const dirty = { id: '/', types: [], activeSelf: true, childCount: 0 };
        const reason = describeInvalidSceneObject(dirty);

        expect(reason).toMatch(/缺少 __type__/);
        // 给出键才看得出"这是缺字段"而不是"类型名写错"
        expect(reason).toMatch(/id, types, activeSelf, childCount/);
    });

    it('空对象的提示不空白', () =>
    {
        expect(describeInvalidSceneObject({})).toMatch(/\(空对象\)/);
    });

    it('抓出未注册的 __type__（类型名写错、或注册它的插件被关掉）', () =>
    {
        expect(describeInvalidSceneObject({ __type__: 'CubeGeometory' })).toMatch(/__type__ 'CubeGeometory' 没有注册/);
    });

    it('判据只认 __type__，不认旧格式的 __class__（旧格式由引擎读时就地兼容，不在本判据范围）', () =>
    {
        expect(describeInvalidSceneObject({ __class__: 'PlaneGeometry' })).toMatch(/缺少 __type__/);
    });
});

describe('filterValidSceneObjects', () =>
{
    it('滤掉无效项、保留有效项，顺序不变', () =>
    {
        const valid1 = { __type__: 'Object3D', name: 'A' };
        const valid2 = { __type__: 'Object3D', name: 'B' };
        const reported: unknown[] = [];

        const result = filterValidSceneObjects<{ name?: string }>(
            [valid1, undefined, { id: '/', types: [] }, valid2],
            (child) => reported.push(child),
        );

        expect(result).toEqual([valid1, valid2]);
        // 无效项被逐个报告（而不是静默丢掉）——报出来才可能被修
        expect(reported).toEqual([undefined, { id: '/', types: [] }]);
    });

    it('全无效时返回空数组（层级树不该因为一堆坏数据长出幽灵节点）', () =>
    {
        const reasons: string[] = [];
        const result = filterValidSceneObjects([undefined, null, 'Object3D', { types: [] }], (child, reason) =>
        {
            reasons.push(reason);
        });

        expect(result).toEqual([]);
        expect(reasons).toHaveLength(4);
    });

    it('空 children 是常态，不报告', () =>
    {
        const reported: unknown[] = [];

        expect(filterValidSceneObjects([], (child) => reported.push(child))).toEqual([]);
        expect(reported).toEqual([]);
    });
});

/**
 * 「层级面板与桥接体检用同一把尺子」的机器执行者（issue #140）。
 *
 * 判据本身有单测，但**"用没用它"** 只能靠源码判据拦住：`Hierarchy.add` 里
 * `getLogic(object3D).parent` 那句在 `logic()` 返回 null 时必抛
 * `Cannot read properties of null (reading 'parent')`，而它没有单测可挂
 * （`Hierarchy` 缠着 DOM 与编辑器状态）。所以这里比对调用位置：
 * **过滤/判空必须出现在读 `logic` 之前**，否则那条栈会原样回来。
 */
describe('脏子节点的防线没有被人删掉', () =>
{
    // 用文件自身位置定位仓库根，而不是 `process.cwd()`：这条用例在
    // 仓库根（`npx vitest run`）与 packages/editor 目录（`npm run test`）下都要能跑
    const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..', '..');

    /** 读源码并去掉行注释：一条能被注释满足的门禁等于没有（见 selectionSync.spec.ts 的教训） */
    function readCode(file: string): string
    {
        return readFileSync(join(ROOT, file), 'utf8')
            .split('\n')
            .map((line) => line.replace(/\/\/.*$/, ''))
            .join('\n');
    }

    it('Hierarchy 在读 logic 之前先过滤无效子节点', () =>
    {
        const source = readCode('packages/editor/src/feng3d/hierarchy/Hierarchy.ts');

        const filterIndex = source.indexOf('filterValidSceneObjects<');
        const addGuardIndex = source.indexOf('describeInvalidSceneObject(rawObject3D)');
        const parentReadIndex = source.indexOf('getLogic(object3D).parent');

        expect(parentReadIndex, '找不到 `getLogic(object3D).parent`——Hierarchy 的取父方式变了，请更新本判据').toBeGreaterThan(-1);
        expect(filterIndex, '`collectTree` 不再过滤无效子节点了').toBeGreaterThan(-1);
        expect(addGuardIndex, '`add` 不再对无效子节点判空了').toBeGreaterThan(-1);
        expect(filterIndex, '过滤必须发生在读 logic 之前').toBeLessThan(parentReadIndex);
        expect(addGuardIndex, '判空必须发生在读 logic 之前').toBeLessThan(parentReadIndex);
    });

    it('scene.validate 会报出坏子节点（dirty-child）', () =>
    {
        const source = readCode('packages/editor/src/bridge/read/sceneValidate.ts');

        expect(source).toMatch(/describeInvalidSceneObject/);
        expect(source, '体检必须有一条能指出坏子节点的 issue').toMatch(/code: 'dirty-child'/);
    });
});
