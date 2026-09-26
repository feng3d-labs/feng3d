import { logic as getLogic, Plane, shortcut, Vector2, Vector3, windowEventProxy } from 'feng3d';
import type { Object3D } from 'feng3d';
import { reactive, UnReadonly } from '@feng3d/reactivity';
import type { CoordinateRotationAxis, CoordinateRotationFreeAxis, RToolModel } from './models/RToolModel';
import { RToolModelLogic } from './models/RToolModel';
import { MRSToolBase, MRSToolBaseLogic } from './MRSToolBase';
import type { MRSToolSelectedItem } from './MRSToolBase';

/** 度 → 弧度（自由旋转：旧实现把像素差直接当角度用，主仓矩阵用弧度，故按 1px = 1° 换算） */
const PIXEL_TO_RAD = Math.PI / 180;

/**
 * 旋转工具（纯数据接口）。
 *
 * 迁移自旧写法 `@RegisterComponent() class RTool extends MRSToolBase`：
 * 新范式中组件是纯数据接口，行为由 {@link RToolLogic} 提供。
 * 原 class 的私有字段（`startPlanePos` / `stepPlaneCross` / `startMousePos`）改为数据字段。
 */
export interface RTool extends MRSToolBase
{
    /** 组件类型名 */
    readonly __type__: 'RTool';

    /** 工具模型组件（由 Logic 在 init 中创建） */
    readonly toolModel?: RToolModel;

    /** 开始拖拽时的平面交点（世界空间） */
    readonly startPlanePos?: Vector3;

    /** 上一次的平面交点（用于计算增量夹角） */
    readonly stepPlaneCross?: Vector3;

    /** 开始拖拽时的鼠标屏幕坐标 */
    readonly startMousePos?: Vector2;
}

declare module 'feng3d'
{
    interface ComponentMap
    {
        RTool: RTool;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        RTool: RToolLogic;
    }
}

/** RToolLogic 逻辑类：拖拽旋转轴圆周 / 自由旋转轴缩放对象朝向。 */
export class RToolLogic extends MRSToolBaseLogic
{
    #data: RTool;

    /** 上一次写入的相机方向（用于跳过逐帧重复写入） */
    #cameraDir: { x: number, y: number, z: number } | null = null;

    protected constructor(data: RTool)
    {
        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: RTool): RToolLogic
    {
        return new RToolLogic(data);
    }

    /** 工具模型 Logic（拾取与朝向更新使用） */
    get toolModelLogic(): RToolModelLogic | null
    {
        const component = this.#data.toolModel;

        return component ? getLogic(component) : null;
    }

    override init(entity?: Object3D): void
    {
        super.init(entity);

        // 工具模型：3 个旋转圆环 + 相机朝向轴 + 自由旋转轴
        this.setToolModel({
            __type__: 'Object3D',
            name: 'Object3DRotationModel',
            components: [{ __type__: 'RToolModel' }],
        });
    }

    protected override onItemMouseDown(item: MRSToolSelectedItem): void
    {
        if (!shortcut.getState('mouseInView3D')) return;
        if (shortcut.keyState.getKeyState('alt')) return;
        if (!this.editorCamera) return;

        const host = this.host;
        const modelLogic = this.toolModelLogic;
        if (!host || !modelLogic) return;

        super.onItemMouseDown(item);

        // 全局矩阵：位置与三轴方向
        const cameraObject = this.editorCameraObject;
        const globalMatrix = getLogic(host)?.local2world;
        const cameraSceneTransform = cameraObject ? getLogic(cameraObject)?.local2world : null;
        if (!globalMatrix || !cameraSceneTransform) return;

        const pos = globalMatrix.getPosition();
        const xDir = globalMatrix.getAxisX();
        const yDir = globalMatrix.getAxisY();
        const zDir = globalMatrix.getAxisZ();
        const cameraDir = cameraSceneTransform.getAxisZ();

        const movePlane3D = new Plane();
        const writable = this.#data as UnReadonly<RTool>;
        writable.movePlane3D = movePlane3D;

        // 旋转平面：绕某轴旋转时鼠标在该轴的法平面内移动；自由轴/朝向轴用屏幕平面
        if (item === modelLogic.xAxis)
        {
            this.selectedItem = item;
            movePlane3D.fromNormalAndPoint(xDir, pos);
        }
        else if (item === modelLogic.yAxis)
        {
            this.selectedItem = item;
            movePlane3D.fromNormalAndPoint(yDir, pos);
        }
        else if (item === modelLogic.zAxis)
        {
            this.selectedItem = item;
            movePlane3D.fromNormalAndPoint(zDir, pos);
        }
        else if (item === modelLogic.cameraAxis)
        {
            this.selectedItem = item;
            movePlane3D.fromNormalAndPoint(cameraDir, pos);
        }
        else if (item === modelLogic.freeAxis)
        {
            this.selectedItem = item;
            movePlane3D.fromNormalAndPoint(cameraDir, pos);
        }
        else
        {
            return;
        }

        const startPlanePos = this.getMousePlaneCross();
        writable.startPlanePos = startPlanePos;
        writable.stepPlaneCross = startPlanePos ? startPlanePos.clone() : undefined;
        writable.startMousePos = new Vector2(windowEventProxy.clientX, windowEventProxy.clientY);
        writable.startSceneTransform = globalMatrix.clone();
        this.#data.mrsToolTarget?.startRotate();

        windowEventProxy.on('mousemove', this.onMouseMove, this);
    }

    private onMouseMove(): void
    {
        const target = this.#data.mrsToolTarget;
        const modelLogic = this.toolModelLogic;
        const selectedItem = this.#data.selectedItem;
        const movePlane3D = this.#data.movePlane3D;
        const startSceneTransform = this.#data.startSceneTransform;
        if (!target || !modelLogic || !selectedItem || !movePlane3D || !startSceneTransform) return;

        if (selectedItem === modelLogic.freeAxis)
        {
            // 自由旋转：按屏幕拖动量绕相机右轴/上轴旋转
            const startMousePos = this.#data.startMousePos;
            const cameraObject = this.editorCameraObject;
            const cameraSceneTransform = cameraObject ? getLogic(cameraObject)?.local2world : null;
            if (!startMousePos || !cameraSceneTransform) return;

            const offset = new Vector2(windowEventProxy.clientX, windowEventProxy.clientY).subTo(startMousePos);
            target.rotate2(-offset.y * PIXEL_TO_RAD, cameraSceneTransform.getAxisX(), -offset.x * PIXEL_TO_RAD, cameraSceneTransform.getAxisY());
            (this.#data as UnReadonly<RTool>).startMousePos = new Vector2(windowEventProxy.clientX, windowEventProxy.clientY);
            target.startRotate();

            return;
        }

        // 轴向旋转：以轴心为顶点，比较上一次与当前鼠标投影方向的夹角
        const stepPlaneCross = this.#data.stepPlaneCross;
        const planeCross = this.getMousePlaneCross();
        if (!stepPlaneCross || !planeCross) return;

        const origin = startSceneTransform.getPosition();
        const startDir = stepPlaneCross.subTo(origin);
        startDir.normalize();
        const endDir = planeCross.subTo(origin);
        endDir.normalize();

        const cosValue = clamp(startDir.dot(endDir), -1, 1);
        let angle = Math.acos(cosValue);
        const normal = movePlane3D.getNormal();
        // 判断旋转方向（顺时针 / 逆时针）
        const sign = normal.cross(startDir).dot(endDir) > 0 ? 1 : -1;
        angle *= sign;

        target.rotate1(angle, normal);
        (this.#data as UnReadonly<RTool>).stepPlaneCross = planeCross.clone();
        target.startRotate();

        // 绘制扇形区域
        const startPlanePos = this.#data.startPlanePos;
        if (isRotationAxis(selectedItem) && startPlanePos)
        {
            getLogic(selectedItem)?.showSector(startPlanePos, planeCross);
        }
    }

    protected override onMouseUp(): void
    {
        super.onMouseUp();
        windowEventProxy.off('mousemove', this.onMouseMove, this);

        const selectedItem = this.#data.selectedItem;
        if (isRotationAxis(selectedItem)) getLogic(selectedItem)?.hideSector();

        this.#data.mrsToolTarget?.stopRote();

        const writable = this.#data as UnReadonly<RTool>;
        writable.startMousePos = undefined;
        writable.startPlanePos = undefined;
        writable.stepPlaneCross = undefined;
        writable.startSceneTransform = undefined;
    }

    protected override updateToolModel(): void
    {
        if (!this.editorCamera) return;

        const host = this.host;
        const modelLogic = this.toolModelLogic;
        if (!host || !modelLogic) return;

        const cameraObject = this.editorCameraObject;
        const cameraSceneTransform = cameraObject ? getLogic(cameraObject)?.local2world : null;
        const toolWorld2Local = getLogic(host)?.world2local;
        if (!cameraSceneTransform || !toolWorld2Local) return;

        // 背面剔除：三个轴只显示朝向相机的一侧。
        //
        // **只在相机方向变化时写入**：`filterNormal` 变化会触发圆周线段重建（360 段），
        // 每帧写入等同每帧重建 gizmo 几何体——实测把编辑器帧率从 120 拉到 10 并导致主视图黑屏。
        const cameraDir = cameraSceneTransform.getAxisZ().negate();
        if (!isSameDirection(this.#cameraDir, cameraDir))
        {
            this.#cameraDir = { x: cameraDir.x, y: cameraDir.y, z: cameraDir.z };
            for (const axis of [modelLogic.xAxis, modelLogic.yAxis, modelLogic.zAxis])
            {
                if (axis) reactive(axis).filterNormal = cameraDir;
            }
        }

        // 自由轴与相机朝向轴始终朝向摄像机
        const temp = cameraSceneTransform.clone();
        temp.append(toolWorld2Local);
        const rotation = temp.toTRS()[1];
        const freeAxis = modelLogic.freeAxis;
        const cameraAxis = modelLogic.cameraAxis;
        if (freeAxis) writeRotation(freeAxis, rotation);
        if (cameraAxis) writeRotation(cameraAxis, rotation);
    }
}

/** 是否为旋转轴组件（旧实现用 `instanceof CoordinateRotationAxis`） */
function isRotationAxis(item: MRSToolSelectedItem | undefined): item is CoordinateRotationAxis
{
    return !!item && item.__type__ === 'CoordinateRotationAxis';
}

/** 把欧拉角写到组件的宿主对象上（值未变化时跳过写入，避免触发几何体重建） */
function writeRotation(component: CoordinateRotationAxis | CoordinateRotationFreeAxis, rotation: Vector3): void
{
    const object3D = getLogic(component)?.entity as Object3D | undefined;
    if (!object3D) return;

    const current = object3D.rotation;
    if (current
        && Math.abs(current.x - rotation.x) < 1e-5
        && Math.abs(current.y - rotation.y) < 1e-5
        && Math.abs(current.z - rotation.z) < 1e-5)
    {
        return;
    }

    reactive(object3D).rotation = { x: rotation.x, y: rotation.y, z: rotation.z };
}

/** 两个方向是否近似相同（用于跳过未变化的写入） */
function isSameDirection(
    a: { x: number, y: number, z: number } | null,
    b: { x: number, y: number, z: number },
): boolean
{
    return !!a
        && Math.abs(a.x - b.x) < 1e-4
        && Math.abs(a.y - b.y) < 1e-4
        && Math.abs(a.z - b.z) < 1e-4;
}

/** 数值限幅 */
function clamp(value: number, min: number, max: number): number
{
    return Math.max(min, Math.min(max, value));
}
