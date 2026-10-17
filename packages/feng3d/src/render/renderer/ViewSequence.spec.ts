import { describe, expect, it } from 'vitest';

import type { View } from '../../core/View';
import {
    findViewObjectContributor,
    findViewPassContributor,
    getDefaultObjectSequence,
    getDefaultPassSequence,
    registerViewObjectContributor,
    registerViewPassContributor,
    resolveViewObjectSequence,
    resolveViewPassSequence,
    VIEW_MAIN_PASS,
    VIEW_SKYBOX_OBJECT,
} from './ViewSequence';

/**
 * pass 编排声明化（issue #93）的机制级回归。
 *
 * 验收判据是「新增 pass 无需修改核心编排代码」——本文件把它落成可执行断言：
 * 只 `registerViewPassContributor(...)` 注册，默认序列里就自动出现，位置由 `stage` 决定；
 * `View.passes` 一旦显式声明则接管整条序列。
 *
 * 这里不 import 内置 renderer（那会改变注册表状态、让断言依赖 import 顺序），
 * 内置 renderer 的落点另见 `ViewSequence.builtin.spec.ts`。
 */
describe('ViewSequence 注册表（issue #93）', () =>
{
    it('默认序列只有主 pass 位置（本文件未加载任何 renderer）', () =>
    {
        expect(getDefaultPassSequence()).toContain(VIEW_MAIN_PASS);
    });

    it('afterMain 贡献者：只注册就进入默认序列，且排在主 pass 之后', () =>
    {
        registerViewPassContributor({ name: 'TestBloom', stage: 'afterMain', build: () => [] });

        const sequence = getDefaultPassSequence();

        expect(sequence).toContain('TestBloom');
        expect(sequence.indexOf('TestBloom')).toBeGreaterThan(sequence.indexOf(VIEW_MAIN_PASS));
        expect(findViewPassContributor('TestBloom')).toBeDefined();
    });

    it('beforeMain 贡献者：只注册就排在主 pass 之前（阴影这类必须先写的 pass）', () =>
    {
        registerViewPassContributor({ name: 'TestPrepass', stage: 'beforeMain', build: () => [] });

        const sequence = getDefaultPassSequence();

        expect(sequence.indexOf('TestPrepass')).toBeLessThan(sequence.indexOf(VIEW_MAIN_PASS));
    });

    it('stage 缺省视为 afterMain', () =>
    {
        registerViewPassContributor({ name: 'TestDefaultStage', build: () => [] });

        const sequence = getDefaultPassSequence();

        expect(sequence.indexOf('TestDefaultStage')).toBeGreaterThan(sequence.indexOf(VIEW_MAIN_PASS));
    });

    it('同名重复注册覆盖，序列里只出现一次（后注册的生效）', () =>
    {
        const first = () => [];
        const second = () => [];

        registerViewPassContributor({ name: 'TestDuplicatedPass', stage: 'afterMain', build: first });
        registerViewPassContributor({ name: 'TestDuplicatedPass', stage: 'afterMain', build: second });

        const sequence = getDefaultPassSequence();
        const hits = sequence.filter((name) => name === 'TestDuplicatedPass');

        expect(hits).toHaveLength(1);
        expect(findViewPassContributor('TestDuplicatedPass')?.build).toBe(second);
    });

    it('对象贡献者：注册即按名字可取（主 pass 内的顺序由数据给出）', () =>
    {
        registerViewObjectContributor({ name: 'TestOverlay', build: () => [] });

        expect(findViewObjectContributor('TestOverlay')).toBeDefined();
    });

    it('默认对象序列以天空盒打底、Forward 紧随其后', () =>
    {
        const sequence = getDefaultObjectSequence();

        expect(sequence[0]).toBe(VIEW_SKYBOX_OBJECT);
        expect(sequence.indexOf('Forward')).toBe(1);
    });

    it('默认对象序列每次返回新数组（调用方改写不会污染共享状态）', () =>
    {
        const first = getDefaultObjectSequence();
        const second = getDefaultObjectSequence();

        expect(first).not.toBe(second);
        expect(first).toEqual(second);
    });

    it('View.passes 显式声明即接管整条序列（未列出的贡献者不执行）', () =>
    {
        registerViewPassContributor({ name: 'TestNotListed', stage: 'afterMain', build: () => [] });

        const view = { passes: ['TestNotListed', VIEW_MAIN_PASS] } as unknown as View;
        const sequence = resolveViewPassSequence(view);

        expect(sequence).toEqual(['TestNotListed', VIEW_MAIN_PASS]);
    });

    it('View.renderObjects 显式声明即接管主 pass 的对象序列', () =>
    {
        const view = { renderObjects: ['Forward'] } as unknown as View;

        expect(resolveViewObjectSequence(view)).toEqual(['Forward']);
    });

    it('未声明时回落到默认序列', () =>
    {
        const view = {} as unknown as View;

        expect(resolveViewPassSequence(view)).toEqual(getDefaultPassSequence());
        expect(resolveViewObjectSequence(view)).toEqual(getDefaultObjectSequence());
    });
});
