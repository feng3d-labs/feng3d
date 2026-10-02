import { Context } from '@deepseek-ai/cordis';
import { describe, expect, it } from 'vitest';
import { ROTATE_HOST_META, apply, getHostHalfInstalls } from '../src/index';
import { ROTATE_PLUGIN_ID } from '../src/shared';

/**
 * 宿主半（Node 端）：**cordis 插件形态**与卸载回收。
 *
 * 宿主半是普通 cordis 插件——宿主把包装进 cordis 树，卸载（`fiber.dispose()`）时
 * 它挂的东西自动回收。这里验的就是这条（阶段 2 已在 `spikes/cordis-service.mjs` 验过机制，
 * 本组用例把它落到本包上）。
 */
describe('宿主半：cordis 插件形态', () =>
{
    it('宿主元数据与包名同源', () =>
    {
        expect(ROTATE_HOST_META.id).toBe(ROTATE_PLUGIN_ID);
        expect(ROTATE_HOST_META.apiVersion).toBeTruthy();
    });

    it('挂载后计数为 1，卸载后自动归零（卸载级联）', async () =>
    {
        const ctx = new Context();
        const fiber = await ctx.plugin(apply);

        expect(getHostHalfInstalls()).toBe(1);

        await fiber.dispose();

        expect(getHostHalfInstalls()).toBe(0);
    });

    it('多个宿主 context 各挂一份（互不影响）', async () =>
    {
        const a = new Context();
        const b = new Context();
        const fiberA = await a.plugin(apply);
        const fiberB = await b.plugin(apply);

        expect(getHostHalfInstalls()).toBe(2);

        await fiberA.dispose();

        expect(getHostHalfInstalls()).toBe(1);

        await fiberB.dispose();

        expect(getHostHalfInstalls()).toBe(0);
    });
});
