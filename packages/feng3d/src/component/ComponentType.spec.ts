import { describe, expect, it } from 'vitest';
import { Components, getComponentTypeInfo, isRayCastable, isRenderable, registerComponentType } from './Component';
import { matchType } from '../core/Entity';

/**
 * 组件类型登记（`registerComponentType`）——上层扩展包接入引擎类型表的唯一入口。
 *
 * 背景（收尾批任务 1 实测）：`isRenderable` / `isRayCastable` / `matchType` 原先只认硬编码字符串表，
 * 上层包（`@feng3d/ui` 等）定义的组件对引擎隐形：`Scene.models` / `getComponentsInChildren('Renderable')` /
 * `Scene.behaviours` / `Raycaster.pick` 全部扫不到。分层上 `feng3d` 又不能反过来 import 上层包
 * （它连这些包的依赖都没有），所以接入方向是「上层包登记自己的类型」。
 *
 * 本文件用**专属前缀的类型名**（`SpecXxx`）做隔离：登记表是全局的，用通用名字会污染别的测试。
 */
describe('组件类型登记（registerComponentType）', () =>
{
    /** 造一个只有 `__type__` 的组件数据 */
    function component(type: string): Components
    {
        return { __type__: type } as unknown as Components;
    }

    it('未登记的类型：只匹配自身，不算可渲染 / 可拾取', () =>
    {
        expect(getComponentTypeInfo('SpecUnknown')).toBeUndefined();
        expect(isRenderable(component('SpecUnknown'))).toBe(false);
        expect(isRayCastable(component('SpecUnknown'))).toBe(false);
        expect(matchType(component('SpecUnknown'), 'SpecUnknown')).toBe(true);
        expect(matchType(component('SpecUnknown'), 'Renderable')).toBe(false);
    });

    it('内置的 Renderable 系类型都在硬编码名单里（MorphMeshRenderer 曾漏登记）', () =>
    {
        // 实测教训：`_renderableTypes` 漏掉 `MorphMeshRenderer` 时，`ScenePickCache.collectActiveModels`
        // 的 `isRenderable` 筛不到它——对象会被静默丢出渲染列表（不进 draw、不建管线、不报错、画面里没有）。
        // 注意它与 `Entity._typeHierarchy` 是**两张不同的名单**：后者管 `getComponentsInChildren`，
        // 前者管 `ScenePickCache` 的收集；只改一张会出现「models 数得对、却什么都没画」的怪象。
        for (const type of ['Renderable', 'MeshRenderer', 'MorphMeshRenderer', 'SkinnedMeshRenderer'])
        {
            expect(isRenderable(component(type)), type).toBe(true);
            expect(isRayCastable(component(type)), type).toBe(true);
        }
    });

    it('登记 baseTypes: [Renderable]：渲染 / 拾取能力按基类型派生，且沿内置层次表上溯', () =>
    {
        registerComponentType('SpecRenderable', { baseTypes: ['Renderable'] });
        const data = component('SpecRenderable');

        // 能力派生：Renderable 系基类型 → renderable + rayCastable
        expect(isRenderable(data)).toBe(true);
        expect(isRayCastable(data)).toBe(true);

        // 类型层次：自身 → Renderable → RayCastable / Behaviour → Component
        expect(matchType(data, 'SpecRenderable')).toBe(true);
        expect(matchType(data, 'Renderable')).toBe(true);
        expect(matchType(data, 'RayCastable')).toBe(true);
        expect(matchType(data, 'Behaviour')).toBe(true);
        expect(matchType(data, 'Component')).toBe(true);
        // 不相关类型不得误判
        expect(matchType(data, 'Camera')).toBe(false);
    });

    it('登记 baseTypes: [Component3D]：算 Component 的子类型，但不算可渲染', () =>
    {
        registerComponentType('SpecTransform', { baseTypes: ['Component3D'] });
        const data = component('SpecTransform');

        expect(matchType(data, 'Component3D')).toBe(true);
        expect(matchType(data, 'Component')).toBe(true);
        expect(isRenderable(data)).toBe(false);
        expect(isRayCastable(data)).toBe(false);
    });

    it('能力标记可显式覆盖派生值（「算子类型但不参与拾取」的历史形态）', () =>
    {
        registerComponentType('SpecNoPick', { baseTypes: ['Renderable'], rayCastable: false });
        const data = component('SpecNoPick');

        expect(isRenderable(data)).toBe(true);
        expect(isRayCastable(data)).toBe(false);
        expect(matchType(data, 'Renderable')).toBe(true);
    });

    it('多跳基类型链沿途上溯', () =>
    {
        registerComponentType('SpecChainMiddle', { baseTypes: ['Component3D'] });
        registerComponentType('SpecChainLeaf', { baseTypes: ['SpecChainMiddle'] });
        const data = component('SpecChainLeaf');

        expect(matchType(data, 'SpecChainMiddle')).toBe(true);
        expect(matchType(data, 'Component3D')).toBe(true);
        expect(matchType(data, 'Component')).toBe(true);
        // 中间类型自己声明的能力不外溢（Leaf 只声明了基类型，没有渲染能力）
        expect(isRenderable(data)).toBe(false);
    });

    it('登记成环不会无限递归', () =>
    {
        registerComponentType('SpecCycleA', { baseTypes: ['SpecCycleB'] });
        registerComponentType('SpecCycleB', { baseTypes: ['SpecCycleA'] });

        expect(matchType(component('SpecCycleA'), 'SpecCycleB')).toBe(true);
        expect(matchType(component('SpecCycleA'), 'Camera')).toBe(false);
    });

    it('空 typeName 视为匹配任意类型（既有语义不变）', () =>
    {
        expect(matchType(component('SpecUnknown'), '')).toBe(true);
    });
});
