// 副作用导入：Object3D / Canvas / UI 组件都是纯数据类型，只用作类型标注的 import
// 会被转译器整条擦除，于是 feng3d 与本包的 registerLogic 都不执行、logic() 返回 null。
import 'feng3d';
import { Object3D } from 'feng3d';
import type { Components, Ray3 } from 'feng3d';
import { logic } from '@feng3d/reactivity';
import { describe, expect, it } from 'vitest';
import '../src/core/Canvas';
import '../src/core/CanvasRenderer';
import '../src/core/Transform2D';
import '../src/core/UIMaterial';
import '../src/Rect';
import { getUIMaterialShaderWGSL } from '../src/core/uiMaterialShader';
import { UIRenderMode } from '../src/enums/UIRenderMode';
import type { Canvas } from '../src/core/Canvas';
import type { CanvasRenderer } from '../src/core/CanvasRenderer';
import type { Rect } from '../src/Rect';

/**
 * `UIRenderMode.WorldSpace`（把 UI 画在 3D 场景里的一个平面上）回归测试。
 *
 * 两件事必须成立：
 * 1. **投影模式**：世界空间的 UI 用 `cameraUniforms.u_viewProjection`（随 3D 摆放），
 *    屏幕空间用 `globalUniforms.u_Viewport`（与相机无关）——
 *    由 `CanvasRendererLogic.beforeRender` 按祖先 Canvas 的 `renderMode` 写 `u_projection`；
 * 2. **宿主变换**：世界空间的 Canvas 不能被 `layout` 复位（否则 UI 会被打回屏幕原点、
 *    缩放到 1 倍，看起来又变成屏幕空间）。
 */

/** UI uniform 容器是渲染对象上的动态字段 */
type UniformsOf = { uniforms?: { u_projection?: { x: number } } };

/** 造「Canvas（可选世界空间）→ UI 元素」的最小场景 */
function buildScene(renderMode?: UIRenderMode)
{
    const rect: Rect = { __type__: 'Rect', color: { __type__: 'Color4', r: 1, g: 0, b: 1, a: 1 } };
    const renderer: CanvasRenderer = { __type__: 'CanvasRenderer' };
    const uiObject: Object3D = {
        __type__: 'Object3D',
        name: 'ui',
        components: [
            {
                __type__: 'TransformLayout',
                position: { x: 0, y: 0, z: 0 },
                size: { x: 100, y: 50, z: 1 },
                leftTop: { x: 0, y: 0, z: 0 },
                rightBottom: { x: 0, y: 0, z: 0 },
                anchorMin: { x: 0.5, y: 0.5, z: 0.5 },
                anchorMax: { x: 0.5, y: 0.5, z: 0.5 },
                pivot: { x: 0.5, y: 0.5, z: 0.5 },
            },
            { __type__: 'Transform2D' },
            renderer,
            rect,
        ] as Components[],
    };
    const canvasComponents: Components[] = renderMode === undefined
        ? [{ __type__: 'Canvas' } as Components]
        : [{ __type__: 'Canvas', renderMode } as Components];
    const canvasObject: Object3D = {
        __type__: 'Object3D',
        name: 'canvas',
        position: { x: 2, y: 1, z: 0 },
        rotation: { x: 0, y: 0.5, z: 0 },
        scale: { x: 0.01, y: 0.01, z: 0.01 },
        components: [{ __type__: 'Transform2D' } as Components, ...canvasComponents],
        children: [uiObject],
    };

    logic(canvasObject); // 触发初始化（注入 entity、补 UI 默认 geometry / material）

    return { canvasObject, renderer };
}

describe('UIRenderMode.WorldSpace（UI 画在 3D 平面上）', () =>
{
    it('屏幕空间（默认）：u_projection.x = 0，且 layout 复位宿主 3D 变换', () =>
    {
        const { canvasObject, renderer } = buildScene();
        const canvas = canvasObject.components!.find((component) => component.__type__ === 'Canvas') as Canvas;
        logic(canvas).layout(800, 600);

        // 屏幕空间画布钉在画布像素原点：位置 / 旋转 / 缩放被复位
        expect(canvasObject.position).toEqual({ x: 0, y: 0, z: 0 });
        expect(canvasObject.scale).toEqual({ x: 1, y: 1, z: 1 });

        const uniforms = (logic(renderer).renderObject.value as UniformsOf).uniforms!;
        expect(uniforms.u_projection!.x).toBe(0);
    });

    it('世界空间：u_projection.x = 1，且 layout 保留宿主 3D 变换', () =>
    {
        const { canvasObject, renderer } = buildScene(UIRenderMode.WorldSpace);
        const canvas = canvasObject.components!.find((component) => component.__type__ === 'Canvas') as Canvas;
        logic(canvas).layout(800, 600);

        // 世界空间画布的位置 / 旋转 / 缩放就是它在 3D 里的摆放，必须保留
        expect(canvasObject.position).toEqual({ x: 2, y: 1, z: 0 });
        expect(canvasObject.rotation).toEqual({ x: 0, y: 0.5, z: 0 });
        expect(canvasObject.scale).toEqual({ x: 0.01, y: 0.01, z: 0.01 });

        const uniforms = (logic(renderer).renderObject.value as UniformsOf).uniforms!;
        expect(uniforms.u_projection!.x).toBe(1);
    });

    it('世界空间：用传入的世界射线判定（相机射线对准元素中心 → 命中）', () =>
    {
        const { canvasObject, renderer } = buildScene(UIRenderMode.WorldSpace);
        const canvas = canvasObject.components!.find((component) => component.__type__ === 'Canvas') as Canvas;
        logic(canvas).layout(800, 600);

        // 元素局部位置为 0，故其数据世界位置 ≈ 宿主 Canvas 的位置（2,1,0）。
        // 传入的是"所见"射线：元素在屏幕上被 y 镜像显示，所以 y 取 -1（拾取内部会翻回来）。
        const worldRay: Ray3 = { __type__: 'Line3', origin: { x: 2, y: -1, z: 5 }, direction: { x: 0, y: 0, z: -1 } };

        expect(logic(renderer).worldRayIntersection(worldRay)).toBeTruthy();
    });

    it('世界空间：射线打在元素内但偏离中心也应命中（尺寸回退到 TransformLayout）', () =>
    {
        const { canvasObject, renderer } = buildScene(UIRenderMode.WorldSpace);
        const canvas = canvasObject.components!.find((component) => component.__type__ === 'Canvas') as Canvas;
        logic(canvas).layout(800, 600);

        // 元素尺寸 100×50、缩放 0.01 → 世界半宽 0.5；偏 49 像素（0.49 世界单位）仍在元素内。
        // 宿主 Canvas 绕 Y 转了 0.5，所以必须沿元素**法线**构造射线，
        // 否则"世界 x 偏移"会同时带出局部 z 偏移，测的就不是归一化了。
        // 修复前归一化用的 size 退化成 1（Transform2D.size 首次未镜像），
        // 49 像素会被当成 49.5 个"单位"直接判出界 → 不命中。
        const theta = 0.5;
        const nx = Math.sin(theta);
        const nz = Math.cos(theta);
        const lx = 0.49 * Math.cos(theta);
        const lz = -0.49 * Math.sin(theta);
        const worldRay: Ray3 = {
            __type__: 'Line3',
            origin: { x: 2 + lx + nx * 5, y: -1, z: lz + nz * 5 },   // y 取反：传入"所见"射线
            direction: { x: -nx, y: 0, z: -nz },
        };

        expect(logic(renderer).worldRayIntersection(worldRay)).toBeTruthy();
    });

    it('世界空间：射线偏离元素时不命中（证明用的确实是传入射线，而不是画布鼠标射线）', () =>
    {
        const { canvasObject, renderer } = buildScene(UIRenderMode.WorldSpace);
        const canvas = canvasObject.components!.find((component) => component.__type__ === 'Canvas') as Canvas;
        logic(canvas).layout(800, 600);

        // x 偏出 100 个世界单位（缩放 0.01 → 局部偏出 10000 像素），必然不命中
        const worldRay: Ray3 = { __type__: 'Line3', origin: { x: 102, y: -1, z: 5 }, direction: { x: 0, y: 0, z: -1 } };

        expect(logic(renderer).worldRayIntersection(worldRay)).toBeFalsy();
    });

    it('着色器同时支持两种投影：世界空间走 cameraUniforms，屏幕空间走 u_Viewport', () =>
    {
        const vertex = getUIMaterialShaderWGSL().vertex;
        expect(vertex).toContain('cameraUniforms.u_viewProjection');
        expect(vertex).toContain('globalUniforms.u_Viewport');
        expect(vertex).toContain('u_projection.x > 0.5');
    });
});
