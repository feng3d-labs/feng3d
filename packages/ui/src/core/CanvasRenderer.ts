import { CullFace, Object3D, PickingCollisionVO, Renderable, RenderableLogic, registerComponentType, View } from 'feng3d';
import { logic as getLogic, registerLogic, UnReadonly } from '@feng3d/reactivity';
import {
    mat4TransformRay,
    Ray3,
    vec3Add,
    vec3Divide,
    vec3NormalizeThickness,
    Vector2Like,
} from '@feng3d/math';
// 副作用导入：`getComponentsInChildren('Canvas')` 取到的是纯数据，行为要靠 CanvasLogic；
// 只用作类型标注的 import 会被转译器整条擦除，那样 Canvas 的 registerLogic 就不会执行。
import './Canvas';
import type { Canvas } from './Canvas';
import { getTransform2D } from './Transform2D';
import { createUIGeometry } from './UIGeometry';
import { createUIMaterial, uiUniforms } from './UIMaterial';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        CanvasRenderer: CanvasRenderer;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        CanvasRenderer: CanvasRendererLogic;
    }
}

/**
 * 可在画布上渲染组件（纯数据接口），使得拥有该组件的 Object3D 可以在画布上渲染。
 *
 * 渲染行为由 {@link CanvasRendererLogic} 提供（继承 {@link RenderableLogic}）：
 * - `geometry` / `material` 缺失时由 Logic 补 UI 默认值（见 `CanvasRendererLogic` 构造）；
 * - `worldRayIntersection` 覆写基类：UI 用画布鼠标射线 + 2D 尺寸/中心点换算后再做包围盒求交。
 *
 * 字段一律 `readonly`，修改经 `reactive(canvasRenderer).field = value` 写入。
 */
export interface CanvasRenderer extends Renderable
{
    readonly __type__: 'CanvasRenderer';
}

/**
 * CanvasRenderer 逻辑类。
 *
 * 继承 {@link RenderableLogic}（复用 renderObject computed / 包围盒 / 射线相交 / 加载状态），
 * 额外：
 * - 构造时补 `geometry` / `material` 默认值（UI 单位四边形 + UI 材质）；
 * - 覆写 `worldRayIntersection`：用画布鼠标射线与 2D 尺寸/中心点做坐标换算。
 */
export class CanvasRendererLogic extends RenderableLogic
{
    protected constructor(data: CanvasRenderer)
    {
        // §11.5：构造参数字段可选，默认值由 Logic 工厂补（写在 raw 数据上，不涉及 this，放 super() 之前）。
        // 迁移前这两个字段的初始值是 `Geometry.getDefault('Default-UIGeometry')` /
        // `Material.getDefault('Default-UIMaterial')`——默认几何体/材质注册表已随阶段 C 删除，
        // 旧写法会让 `{ __type__: 'CanvasRenderer' }` 落到 RenderableLogic 的 CubeGeometry /
        // StandardMaterial 回退上（UI 着色器要的是单位四边形，不是居中的 Cube）。
        const writable = data as UnReadonly<CanvasRenderer>;
        if (writable.geometry === undefined) writable.geometry = createUIGeometry();
        if (writable.material === undefined) writable.material = createUIMaterial();

        super(data);
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: CanvasRenderer): CanvasRendererLogic
    {
        return new CanvasRendererLogic(data);
    }

    /**
     * 与世界空间射线相交（覆写基类）。
     *
     * 与基类的差异（迁移前 `CanvasRenderer.worldRayIntersection` 的原逻辑）：
     * 1. 若父级上有 Canvas，则**忽略传入的射线**、改用画布的鼠标射线（`CanvasLogic.mouseRay`）；
     * 2. 变换到本地空间后，再按 2D 尺寸/中心点把射线归一化到 UI 单位四边形（`[0,1]²`）坐标系；
     * 3. 命中后强制 `cullFace = NONE`（UI 双面可拾取）。
     *
     * @param worldRay 世界空间射线
     * @returns 相交信息；未挂载到对象、或未命中包围盒时为 `null`
     */
    override worldRayIntersection(worldRay: Ray3): PickingCollisionVO
    {
        // `RenderableLogic` 用 `this.entity!` 断言非空；这里未挂载（没有宿主对象）时按「未命中」返回，
        // 与基类在包围盒未命中时的返回一致（`logic(单独组件)` 不会抛异常）。
        const entity = this.entity as Object3D | null;
        if (!entity) return null as unknown as PickingCollisionVO;

        const canvas = getLogic(entity).getComponentsInParent<Canvas>('Canvas')[0];
        const ray = canvas ? getLogic(canvas).mouseRay : worldRay;

        // 阶段 C-e：`new Ray3()` 改成等价的纯数据字面量（原点为零向量、方向 +Z，与 Line3 默认一致）；
        // `mat4TransformRay` 的 `out` 就是它，就地写入 origin / direction 两个子对象
        const localRay: Ray3 = { __type__: 'Line3', origin: { x: 0, y: 0, z: 0 }, direction: { x: 0, y: 0, z: 1 } };
        mat4TransformRay(getLogic(entity).world2local, ray, localRay);

        const transform2D = getTransform2D(entity);
        if (transform2D)
        {
            // 迁移前的 `new Vector3(size.x, size.y, 1)` / `new Vector3(pivot.x, pivot.y, 0)`；
            // 纯数据字段可缺省，按 Transform2DLogic 记录的默认值补（size 1、pivot 0.5）
            const size = { x: transform2D.size?.x ?? 1, y: transform2D.size?.y ?? 1, z: 1 };
            const pivot = { x: transform2D.pivot?.x ?? 0.5, y: transform2D.pivot?.y ?? 0.5, z: 0 };
            // 迁移前的链式调用 `origin.divide(size).add(pivot)` / `direction.divide(size).normalize()`：
            // 纯函数版把 out 传自身即为就地语义；`normalize`（长度平方判定）对应 vec3NormalizeThickness
            vec3Add(vec3Divide(localRay.origin, size, localRay.origin), pivot, localRay.origin);
            vec3NormalizeThickness(vec3Divide(localRay.direction, size, localRay.direction), 1, localRay.direction);
        }

        const pickingCollisionVO = super.localRayIntersection(localRay);
        if (pickingCollisionVO)
        {
            pickingCollisionVO.cullFace = CullFace.NONE;
        }

        return pickingCollisionVO;
    }
}

// 注册到统一 logic 分发表
registerLogic('CanvasRenderer', CanvasRendererLogic as unknown as new (data: CanvasRenderer) => CanvasRendererLogic);

// 登记组件类型：让引擎的类型表认识这个**上层包**的类型（feng3d 不硬编码 ui 的类型名）。
// 不做这一步的后果（收尾批任务 1 实测）：`matchType` / `isRenderable` / `isRayCastable`
// 都认不出 'CanvasRenderer'，于是 `Scene.models`、`getComponentsInChildren('Renderable')`、
// `Scene.mouseCheckObjects`、`Raycaster.pick` 全部扫不到 UI 渲染器——UI 渲染不出来、拾取不到。
// `renderable` / `rayCastable` 由 baseTypes（含 Renderable）派生，无需显式写。
registerComponentType('CanvasRenderer', { baseTypes: ['Renderable'] });

/**
 * 绘制视图中的 UI（迁移前是 `CanvasRenderer.draw(view)` 静态方法）。
 *
 * 为什么不再是静态方法：`CanvasRenderer` 已是纯数据接口（没有类，接口不能挂静态成员），
 * 与 `createCanvasObject3D()` / `getTransform2D()` 同批改为模块级导出函数。
 *
 * 流程（与迁移前逐条对应）：
 * 1. 取视图场景（`ViewLogic.scene`）与画布元素（`ViewLogic.canvasElement`，字符串 id 在此解析）；
 * 2. 遍历场景中的 Canvas 组件（`getComponentsInChildren('Canvas')`，纯数据类型只认 `__type__` 字符串），
 *    逐个 `layout` 到画布尺寸；
 * 3. 遍历 Canvas 下的 CanvasRenderer，取其 renderObject 并把投影矩阵写进 `u_viewProjection`。
 *
 * ⚠️ 实际绘制仍待接入：迁移前此处调 `view.gl.render(renderAtomic)`，WebGL 路径已整体移除，
 * WebGPU 的 UI 渲染链是独立事项（本批不发明）；因此本函数当前只做布局与 uniform 装配。
 *
 * ⚠️ 鼠标位置须显式传入：迁移前读 `view.mousePos`（新架构的 `View` 无该字段，鼠标位置由输入层持有），
 * 不传时保留上一次的鼠标射线（不会把它清成 0）。
 *
 * @param view 视图（`ViewLogic` 由 `logic(view)` 取用）
 * @param mousePos 画布内鼠标位置（可选；传入时更新各 Canvas 的鼠标射线）
 */
export function drawCanvas(view: View, mousePos?: Vector2Like): void
{
    const viewLogic = getLogic(view);

    // 纯数据 Scene 没有 `getComponentsInChildren`（行为在 SceneLogic 上），
    // 树搜索的起点是场景组件的宿主对象——与迁移前 `scene.getComponentsInChildren(Canvas)` 等价
    const sceneEntity = getLogic(viewLogic.scene).entity as Object3D | null;
    if (!sceneEntity) return;

    const canvas = viewLogic.canvasElement;
    const canvasList = getLogic(sceneEntity)
        .getComponentsInChildren<Canvas>('Canvas')
        .filter((v) => getLogic(v).isVisibleAndEnabled.value);

    canvasList.forEach((canvasComp) =>
    {
        const canvasLogic = getLogic(canvasComp);
        canvasLogic.layout(canvas.width, canvas.height);

        if (mousePos) canvasLogic.calcMouseRay3D(mousePos);

        const canvasEntity = canvasLogic.entity as Object3D | null;
        if (!canvasEntity) return;

        const renderables = getLogic(canvasEntity)
            .getComponentsInChildren<CanvasRenderer>('CanvasRenderer')
            .filter((v) => getLogic(v).isVisibleAndEnabled.value);

        renderables.forEach((renderable) =>
        {
            // renderObject computed 内部已分发 geometry / material / transform 与同对象组件的
            // beforeRender（迁移前是显式调 `renderable.beforeRender(renderAtomic, null, null)`）
            const renderObject = getLogic(renderable).renderObject.value;

            // 迁移前的 `(renderAtomic.uniforms ||= {}).u_viewProjection = canvasComp.projection`
            uiUniforms(renderObject).u_viewProjection = canvasLogic.projection;
        });
    });
}
