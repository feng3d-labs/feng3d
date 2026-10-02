import { logic } from '@feng3d/reactivity';
import { beforeEach, describe, expect, it } from 'vitest';
import { loadPluginPackage, resetClientHalfImporter, resetPluginLoader } from '../src/plugins/loader';
import { resetPlugins } from '../src/plugins/registry';
import { getEditorSlots, installEditorSlots, resetEditorSlots } from '../src/plugins/slots';

/**
 * **#276 验收③**：插件引入的新 `__type__`，**两端都有行为**。
 *
 * "两端"是编辑器端与游戏端，而且**同一个 `__type__` 字符串**：
 *
 * | 端 | 装载方式 | 证据 |
 * |---|---|---|
 * | 编辑器 | 清单的 `logics` 贡献 → 引擎注册表 | **本文件** |
 * | 游戏端 | 构建期把 `./runtime` 打进产物 | `packages/editor-plugin-rotate/test/runtime.spec.ts`（逻辑）+ [`scripts/check-runtime-artifact.mjs`](../../../scripts/check-runtime-artifact.mjs)（**产物级**：真打一次包、在无编辑器环境跑） |
 *
 * 这条用例走的是**真实装载路径**（阶段 4 的装载器 + 真样板包），不是直接调注册函数。
 */
const ROTATE_ID = '@feng3d/editor-plugin-rotate';

describe('验收③：同一个 __type__ 两端都有行为（编辑器侧）', () =>
{
    beforeEach(async () =>
    {
        resetPlugins();
        resetPluginLoader();
        resetClientHalfImporter();
        await resetEditorSlots();
        installEditorSlots();
    });

    it('装载插件包后：引擎里拿得到行为，界面上也看得到它的面板', async () =>
    {
        const outcome = await loadPluginPackage({ id: ROTATE_ID });

        expect(outcome.problems).toEqual([]);
        expect(outcome.loaded).toBe(true);

        // 编辑器侧：清单的 logics 贡献被落到了引擎注册表
        const rotateLogic = logic({ __type__: 'Rotate' } as never) as { update: (interval: number) => number } | null;

        expect(rotateLogic).toBeTruthy();
        expect(rotateLogic!.update(1)).toBe(0); // 没给 speed → 按 0

        const withSpeed = logic({ __type__: 'Rotate', speed: 90 } as never) as { update: (interval: number) => number };

        expect(withSpeed.update(1)).toBe(90);

        // 界面侧：插槽上有它的面板（清单 → 插槽这条链）
        expect(getEditorSlots().entries('panel.main').map((entry) => entry.id)).toContain('rotate.panel');
    });

    it('对照：从未注册过的类型拿不到行为（证明上一条不是恒真）', () =>
    {
        // 刻意不用 'Rotate' 做对照：`registerLogic` 是**永久**的全局注册（引擎没有注销 API），
        // 上一条用例装载后它就一直在——用同一个名字做对照会恒真假通过。
        expect(logic({ __type__: 'ThisTypeIsNeverRegistered' } as never)).toBeFalsy();
    });
});
