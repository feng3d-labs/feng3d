// 先加载 feng3d 让循环依赖（FileAsset → feng3d → assets/index → ArrayBufferAsset → FileAsset）
// 的入口从 feng3d 这一侧进入，避免 FileAsset 在自身初始化过程中被反向 import 成 undefined
import 'feng3d';
import { describe, expect, it } from 'vitest';
import { assetTypeClassMap, getAssetTypeClass, setAssetTypeClass } from '../src/FileAsset';

/**
 * assets 原先只有一个 `assert.ok(true)` 的占位用例。这里换成资源类型注册表的真实行为
 * （纯数据映射，不需要文件系统与 GPU）。
 */
describe('资源类型注册表', () =>
{
    it('未注册的类型取不到类', () =>
    {
        expect(getAssetTypeClass('fx' as never)).toBeUndefined();
    });

    it('注册后可按类型取回同一个类', () =>
    {
        class FakeAsset { }

        setAssetTypeClass('fx' as never, FakeAsset as never);

        expect(getAssetTypeClass('fx' as never)).toBe(FakeAsset);
        expect(assetTypeClassMap['fx' as never]).toBe(FakeAsset);
    });

    it('同一类型重复注册以后写入的为准', () =>
    {
        class A { }
        class B { }

        setAssetTypeClass('dup' as never, A as never);
        expect(getAssetTypeClass('dup' as never)).toBe(A);

        setAssetTypeClass('dup' as never, B as never);
        expect(getAssetTypeClass('dup' as never)).toBe(B);
    });
});
