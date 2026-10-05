import { describe, expect, it } from 'vitest';
import { EditorAsset } from '../src/ui/assets/EditorAsset';
import { installEditorResourceSystem } from '../src/assets/EditorRS';

/**
 * 资源管理器的装配（#278"挪创建点"那一批）。
 *
 * ## 为什么需要这个用例
 *
 * `EditorAsset` 原来是"**在自己的模块顶层 `new` 自己**"的单例（`export const editorAsset = …`）。
 * 那种形态下，测试里它**一行都没执行**，却因为被别处 import 而被整份算成 100%——
 * 正是 issue #645 说的"覆盖率虚高"（本次改动后 `check-coverage-inflation.mjs` 直接把它点了出来）。
 *
 * 改成"入口创建 + 构造注入"之后，它变成一个**可以被测的类**：这个用例把"用注入进来的资源系统
 * 构造它"这条路走一遍。读数上覆盖率会**跌**，但那是虚高消失，不是退步。
 */
describe('EditorAsset 的装配（#278）', () =>
{
    it('能用注入进来的资源系统构造出来（不再依赖模块顶层单例）', () =>
    {
        const rs = installEditorResourceSystem();
        const assetManager = new EditorAsset(rs);

        expect(assetManager).toBeTruthy();
        // 它一开始还没有资源树——树是 `initproject()` 装配出来的
        expect(assetManager.rootFile).toBeUndefined();
    });
});
