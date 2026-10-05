// 副作用导入：Object3D / Scene / UI 组件都是纯数据类型，只用作类型标注的 import
// 会被转译器整条擦除，于是 feng3d 与本包的 registerLogic 都不执行、logic() 返回 null。
import 'feng3d';
import { forwardRenderer, getViewPassProviders, isRenderable, Object3D, Scene, View } from 'feng3d';
import { logic, reactive, toRaw } from '@feng3d/reactivity';
import { describe, expect, it } from 'vitest';
import '../src/core/Canvas';
import '../src/core/CanvasRenderer';
import '../src/core/Transform2D';
import '../src/core/UIMaterial';
import '../src/core/UIPass';
import '../src/Rect';
import { uiPassProvider } from '../src/core/UIPass';
import type { PerspectiveCamera, ViewPassContext } from 'feng3d';
import type { Canvas } from '../src/core/Canvas';
import type { CanvasRenderer } from '../src/core/CanvasRenderer';
import type { Rect } from '../src/Rect';

/**
 * UI 的独立渲染 Pass（方案 C）回归测试。
 *
 * 守住四件事：
 * 1. **不重复绘制**：UI 渲染器登记为 `renderPass: 'ui'` 后，主场景渲染列表
 *    （`ScenePickCache.blenditems` / `unblenditems`）必须跳过它，否则会被 3D 相机再画一次
 *    （像素几何 + 相机投影 = 错），而**拾取列表**必须仍然包含它；
 * 2. **真正的层级序**：收集顺序是树的前序（父先画、子后画），不再靠"到相机的距离"排序；
 * 3. **脱离视锥剔除**：UI 的像素坐标包围盒本来就在 3D 视锥之外，收集与相机无关；
 * 4. **相机无关的正交投影**：额外 Pass 的渲染对象被注入 `globalUniforms.u_Viewport`，
 *    这就是 UI 着色器做像素 → NDC 变换的依据。
 */
describe('UI 独立渲染 Pass（方案 C）', () =>
{
    /** 造一个含 Canvas 的 UI 场景：Canvas 下一个父 UI 对象，其下再挂一个子 UI 对象 */
    function buildScene()
    {
        function uiObject(name: string, children: Object3D[] = []): Object3D
        {
            const rect: Rect = { __type__: 'Rect', color: { __type__: 'Color4', r: 1, g: 0, b: 0, a: 1 } };

            return {
                __type__: 'Object3D',
                name,
                components: [
                    { __type__: 'Transform2D' },
                    { __type__: 'CanvasRenderer' } as CanvasRenderer,
                    rect,
                ],
                children,
            };
        }

        const parent = uiObject('parent');
        const child = uiObject('child');
        parent.children = [child];

        const canvasObject: Object3D = {
            __type__: 'Object3D',
            name: 'canvas',
            components: [{ __type__: 'Transform2D' }, { __type__: 'Canvas' } as Canvas],
            children: [parent],
        };

        // 相机开着视锥剔除：UI 不受它影响（这正是独立 Pass 的目的之一）
        const camera: PerspectiveCamera = { __type__: 'PerspectiveCamera', frustumCulling: true } as PerspectiveCamera;
        const cameraObject: Object3D = { __type__: 'Object3D', name: 'camera', components: [camera] };

        const scene: Scene = { __type__: 'Scene' } as Scene;
        const root: Object3D = {
            __type__: 'Object3D',
            name: 'root',
            components: [scene],
            children: [canvasObject, cameraObject],
        };

        logic(root); // 触发组件初始化（注入 entity、补 UI 默认 geometry / material）

        return {
            scene,
            root,
            camera,
            parentRenderer: parent.components![1] as CanvasRenderer,
            childRenderer: child.components![1] as CanvasRenderer,
        };
    }

    /** 造一个 UI Pass 上下文（updateUI 只读 canvas；camera / viewport 不影响本文件的断言） */
    function passContext(view: View): ViewPassContext
    {
        const canvas = logic(view).canvasElement;

        return {
            scene: logic(view).scene,
            camera: { __type__: 'PerspectiveCamera' } as unknown as ViewPassContext['camera'],
            viewport: [canvas.width, canvas.height],
            canvas,
        };
    }

    /** 用场景树造一个 View（画布元素默认 800×600） */
    function makeView(root: Object3D, width = 800, height = 600): View
    {
        const canvasElement = { width, height } as unknown as HTMLCanvasElement;
        const view = { __type__: 'View', canvas: canvasElement, root } as View;
        logic(view);

        return view;
    }

    it('UI Pass 已注册到 View pass 注册表', () =>
    {
        expect(getViewPassProviders().some((provider) => provider.name === 'ui')).toBe(true);
    });

    it('UI 渲染器不进主场景渲染列表，但类型表 / 拾取链仍认识它', () =>
    {
        const { scene, camera, parentRenderer } = buildScene();

        // 类型表仍认识 UI（登记 renderPass 只影响渲染列表，不改 renderable 标记）
        expect(isRenderable(parentRenderer)).toBe(true);

        // 关掉 3D 视锥剔除后拾取链收得到它——剔除是既有行为（遗留项），
        // 与"渲染列表排除 UI"是两件事，本用例只证明后者不是靠 isRenderable 变 false 实现的
        reactive(camera).frustumCulling = false;
        const pickCache = logic(scene).getPickCache(camera);

        expect(pickCache.blenditems.map((m) => toRaw(m))).not.toContain(parentRenderer);
        expect(pickCache.unblenditems.map((m) => toRaw(m))).not.toContain(parentRenderer);
        expect(pickCache.activeModels.map((m) => toRaw(m))).toContain(parentRenderer);
    });

    it('UI Pass 收集按层级序：父先于子（不再靠到相机的距离）', () =>
    {
        const { root, parentRenderer, childRenderer } = buildScene();
        const view = makeView(root);

        const collected = uiPassProvider.collect(view, passContext(view)).map((m) => toRaw(m));

        expect(collected).toContain(parentRenderer);
        expect(collected).toContain(childRenderer);
        expect(collected.indexOf(parentRenderer)).toBeLessThan(collected.indexOf(childRenderer));
    });

    it('UI 收集与相机视锥无关（相机的 frustumCulling 开着也照样收集）', () =>
    {
        const { root, camera, parentRenderer } = buildScene();
        const view = makeView(root);

        expect(logic(camera).frustumCulling).toBe(true);
        expect(uiPassProvider.collect(view, passContext(view)).map((m) => toRaw(m))).toContain(parentRenderer);
    });

    it('额外 Pass 的渲染对象注入 globalUniforms.u_Viewport（像素 → NDC 的来源）', () =>
    {
        const { scene, camera, root, parentRenderer } = buildScene();
        const view = makeView(root, 800, 600);
        const renderables = uiPassProvider.collect(view, passContext(view));

        const renderObjects = forwardRenderer.prepareExtraRenderObjects(scene, camera, [800, 600], renderables);
        const expected = logic(parentRenderer).renderObject.value;
        const ro = renderObjects.find((r) => r === expected)!;

        const globalUniforms = (ro.bindingResources as { globalUniforms?: { value: { u_Viewport: { x: number, y: number } } } })
            .globalUniforms!.value;
        expect(globalUniforms.u_Viewport).toEqual({ x: 800, y: 600 });
    });
});
