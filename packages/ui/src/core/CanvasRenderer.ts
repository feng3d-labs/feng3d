import { CullFace, Object3D, PickingCollisionVO, Renderable, RenderableLogic, createRenderableLogicBase, registerComponentType, View } from 'feng3d';
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
import { createUIMaterial } from './UIMaterial';
import type { UIMaterial, UIMaterialLogic } from './UIMaterial';

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
 * CanvasRenderer 逻辑接口。
 *
 * 继承 {@link RenderableLogic}（复用 renderObject computed / 包围盒 / 射线相交 / 加载状态），
 * 额外：
 * - 构造时补 `geometry` / `material` 默认值（UI 单位四边形 + UI 材质）；
 * - 覆写 `worldRayIntersection`：用画布鼠标射线与 2D 尺寸/中心点做坐标换算。
 */
export interface CanvasRendererLogic extends RenderableLogic
{
}

/**
 * 工厂函数：CanvasRendererLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * 原构造函数体：补 `geometry` / `material` 默认值（写在 raw 数据上）。
 *
 * @param data 画布渲染器组件数据（raw）
 */
export function canvasRendererLogic(data: CanvasRenderer): CanvasRendererLogic
{
    // §11.5：构造参数字段可选，默认值由 Logic 工厂补（写在 raw 数据上）。
    // 迁移前这两个字段的初始值是 `Geometry.getDefault('Default-UIGeometry')` /
    // `Material.getDefault('Default-UIMaterial')`——默认几何体/材质注册表已随阶段 C 删除，
    // 旧写法会让 `{ __type__: 'CanvasRenderer' }` 落到 RenderableLogic 的 CubeGeometry /
    // StandardMaterial 回退上（UI 着色器要的是单位四边形，不是居中的 Cube）。
    const writable = data as UnReadonly<CanvasRenderer>;
    if (writable.geometry === undefined) writable.geometry = createUIGeometry();
    if (writable.material === undefined) writable.material = createUIMaterial();

    const { members } = createRenderableLogicBase(data);

    const logic: CanvasRendererLogic = {
        get component() { return members.component; },
        get entity() { return members.entity; },
        get isVisibleAndEnabled() { return members.isVisibleAndEnabled; },
        get lightPicker() { return members.lightPicker; },
        get renderObject() { return members.renderObject; },
        get selfLocalBounds() { return members.selfLocalBounds; },
        get selfWorldBounds() { return members.selfWorldBounds; },
        get isLoaded() { return members.isLoaded; },
        baseBeforeRender(renderObject) { members.baseBeforeRender(renderObject); },
        init(object3D) { members.init(object3D); },
        update(interval) { members.update(interval); },
        localRayIntersection(localRay) { return members.localRayIntersection(localRay); },
        /**
         * 渲染前补一次 UI 纹理绑定（覆写基类）。
         *
         * 渲染顺序：`Renderable` 的 renderObject computed 先跑材质 `beforeRender`、再跑同对象
         * 其他组件——`Image` / `Text` 写的 `s_texture` 落在材质之后，首帧材质绑定到的是占位纹理。
         * 覆写后在基类分发的末尾补调一次 `syncRenderObject`（幂等），首帧就用上真纹理。
         */
        beforeRender(renderObject)
        {
            members.beforeRender(renderObject);

            const material = (logic.component as CanvasRenderer | undefined)?.material;
            if (material && (material as { __type__?: string }).__type__ === 'UIMaterial')
            {
                (getLogic(material as UIMaterial) as UIMaterialLogic).syncRenderObject(renderObject);
            }
        },
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
        worldRayIntersection(worldRay)
        {
            // `RenderableLogic` 用 `this.entity!` 断言非空；这里未挂载（没有宿主对象）时按「未命中」返回，
            // 与基类在包围盒未命中时的返回一致（`logic(单独组件)` 不会抛异常）。
            const entity = logic.entity;
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

            const pickingCollisionVO = members.localRayIntersection(localRay);
            if (pickingCollisionVO)
            {
                pickingCollisionVO.cullFace = CullFace.NONE;
            }

            return pickingCollisionVO;
        },
        dispose() { members.dispose(); },
    };

    return logic;
}

// 注册到统一 logic 分发表
registerLogic('CanvasRenderer', canvasRendererLogic);

// 登记组件类型：让引擎的类型表认识这个**上层包**的类型（feng3d 不硬编码 ui 的类型名）。
// 不做这一步的后果（收尾批任务 1 实测）：`matchType` / `isRenderable` / `isRayCastable`
// 都认不出 'CanvasRenderer'，于是 `Scene.models`、`getComponentsInChildren('Renderable')`、
// `Scene.mouseCheckObjects`、`Raycaster.pick` 全部扫不到 UI 渲染器——UI 渲染不出来、拾取不到。
// `renderable` / `rayCastable` 由 baseTypes（含 Renderable）派生，无需显式写。
// 登记为 UI pass 的组件：主场景渲染列表（ScenePickCache.blenditems / unblenditems）会跳过它，
// 由 UIPass.ts 的 UI Pass 按层级序收集——否则 UI 会被 3D 相机再画一次（像素几何 + 相机投影 = 错）。
// 拾取列表（activeModels）不受影响：UI 仍要能拾取到。
registerComponentType('CanvasRenderer', { baseTypes: ['Renderable'], renderPass: 'ui' });

/**
 * 更新视图中 UI 的鼠标射线（拾取用；迁移前是 `CanvasRenderer.draw(view)` 静态方法）。
 *
 * ## 绘制与布局都不由本函数承担
 *
 * - **绘制**：`CanvasRenderer` 登记为 `renderPass: 'ui'` 之后，UI 由**独立的 UI Pass** 渲染
 *   （见 `UIPass.ts`），不需要任何手动绘制入口；
 * - **布局**：由 UI Pass 的每帧准备（`ViewPassProvider.update`）驱动——本函数不再做布局，
 *   避免两个调用点各自决定"何时布局"。
 *
 * 于是本函数只剩渲染链不负责的一件事：把画布内鼠标位置换算成各 Canvas 的鼠标射线
 * （`Raycaster.pick` 对 UI 的拾取依赖它）。
 *
 * ⚠️ 鼠标位置须显式传入：迁移前读 `view.mousePos`（新架构的 `View` 无该字段，鼠标位置由输入层持有），
 * 不传时保留上一次的鼠标射线（不会把它清成 0）。
 *
 * @param view 视图（`ViewLogic` 由 `logic(view)` 取用）
 * @param mousePos 画布内鼠标位置（可选；传入时更新各 Canvas 的鼠标射线）
 */
export function drawCanvas(view: View, mousePos?: Vector2Like): void
{
    if (!mousePos) return;

    const viewLogic = getLogic(view);

    // 纯数据 Scene 没有 `getComponentsInChildren`（行为在 SceneLogic 上），
    // 树搜索的起点是场景组件的宿主对象
    const sceneEntity = getLogic(viewLogic.scene).entity as Object3D | null;
    if (!sceneEntity) return;

    const canvasList = getLogic(sceneEntity)
        .getComponentsInChildren<Canvas>('Canvas')
        .filter((v) => getLogic(v).isVisibleAndEnabled.value);

    for (let i = 0; i < canvasList.length; i++)
    {
        getLogic(canvasList[i]).calcMouseRay3D(mousePos);
    }
}