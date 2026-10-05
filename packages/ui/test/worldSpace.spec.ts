// 副作用导入：Object3D / Canvas / UI 组件都是纯数据类型，只用作类型标注的 import
// 会被转译器整条擦除，于是 feng3d 与本包的 registerLogic 都不执行、logic() 返回 null。
import 'feng3d';
import { Object3D } from 'feng3d';
import type { Components } from 'feng3d';
import { logic } from '@feng3d/reactivity';
import { describe, expect, it } from 'vitest';
import '../src/core/Canvas';
import '../src/core/CanvasRenderer';
import '../src/core/Transform2D';
import '../src/core/UIMaterial';
import '../src/Rect';
import { uiMaterialWGSL } from '../src/core/UIMaterial';
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
    const rect: Rect = { __type: 'Rect', color: { __type__: 'Color4', r: 1, g: 0, b: 1, a: 1 } };
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

    it('着色器同时支持两种投影：世界空间走 cameraUniforms，屏幕空间走 u_Viewport', () =>
    {
        expect(uiMaterialWGSL).toContain('cameraUniforms.u_viewProjection');
        expect(uiMaterialWGSL).toContain('globalUniforms.u_Viewport');
        expect(uiMaterialWGSL).toContain('u_projection.x > 0.5');
    });
});
