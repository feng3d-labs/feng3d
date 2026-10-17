import { describe, expect, it } from 'vitest';
import { REVERSIBLE_WRITE_METHODS, composeWriteHandlers, wrapWriteHandlers } from '../src/bridge/EditorBridgeWrite';

/**
 * 写方法表的统一包装（issue #930）。
 *
 * 判据是**行为**而不是"源码里有没有那行"：注入进来的方法（`scene.save` / `editor.reloadScene`）
 * 若绕过 `withDryRun`，`dryRun: true` 会被静默忽略——而它们正好是不可回滚的落盘 / 重载操作，
 * 于是"预演"变成"真的执行了"。
 *
 * 为什么需要这条**离线**测试：唯一覆盖过它的 `scripts/editor-bridge-smoke.mjs` 要 dev server
 * 与浏览器页面，不在 CI 门禁清单里，所以这类回归长期无人拦。
 */
describe('composeWriteHandlers：注入的方法同样过统一包装（#930）', () =>
{
    it('不可回滚的注入方法传 dryRun 必须拒绝，且完全不执行', () =>
    {
        let called = 0;
        const table = composeWriteHandlers({
            'scene.save': () =>
            {
                called++;

                return { saved: 'scenes/default.scene.json' };
            },
        });

        expect(() => table['scene.save']!({ dryRun: true })).toThrow(/不支持 dryRun/);
        expect(called).toBe(0);
    });

    it('注入方法不带 dryRun 时正常执行（加包装不能改变正常路径）', () =>
    {
        const table = composeWriteHandlers({ 'scene.save': () => ({ saved: 'x' }) });

        expect(table['scene.save']!({})).toEqual({ saved: 'x' });
    });

    it('editor.reloadScene 同样被包装（它也是注入进来的）', () =>
    {
        let called = 0;
        const table = composeWriteHandlers({
            'editor.reloadScene': async () =>
            {
                called++;

                return { reloaded: true };
            },
        });

        expect(() => table['editor.reloadScene']!({ dryRun: true })).toThrow(/不支持 dryRun/);
        expect(called).toBe(0);
    });

    it('可回滚方法仍然支持 dryRun 预演', () =>
    {
        const table = wrapWriteHandlers({ 'scene.set': () => 'written' });
        const preview = table['scene.set']!({ dryRun: true }) as Record<string, unknown>;

        expect(preview.dryRun).toBe(true);
        expect(preview.result).toBe('written');
    });

    it('插件贡献的写方法原样放入：语义由插件定义，不套 dryRun', () =>
    {
        const table = composeWriteHandlers({}, [{ name: 'plugin.act', handler: () => 'plugin-ok' }]);

        expect(table['plugin.act']!({ dryRun: true })).toBe('plugin-ok');
    });

    it('scene.save / editor.reloadScene 不在可回滚名单里（否则预演会假装把已落盘的东西回滚了）', () =>
    {
        expect(REVERSIBLE_WRITE_METHODS.has('scene.save')).toBe(false);
        expect(REVERSIBLE_WRITE_METHODS.has('editor.reloadScene')).toBe(false);
    });
});
