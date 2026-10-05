import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { FS, ReadRS } from 'feng3d';
import { editorRS, installEditorResourceSystem } from '../src/assets/EditorRS';

/**
 * 编辑器资源系统的**装配**（#278 阶段 4a）。
 *
 * ## 为什么先补这一组
 *
 * `MIGRATE_SINGLETONS.md` §3 第 4 步写明："现状：`editorRS` 在测试里**没有**引用，
 * 所以这一步要**先补测试**，否则是**裸改**"。这一组钉住三件事：
 * 装配是**显式**的、**幂等**的、装完之后引擎槽位**真的**指向它；
 * 外加一条**静态判据**（模块顶层不许再写全局）——那是 R2 那一条的本地执行者。
 *
 * 注意 `ReadRS` 是**引擎侧**的静态槽位（`packages/assets`），页面只是往里装；
 * 本阶段**不**动引擎内部那些 `ReadRS.rs.xxx` 调用点（那属后续阶段）。
 */
describe('编辑器资源系统的装配（#278 阶段 4a）', () =>
{
    it('装配把引擎槽位指向编辑器的 rs（**显式**调用才发生）', () =>
    {
        const original = ReadRS.rs;

        // 模拟"还没装配"——装配前槽位不该是 editorRS
        ReadRS.rs = null as unknown as typeof ReadRS.rs;
        const installed = installEditorResourceSystem();

        expect(installed).toBe(editorRS);
        expect(ReadRS.rs).toBe(editorRS);

        ReadRS.rs = original;       // 还原：别的用例还要用这个槽位
    });

    it('装配顺带把读写包装装上（`FS.fs` 有写入面，不是只读 FS）', () =>
    {
        installEditorResourceSystem();

        expect(FS.fs).toBeTruthy();
        expect(typeof (FS.fs as { writeFile?: unknown }).writeFile).toBe('function');
    });

    it('重复装配是安全的（不换实例）', () =>
    {
        const first = installEditorResourceSystem();
        const second = installEditorResourceSystem();

        expect(first).toBe(second);
        expect(ReadRS.rs).toBe(editorRS);
    });

    it('模块顶层**不再**写引擎槽位（R2：import 即写全局正是要消掉的副作用）', () =>
    {
        const source = readFileSync(new URL('../src/assets/EditorRS.ts', import.meta.url), 'utf8');

        // 只看**顶格**行：函数体内的缩进行不算——那里正是现在装配的地方
        const topLevelAssignments = source.split('\n').filter((line) => /^(FS\.fs|ReadRS\.rs)\s*=/.test(line));

        expect(topLevelAssignments).toEqual([]);
    });
});
