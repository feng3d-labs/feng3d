import { isLogicRegistered, logic } from '@feng3d/reactivity';
import { describe, expect, it } from 'vitest';
import { installRotateRuntime } from '../src/runtime';
import { ROTATE_TYPE } from '../src/shared';
import type { Rotate } from '../src/shared';

/**
 * runtime 半（游戏端）：**同一个 `__type__` 在这一端也有行为**。
 *
 * 这条正是 #276 验收③的最小可验证形态——插件引入了新的 `__type__`，
 * 于是"第三端"不是可选项：编辑器里存下来的字面量，游戏端要按同一份契约跑起来。
 */
describe('runtime 半：游戏端行为', () =>
{
    it('装载后同一个 __type__ 在游戏端可用，并按数据推进', () =>
    {
        installRotateRuntime();

        expect(isLogicRegistered(ROTATE_TYPE)).toBe(true);

        const data: Rotate = { __type__: ROTATE_TYPE, speed: 90 };
        const rotateLogic = logic(data);

        expect(rotateLogic).toBeTruthy();
        expect(rotateLogic.angle).toBe(0);
        expect(rotateLogic.update(0.5)).toBe(45);
        expect(rotateLogic.update(0.5)).toBe(90);
    });

    it('同一份数据的 logic 实例被缓存（引擎语义，不是每次新建）', () =>
    {
        installRotateRuntime();

        const data = { __type__: ROTATE_TYPE, speed: 10 } as const;

        expect(logic(data)).toBe(logic(data));
    });

    it('只有 __type__ 也能装载（缺省 speed 按 0 处理）', () =>
    {
        installRotateRuntime();

        expect(logic({ __type__: ROTATE_TYPE }).update(1)).toBe(0);
    });

    it('装载是幂等的（重复装载不改变行为）', () =>
    {
        installRotateRuntime();
        installRotateRuntime();

        const data: Rotate = { __type__: ROTATE_TYPE, speed: 180 };

        expect(logic(data).update(1)).toBe(180);
    });
});
