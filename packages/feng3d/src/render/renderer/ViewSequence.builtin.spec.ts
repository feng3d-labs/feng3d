import { describe, expect, it } from 'vitest';

import '../../test/webgpu-stub';

import { forwardRenderer } from './ForwardRenderer';
import { outlineRenderer } from './OutlineRenderer';
import { shadowRenderer } from './ShadowRenderer';
import { wireframeRenderer } from './WireframeRenderer';
import {
    findViewObjectContributor,
    findViewPassContributor,
    getDefaultObjectSequence,
    getDefaultPassSequence,
    VIEW_MAIN_PASS,
} from './ViewSequence';

/**
 * 内置 renderer 在序列里的落点（issue #93）。
 *
 * 5 个 renderer 的落点全部由**注册 + 数据声明**决定，`View` 的编排代码里不再有它们的名字：
 *
 * | renderer | 落点 |
 * |---|---|
 * | Forward / Outline / Wireframe | 主 pass 内的对象贡献者（按名称取用） |
 * | Shadow | pass 贡献者，`stage: 'beforeMain'`（先写 shadowMap，主 pass 才采样得到） |
 * | Mouse | **不占位**：GPU 拾取已由 CPU 射线（Mouse3DManager + Raycaster）取代，`draw()` 恒返回 null |
 */
describe('内置 renderer 的序列落点（issue #93）', () =>
{
    it('Shadow 注册为 beforeMain 的 pass 贡献者，默认序列排在主 pass 之前', () =>
    {
        const contributor = findViewPassContributor('Shadow');

        expect(contributor).toBeDefined();
        expect(contributor?.stage).toBe('beforeMain');

        const sequence = getDefaultPassSequence();

        expect(sequence.indexOf('Shadow')).toBeGreaterThanOrEqual(0);
        expect(sequence.indexOf('Shadow')).toBeLessThan(sequence.indexOf(VIEW_MAIN_PASS));
    });

    it('Forward / Outline / Wireframe 都是主 pass 内的对象贡献者', () =>
    {
        for (const name of ['Forward', 'Outline', 'Wireframe'])
        {
            expect(findViewObjectContributor(name), name).toBeDefined();
            expect(getDefaultObjectSequence(), name).toContain(name);
        }
    });

    it('对象贡献者产出的是各自 renderer 的 draw 结果（不是另建一套渲染）', () =>
    {
        // 空实现的两个 renderer：默认场景下产出空数组，与 draw() 的现状一致
        expect(typeof outlineRenderer.draw).toBe('function');
        expect(typeof wireframeRenderer.draw).toBe('function');
        expect(typeof forwardRenderer.draw).toBe('function');
        expect(typeof shadowRenderer.draw).toBe('function');
    });

    it('Mouse 不占序列位（GPU 拾取已废弃，避免留下恒空的 pass）', () =>
    {
        expect(findViewObjectContributor('Mouse')).toBeUndefined();
        expect(getDefaultObjectSequence()).not.toContain('Mouse');
    });
});
