// 副作用导入：Object3D / Canvas / UI 组件都是纯数据类型，只用作类型标注的 import
// 会被转译器整条擦除，于是 feng3d 与本包的 registerLogic 都不执行、logic() 返回 null
// （第 1 批实测踩过的坑，见 tmp/progress-ui-migration.md）。
import 'feng3d';
import { CullFace, Object3D, View } from 'feng3d';
import { logic, reactive, toRaw } from '@feng3d/reactivity';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/core/Canvas';
import '../src/core/CanvasRenderer';
import '../src/core/Transform2D';
import '../src/core/UIGeometry';
import '../src/core/UIMaterial';
import type { Canvas } from '../src/core/Canvas';
import type { CanvasRenderer } from '../src/core/CanvasRenderer';
import { drawCanvas } from '../src/core/CanvasRenderer';
import { uiPassProvider } from '../src/core/UIPass';
import { getTransform2D } from '../src/core/Transform2D';
import type { ViewPassContext } from 'feng3d';

/** 造一个世界空间射线（`Ray3` 是 `Line3` 的类型别名，判别字段是 `'Line3'`） */
function ray3(origin: { x: number, y: number, z: number }, direction = { x: 0, y: 0, z: 1 })
{
    return { __type__: 'Line3' as const, origin, direction };
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
        // 本批起是真正的 UI 材质（迁移期为 StandardMaterial 占位，UI 因此用标准光照着色器渲染）
        expect(renderer.material!.__type__).toBe('UIMaterial');

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

    it('drawCanvas：只更新鼠标射线（布局移交 UI Pass，绘制由 UI Pass 承担）', async () =>
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

        // ① 鼠标射线按传入位置更新
        expect(logic(canvasComp).mouseRay.origin).toEqual({ x: 10, y: 20, z: 0 });

        // ② 布局不由 drawCanvas 做——它已移交 UI Pass 的每帧准备
        expect(getTransform2D(canvasObject)!.size).toBeUndefined();

        // ③ 画布尺寸经 UI Pass 的准备落到 Canvas 上，u_rect 随之写入渲染对象
        uiPassProvider.update!(view, passContext(view));
        expect(getTransform2D(canvasObject)!.size).toEqual({ x: 100, y: 50 });

        const renderObject = logic(renderer).renderObject.value as { uniforms?: Record<string, unknown> };
        const u_rect = renderObject.uniforms!.u_rect as { x: number, y: number, z: number, w: number };
        expect(u_rect.z).toBe(100);
        expect(u_rect.w).toBe(50);
        // 旧通路（渲染前手写 u_viewProjection）已作废：投影改由 UI 着色器的 u_Viewport 承担
        expect(renderObject.uniforms!.u_viewProjection).toBeUndefined();

        // ④ 画布尺寸变化 → 再次准备：Transform2D.size 同步写入，
        //    u_rect 走布局 computed（在 ticker 帧里重算），等它跟上
        (canvasElement as { width: number }).width = 200;
        (canvasElement as { height: number }).height = 100;
        uiPassProvider.update!(view, passContext(view));

        expect(getTransform2D(canvasObject)!.size).toEqual({ x: 200, y: 100 });
        await vi.waitFor(() =>
        {
            // computed 是 pull 语义：重新读 renderObject 才会让 beforeRender 重跑、刷新容器
            logic(renderer).renderObject.value;
            const u_rectAfter = renderObject.uniforms!.u_rect as { z: number, w: number };
            expect(u_rectAfter.z).toBe(200);
            expect(u_rectAfter.w).toBe(100);
        });
    });

    it('UI Pass 收集：不可见 / 未启用的组件被跳过', () =>
    {
        const rendererObject: Object3D = {
            __type__: 'Object3D',
            components: [{ __type__: 'CanvasRenderer' }],
        };
        const canvasObject: Object3D = {
            __type__: 'Object3D',
            components: [{ __type__: 'Transform2D' }, { __type__: 'Canvas' }],
            children: [rendererObject],
        };
        const root: Object3D = { __type__: 'Object3D', children: [canvasObject] };
        const canvasElement = { width: 100, height: 50 } as unknown as HTMLCanvasElement;
        const view = { __type__: 'View', canvas: canvasElement, root } as View;
        logic(view);

        const renderer = rendererObject.components![0] as CanvasRenderer;

        // 收集返回的是响应式代理，比较前先还原为原始对象
        expect(uiPassProvider.collect(view, passContext(view)).map((m) => toRaw(m))).toContain(renderer);

        reactive(renderer).enabled = false;
        expect(uiPassProvider.collect(view, passContext(view)).map((m) => toRaw(m))).not.toContain(renderer);
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
