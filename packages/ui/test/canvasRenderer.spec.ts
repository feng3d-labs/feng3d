// 副作用导入：Object3D / Canvas / UI 组件都是纯数据类型，只用作类型标注的 import
// 会被转译器整条擦除，于是 feng3d 与本包的 registerLogic 都不执行、logic() 返回 null
// （第 1 批实测踩过的坑，见 tmp/progress-ui-migration.md）。
import 'feng3d';
import { CullFace, Object3D, View } from 'feng3d';
import { logic, reactive } from '@feng3d/reactivity';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/core/Canvas';
import '../src/core/CanvasRenderer';
import '../src/core/Transform2D';
import '../src/core/UIGeometry';
import '../src/core/UIMaterial';
import type { Canvas } from '../src/core/Canvas';
import type { CanvasRenderer } from '../src/core/CanvasRenderer';
import { drawCanvas } from '../src/core/CanvasRenderer';
import { getTransform2D } from '../src/core/Transform2D';

/** 造一个世界空间射线（`Ray3` 是 `Line3` 的类型别名，判别字段是 `'Line3'`） */
function ray3(origin: { x: number, y: number, z: number }, direction = { x: 0, y: 0, z: 1 })
{
    return { __type__: 'Line3' as const, origin, direction };
}

/** 挂一个 CanvasRenderer：可选的父级 Canvas、可选的 Transform2D 尺寸/中心点 */
function mountCanvasRenderer(options: {
    withCanvasAncestor?: boolean;
    size?: { x: number, y: number };
    pivot?: { x: number, y: number };
} = {})
{
    const rendererObject: Object3D = {
        __type__: 'Object3D',
        components: [
            { __type__: 'Transform2D', size: options.size ?? { x: 1, y: 1 }, pivot: options.pivot ?? { x: 0, y: 0 } },
            { __type__: 'CanvasRenderer' },
        ],
    };

    let root = rendererObject;
    if (options.withCanvasAncestor)
    {
        root = {
            __type__: 'Object3D',
            components: [{ __type__: 'Transform2D' }, { __type__: 'Canvas' }],
            children: [rendererObject],
        };
    }
    logic(root);

    const canvas = root.components!.find((component) => component.__type__ === 'Canvas') as Canvas | undefined;

    return {
        root,
        canvas,
        rendererObject,
        renderer: rendererObject.components!.find((component) => component.__type__ === 'CanvasRenderer') as CanvasRenderer,
    };
}

describe('CanvasRenderer（新架构迁移）', () =>
{
    afterEach(() =>
    {
        vi.unstubAllGlobals();
    });

    it('缺省 geometry / material 由 Logic 补成 UI 默认值，显式声明不被覆盖', () =>
    {
        const omitted: Object3D = { __type__: 'Object3D', components: [{ __type__: 'CanvasRenderer' }] };
        logic(omitted);
        const renderer = omitted.components![0] as CanvasRenderer;

        expect(renderer.geometry!.__type__).toBe('UIGeometry');
        expect(renderer.material!.__type__).toBe('StandardMaterial');

        const explicit: Object3D = {
            __type__: 'Object3D',
            components: [{
                __type__: 'CanvasRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: { __type__: 'StandardMaterial' },
            }],
        };
        logic(explicit);

        expect((explicit.components![0] as CanvasRenderer).geometry!.__type__).toBe('CubeGeometry');
    });

    it('worldRayIntersection：有 Canvas 祖先时改用画布鼠标射线，并按 2D 尺寸/中心点换算', () =>
    {
        // 尺寸 (2,2)、中心点 (0,0) → 鼠标 (0.5,0.5) 除以尺寸后为本地 (0.25,0.25)
        const { canvas, renderer } = mountCanvasRenderer({
            withCanvasAncestor: true,
            size: { x: 2, y: 2 },
            pivot: { x: 0, y: 0 },
        });
        logic(canvas!).calcMouseRay3D({ x: 0.5, y: 0.5 });

        // 传入的世界射线被忽略（改读画布鼠标射线），命中 UI 单位四边形
        const hit = logic(renderer).worldRayIntersection(ray3({ x: 0, y: 0, z: 5 }, { x: 0, y: 0, z: -1 }));

        expect(hit).toBeTruthy();
        // UI 强制双面可拾取
        expect(hit.cullFace).toBe(CullFace.NONE);
        expect(hit.localRay.origin).toEqual({ x: 0.25, y: 0.25, z: 0 });
        expect(hit.localRay.direction).toEqual({ x: 0, y: 0, z: 1 });
        expect(hit.rayEntryDistance).toBe(0);
    });

    it('worldRayIntersection：没有 Canvas 祖先时用传入的世界射线', () =>
    {
        const { renderer } = mountCanvasRenderer({ size: { x: 1, y: 1 }, pivot: { x: 0, y: 0 } });

        const hit = logic(renderer).worldRayIntersection(ray3({ x: 0.5, y: 0.5, z: 0 }));

        expect(hit).toBeTruthy();
        expect(hit.localRay.origin).toEqual({ x: 0.5, y: 0.5, z: 0 });
    });

    it('worldRayIntersection：未挂载到对象上时返回 null（不抛异常）', () =>
    {
        const lone = logic({ __type__: 'CanvasRenderer' } as CanvasRenderer);

        expect(lone.worldRayIntersection(ray3({ x: 0.5, y: 0.5, z: 0 }))).toBeNull();
    });

    it('drawCanvas：布局到画布尺寸、更新鼠标射线、写入 u_viewProjection / u_rect', () =>
    {
        const canvasObject: Object3D = {
            __type__: 'Object3D',
            components: [{ __type__: 'Transform2D' }, { __type__: 'Canvas' }, { __type__: 'CanvasRenderer' }],
        };
        const root: Object3D = { __type__: 'Object3D', name: 'ui-root', children: [canvasObject] };
        const canvasElement = { width: 100, height: 50 } as unknown as HTMLCanvasElement;
        const view = { __type__: 'View', canvas: canvasElement, root } as View;
        logic(view);

        drawCanvas(view, { x: 10, y: 20 });

        const canvasComp = canvasObject.components!.find((component) => component.__type__ === 'Canvas') as Canvas;
        const renderer = canvasObject.components!.find((component) => component.__type__ === 'CanvasRenderer') as CanvasRenderer;

        // ① Canvas.layout 把画布尺寸写到 Transform2D，并按鼠标位置更新射线
        expect(getTransform2D(canvasObject)!.size).toEqual({ x: 100, y: 50 });
        expect(logic(canvasComp).mouseRay.origin).toEqual({ x: 10, y: 20, z: 0 });

        // ② 渲染对象的 UI uniform：投影矩阵来自 CanvasLogic，u_rect 来自 Transform2DLogic
        const renderObject = logic(renderer).renderObject.value as { uniforms?: Record<string, unknown> };
        const u_rect = renderObject.uniforms!.u_rect as { x: number, y: number, z: number, w: number };
        expect(renderObject.uniforms!.u_viewProjection).toBe(logic(canvasComp).projection);
        // 中心点 (0,0) 时 x / y 是 -0（`-pivot.x * size.x`），按数值比较
        expect(u_rect.x).toBeCloseTo(0);
        expect(u_rect.y).toBeCloseTo(0);
        expect(u_rect.z).toBe(100);
        expect(u_rect.w).toBe(50);

        // ③ 画布尺寸变化后重绘：uniform 容器是同一个对象，u_rect 随响应式链更新
        (canvasElement as { width: number }).width = 200;
        (canvasElement as { height: number }).height = 100;
        drawCanvas(view);

        const u_rectAfter = renderObject.uniforms!.u_rect as { z: number, w: number };
        expect(u_rectAfter.z).toBe(200);
        expect(u_rectAfter.w).toBe(100);
        // 未传鼠标位置时保留上一次的射线（不清零）
        expect(logic(canvasComp).mouseRay.origin).toEqual({ x: 10, y: 20, z: 0 });
    });

    it('drawCanvas：不可见/未启用的组件被跳过', () =>
    {
        const canvasObject: Object3D = {
            __type__: 'Object3D',
            components: [{ __type__: 'Transform2D' }, { __type__: 'Canvas' }, { __type__: 'CanvasRenderer' }],
        };
        const root: Object3D = { __type__: 'Object3D', children: [canvasObject] };
        const canvasElement = { width: 100, height: 50 } as unknown as HTMLCanvasElement;
        const view = { __type__: 'View', canvas: canvasElement, root } as View;
        logic(view);

        const canvasComp = canvasObject.components!.find((component) => component.__type__ === 'Canvas') as Canvas;
        const renderer = canvasObject.components!.find((component) => component.__type__ === 'CanvasRenderer') as CanvasRenderer;
        reactive(renderer).enabled = false;

        drawCanvas(view, { x: 1, y: 2 });

        // Canvas 仍然被布局（它是启用的），但被禁用的 CanvasRenderer 不参与装配
        expect(getTransform2D(canvasObject)!.size).toEqual({ x: 100, y: 50 });
        expect(logic(canvasComp).mouseRay.origin).toEqual({ x: 1, y: 2, z: 0 });
        // 读 renderObject 会就地算出 u_rect（Transform2D 的 beforeRender），但 draw 没写过投影矩阵
        const renderObject = logic(renderer).renderObject.value as { uniforms?: Record<string, unknown> };
        expect(renderObject.uniforms?.u_viewProjection).toBeUndefined();
    });

    it('ViewLogic.scene / canvasElement：只读入口能取到默认 Scene 并解析字符串 id', () =>
    {
        const canvasElement = { width: 10, height: 10 } as unknown as HTMLCanvasElement;
        vi.stubGlobal('document', { getElementById: (id: string) => (id === 'ui-canvas' ? canvasElement : null) });

        const root: Object3D = { __type__: 'Object3D' };
        const view = { __type__: 'View', canvas: 'ui-canvas', root } as View;
        const viewLogic = logic(view);

        expect(viewLogic.canvasElement).toBe(canvasElement);
        // scene 缺失时就地创建默认 Scene 并挂到 root.components
        expect(viewLogic.scene.__type__).toBe('Scene');
        expect(root.components!.some((component) => component.__type__ === 'Scene')).toBe(true);
    });
});
