// 副作用导入：Object3D / Scene / UI 组件都是纯数据类型，只用作类型标注的 import
// 会被转译器整条擦除，于是 feng3d 与本包的 registerLogic 都不执行、logic() 返回 null
// （第 1 批实测踩过的坑，见 tmp/progress-ui-migration.md）。
import 'feng3d';
import { isRayCastable, isRenderable, matchType, Object3D, Raycaster, Scene } from 'feng3d';
import { logic, toRaw } from '@feng3d/reactivity';
import { describe, expect, it } from 'vitest';
import '../src/Button';
import '../src/core/Canvas';
import '../src/core/CanvasRenderer';
import '../src/core/Transform2D';
import type { Button } from '../src/Button';
import type { Canvas } from '../src/core/Canvas';
import type { CanvasRenderer } from '../src/core/CanvasRenderer';

/**
 * UI 渲染器能否被引擎「看见」——渲染列表 / 组件查询 / 拾取三条链路的硬前置（收尾批任务 1）。
 *
 * 背景：`isRenderable` / `isRayCastable`（`packages/feng3d/src/component/Component.ts`）
 * 与 `matchType`（`packages/feng3d/src/core/Entity.ts`）原先都是**硬编码字符串表**，
 * 不认识上层扩展包（本包）注册的 `'CanvasRenderer'`。后果是 UI 迁完了也渲染不出来：
 * `Scene.models` / `getComponentsInChildren('Renderable')` / `Raycaster.pick` 都扫不到它。
 *
 * 本文件同时是**回归测试**：把「上层扩展包的渲染器必须被引擎看见」钉成断言，
 * 以后再有新的上层扩展包（particlesystem / terrain 之外的）也能靠同一机制生效。
 */
describe('UI 渲染器的类型识别（收尾批任务 1）', () =>
{
    /** 造「根对象挂 Scene 组件 + 子对象挂 Transform2D + CanvasRenderer」的最小场景 */
    function buildScene(): { root: Object3D, scene: Scene, uiObject: Object3D, renderer: CanvasRenderer }
    {
        let renderer: CanvasRenderer;
        const uiObject: Object3D = {
            __type__: 'Object3D',
            name: 'ui',
            components: [
                { __type__: 'Transform2D', size: { x: 100, y: 100 }, pivot: { x: 0.5, y: 0.5 } },
                renderer = { __type__: 'CanvasRenderer' } as CanvasRenderer,
            ],
        };
        const scene = { __type__: 'Scene' } as Scene;
        const root: Object3D = {
            __type__: 'Object3D',
            components: [scene],
            children: [uiObject],
        };

        logic(root); // 触发组件初始化（Scene / Transform2D / CanvasRenderer 的 init 注入 entity）

        return { root, scene, uiObject, renderer };
    }

    it('isRenderable / isRayCastable 认识 CanvasRenderer', () =>
    {
        const { renderer } = buildScene();

        expect(isRenderable(renderer)).toBe(true);
        expect(isRayCastable(renderer)).toBe(true);
    });

    it('matchType 认 CanvasRenderer 为 Renderable / RayCastable / Behaviour / Component 的子类型', () =>
    {
        const { renderer } = buildScene();

        expect(matchType(renderer, 'CanvasRenderer')).toBe(true);
        expect(matchType(renderer, 'Renderable')).toBe(true);
        expect(matchType(renderer, 'RayCastable')).toBe(true);
        expect(matchType(renderer, 'Behaviour')).toBe(true);
        expect(matchType(renderer, 'Component')).toBe(true);
        // 反向：不相关类型不得误判
        expect(matchType(renderer, 'Camera')).toBe(false);
    });

    it('Scene.models / visibleAndEnabledModels 包含 UI 渲染器', () =>
    {
        const { scene, renderer } = buildScene();

        // 树搜索经过响应式代理，取回的是代理对象——比较前先还原成 raw（逻辑相同，身份不同）
        expect(logic(scene).models.map((m) => toRaw(m))).toContain(renderer);
    });

    it('getComponentsInChildren(\'Renderable\') 能找到 UI 渲染器', () =>
    {
        const { root, renderer } = buildScene();

        expect(logic(root).getComponentsInChildren('Renderable').map((m) => toRaw(m))).toContain(renderer);
    });

    it('Scene.mouseCheckObjects 收录挂着 UI 渲染器的对象（拾取候选）', () =>
    {
        const { scene, uiObject } = buildScene();

        expect(logic(scene).mouseCheckObjects.map((o) => toRaw(o))).toContain(uiObject);
    });

    it('Raycaster.pick 能拾取到 UI 渲染器', () =>
    {
        const { scene, uiObject } = buildScene();
        const raycaster = new Raycaster();
        // 世界空间射线：UI 单位四边形（Transform2D size 100×100、pivot 0.5 居中）在 z=0 平面上
        const ray3D = { __type__: 'Line3' as const, origin: { x: 0, y: 0, z: -10 }, direction: { x: 0, y: 0, z: 1 } };

        const picked = raycaster.pick(ray3D, logic(scene).mouseCheckObjects);

        expect(picked).not.toBeNull();
        expect(toRaw(picked!.object3D)).toBe(uiObject);
        // 命中记录里的几何体是 UI 单位四边形（RenderObject 的 geometry 走 bindingResources，不再直接暴露）
        expect(picked!.geometry.__type__).toBe('UIGeometry');
    });

    it('Scene.behaviours / activeBehaviours 能扫到 Button 与 Canvas（Behaviour 登记）', () =>
    {
        const button: Button = { __type__: 'Button' } as Button;
        const canvas = { __type__: 'Canvas' } as Canvas;
        const scene = { __type__: 'Scene' } as Scene;
        const root: Object3D = {
            __type__: 'Object3D',
            components: [scene],
            children: [
                { __type__: 'Object3D', name: 'canvas', components: [{ __type__: 'Transform2D' }, canvas] },
                { __type__: 'Object3D', name: 'button', components: [{ __type__: 'Transform2D' }, button] },
            ],
        };

        logic(root);

        // Button 的状态机由 SceneLogic.update 遍历 activeBehaviours 驱动——
        // 扫不到它，`ButtonLogic.update` 就永远不执行（登记之前实测就是如此）
        expect(logic(scene).behaviours.map((b) => toRaw(b))).toEqual([canvas, button]);
        expect(logic(scene).activeBehaviours.map((b) => toRaw(b))).toEqual([canvas, button]);
    });
});
