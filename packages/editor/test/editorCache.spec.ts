import { describe, expect, it } from 'vitest';
import { getEditorCache } from '../src/caches/Editorcache';

/**
 * 编辑器缓存单例（#272 P5 第 2 步）。
 *
 * 这一步把它从 `export const editorcache = new EditorCache();`（**模块顶层执行代码**，
 * 属 R2 的既有违反项）改成 lazy 的 `getEditorCache()`。这里守两件事：
 *
 * 1. **还是单例**：多次调用拿到同一个对象（改 lazy 最容易在此处失手——每次 new 一个，
 *    于是"改了项目名、别处读不到"这类 bug 会以最难看的方式出现）；
 * 2. **持久化往返**：`new EditorCache()` 从 `localStorage` 读、`save()` 写回
 *    （这条路此前**一条测试都没有**）。
 *
 * "模块顶层不再构造"这一条**不在这里守**：它是源码级判据，执行者是
 * `scripts/editor-singleton-survey.mjs` 的「顶层 `new` 基线」（存量冻结、新增即失败）——
 * 单测里再抄一遍只会多一份会漂移的副本。
 */
describe('编辑器缓存单例（lazy）', () =>
{
    it('★ 同一实例：多次调用拿到同一个对象', () =>
    {
        expect(getEditorCache()).toBe(getEditorCache());
    });

    it('setLastProject 把项目挪到最前，且不重复', () =>
    {
        const cache = getEditorCache();
        cache.lastProjects = ['a', 'b'];

        cache.setLastProject('b');

        expect(cache.lastProjects).toEqual(['b', 'a']);

        cache.setLastProject('c');

        expect(cache.lastProjects).toEqual(['c', 'b', 'a']);
    });

    it('★ save 写进 localStorage（能读回来）', () =>
    {
        localStorage.clear();
        const cache = getEditorCache();
        cache.projectname = 'p1';
        cache.lastProjects = ['p1'];

        cache.save();

        const raw = localStorage.getItem('feng3d-editor');

        expect(raw, 'save 之后应当有持久化内容').toBeTruthy();
        expect(JSON.parse(raw!)).toMatchObject({ projectname: 'p1', lastProjects: ['p1'] });
    });
});
