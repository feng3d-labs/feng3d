import { planeFromNormalAndPoint, planeGetNormal } from 'feng3d';
import { logic as getLogic, mat4Append, mat4Copy, mat4GetAxisX, mat4GetAxisY, mat4GetAxisZ, mat4GetPosition, mat4GetRotation, Matrix4x4, Plane, shortcut, vec2Sub, vec3Copy, vec3Cross, vec3Dot, vec3Negate, vec3NormalizeThickness, vec3Sub, Vector2, Vector3, Vector3Like, windowEventProxy } from 'feng3d';
import type { Object3D } from 'feng3d';
import { createLogicProto, reactive, UnReadonly } from '@feng3d/reactivity';
import type { CoordinateRotationAxis, CoordinateRotationFreeAxis, RToolModel, RToolModelLogic } from './models/RToolModel';
import { mrsToolBaseLogicProto, setupMRSToolBaseLogicState } from './MRSToolBase';
import type { MRSToolBase, MRSToolBaseLogic, MRSToolBaseLogicState, MRSToolSelectedItem } from './MRSToolBase';

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
    readonly startPlanePos?: Vector3Like;

    /** 上一次的平面交点（用于计算增量夹角） */
    readonly stepPlaneCross?: Vector3Like;

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

/** RToolLogic 逻辑接口：拖拽旋转轴圆周 / 自由旋转轴缩放对象朝向。 */
export interface RToolLogic extends MRSToolBaseLogic
{
    /** 工具模型 Logic（拾取与朝向更新使用） */
    readonly toolModelLogic: RToolModelLogic | null;
}

/** RToolLogic 实例的内部状态（不进公开接口，工厂装配时写入） */
interface RToolLogicState extends MRSToolBaseLogicState
{
    /** 关联的组件数据（raw） */
    _data: RTool;

    /** 上一次写入的相机方向（用于跳过逐帧重复写入） */
    _cameraDir: { x: number, y: number, z: number } | null;

    onMouseMove(): void;
}

/** RToolLogic 的共享原型：继承 MRSToolBase 基类实现，覆写 init / 拖拽回调 */
const rToolLogicProto = createLogicProto<RToolLogic>(mrsToolBaseLogicProto, {
    /** 工具模型 Logic（拾取与朝向更新使用） */
    toolModelLogic: {
        get: function (this: RToolLogic & RToolLogicState): RToolModelLogic | null
        {
            const component = this._data.toolModel;

            return component ? getLogic(component) : null;
        },
    },
    init: {
        value: function (this: RToolLogic & RToolLogicState, entity?: Object3D): void
        {
            mrsToolBaseLogicProto.init.call(this, entity);

            // 工具模型：3 个旋转圆环 + 相机朝向轴 + 自由旋转轴
            this.setToolModel({
                __type__: 'Object3D',
                name: 'Object3DRotationModel',
                components: [{ __type__: 'RToolModel' }],
            });
        },
    },
    onItemMouseDown: {
        value: function (this: RToolLogic & RToolLogicState, item: MRSToolSelectedItem): void
        {
            if (!shortcut.getState('mouseInView3D')) return;
            if (shortcut.keyState.getKeyState('alt')) return;
            if (!this.editorCamera) return;

            const host = this.host;
            const modelLogic = this.toolModelLogic;
            if (!host || !modelLogic) return;

            mrsToolBaseLogicProto.onItemMouseDown.call(this, item);

            // 全局矩阵：位置与三轴方向
            const cameraObject = this.editorCameraObject;
            const globalMatrix = getLogic(host)?.local2world;
            const cameraSceneTransform = cameraObject ? getLogic(cameraObject)?.local2world : null;
            if (!globalMatrix || !cameraSceneTransform) return;

            // 阶段 C-e：`Matrix4x4` 的 class 已删除，getPosition / getAxisX|Y|Z 换成纯函数；
            // 下面要用到 Vector3 的方法（`subTo` / `negate`），所以 out 显式传 Vector3 实例
            const pos = { x: 0, y: 0, z: 0 };
            const xDir = { x: 0, y: 0, z: 0 };
            const yDir = { x: 0, y: 0, z: 0 };
            const zDir = { x: 0, y: 0, z: 0 };
            const cameraDir = { x: 0, y: 0, z: 0 };

            mat4GetPosition(globalMatrix, pos);
            mat4GetAxisX(globalMatrix, xDir);
            mat4GetAxisY(globalMatrix, yDir);
            mat4GetAxisZ(globalMatrix, zDir);
            mat4GetAxisZ(cameraSceneTransform, cameraDir);

            const movePlane3D: Plane = { __type__: 'Plane', a: 0, b: 1, c: 0, d: 0 };
            const writable = this._data as UnReadonly<RTool>;
            writable.movePlane3D = movePlane3D;

            // 旋转平面：绕某轴旋转时鼠标在该轴的法平面内移动；自由轴/朝向轴用屏幕平面
            if (item === modelLogic.xAxis)
            {
                this.selectedItem = item;
                planeFromNormalAndPoint(xDir, pos);
            }
            else if (item === modelLogic.yAxis)
            {
                this.selectedItem = item;
                planeFromNormalAndPoint(yDir, pos);
            }
            else if (item === modelLogic.zAxis)
            {
                this.selectedItem = item;
                planeFromNormalAndPoint(zDir, pos);
            }
            else if (item === modelLogic.cameraAxis)
            {
                this.selectedItem = item;
                planeFromNormalAndPoint(cameraDir, pos);
            }
            else if (item === modelLogic.freeAxis)
            {
                this.selectedItem = item;
                planeFromNormalAndPoint(cameraDir, pos);
            }
            else
            {
                return;
            }

            const startPlanePos = this.getMousePlaneCross();
            writable.startPlanePos = startPlanePos;
            writable.stepPlaneCross = startPlanePos ? vec3Copy(startPlanePos) : undefined;
            writable.startMousePos = { __type__: 'Vector2', x: windowEventProxy.clientX, y: windowEventProxy.clientY };
            writable.startSceneTransform = { __type__: 'Matrix4x4', ...mat4Copy(globalMatrix) };
            this._data.mrsToolTarget?.startRotate();

            windowEventProxy.on('mousemove', this.onMouseMove, this);
        },
    },
    onMouseMove: {
        value: function (this: RToolLogic & RToolLogicState): void
        {
            const target = this._data.mrsToolTarget;
            const modelLogic = this.toolModelLogic;
            const selectedItem = this._data.selectedItem;
            const movePlane3D = this._data.movePlane3D;
            const startSceneTransform = this._data.startSceneTransform;
            if (!target || !modelLogic || !selectedItem || !movePlane3D || !startSceneTransform) return;

            if (selectedItem === modelLogic.freeAxis)
            {
                // 自由旋转：按屏幕拖动量绕相机右轴/上轴旋转
                const startMousePos = this._data.startMousePos;
                const cameraObject = this.editorCameraObject;
                const cameraSceneTransform = cameraObject ? getLogic(cameraObject)?.local2world : null;
                if (!startMousePos || !cameraSceneTransform) return;

                const offset = vec2Sub({ x: windowEventProxy.clientX, y: windowEventProxy.clientY }, startMousePos);
                const cameraAxisX = { x: 0, y: 0, z: 0 };
                const cameraAxisY = { x: 0, y: 0, z: 0 };

                mat4GetAxisX(cameraSceneTransform, cameraAxisX);
                mat4GetAxisY(cameraSceneTransform, cameraAxisY);
                target.rotate2(-offset.y * PIXEL_TO_RAD, cameraAxisX, -offset.x * PIXEL_TO_RAD, cameraAxisY);
                (this._data as UnReadonly<RTool>).startMousePos = { __type__: 'Vector2', x: windowEventProxy.clientX, y: windowEventProxy.clientY };
                target.startRotate();

                return;
            }

            // 轴向旋转：以轴心为顶点，比较上一次与当前鼠标投影方向的夹角
            const stepPlaneCross = this._data.stepPlaneCross;
            const planeCross = this.getMousePlaneCross();
            if (!stepPlaneCross || !planeCross) return;

            const origin = { x: 0, y: 0, z: 0 };

            mat4GetPosition(startSceneTransform, origin);
            const startDir = vec3Sub(stepPlaneCross, origin);
            vec3NormalizeThickness(startDir, 1, startDir);
            const endDir = vec3Sub(planeCross, origin);
            vec3NormalizeThickness(endDir, 1, endDir);

            const cosValue = clamp(vec3Dot(startDir, endDir), -1, 1);
            let angle = Math.acos(cosValue);
            const normal = { x: 0, y: 0, z: 0 };

            planeGetNormal(movePlane3D, normal);
            // 判断旋转方向（顺时针 / 逆时针）
            const sign = vec3Dot(vec3Cross(normal, startDir), endDir) > 0 ? 1 : -1;
            angle *= sign;

            target.rotate1(angle, normal);
            (this._data as UnReadonly<RTool>).stepPlaneCross = vec3Copy(planeCross);
            target.startRotate();

            // 绘制扇形区域
            const startPlanePos = this._data.startPlanePos;
            if (isRotationAxis(selectedItem) && startPlanePos)
            {
                getLogic(selectedItem)?.showSector(startPlanePos, planeCross);
            }
        },
    },
    onMouseUp: {
        value: function (this: RToolLogic & RToolLogicState): void
        {
            mrsToolBaseLogicProto.onMouseUp.call(this);
            windowEventProxy.off('mousemove', this.onMouseMove, this);

            const selectedItem = this._data.selectedItem;
            if (isRotationAxis(selectedItem)) getLogic(selectedItem)?.hideSector();

            this._data.mrsToolTarget?.stopRote();

            const writable = this._data as UnReadonly<RTool>;
            writable.startMousePos = undefined;
            writable.startPlanePos = undefined;
            writable.stepPlaneCross = undefined;
            writable.startSceneTransform = undefined;
        },
    },
    updateToolModel: {
        value: function (this: RToolLogic & RToolLogicState): void
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
            const cameraDir = { x: 0, y: 0, z: 0 };

            mat4GetAxisZ(cameraSceneTransform, cameraDir);
            vec3Negate(cameraDir, cameraDir);
            if (!isSameDirection(this._cameraDir, cameraDir))
            {
                this._cameraDir = { x: cameraDir.x, y: cameraDir.y, z: cameraDir.z };
                for (const axis of [modelLogic.xAxis, modelLogic.yAxis, modelLogic.zAxis])
                {
                    if (axis) reactive(axis).filterNormal = cameraDir;
                }
            }

            // 自由轴与相机朝向轴始终朝向摄像机
            const temp: Matrix4x4 = { __type__: 'Matrix4x4', ...mat4Copy(cameraSceneTransform) };

            mat4Append(temp, toolWorld2Local, temp);
            const rotation = { x: 0, y: 0, z: 0 };

            mat4GetRotation(temp, rotation);
            const freeAxis = modelLogic.freeAxis;
            const cameraAxis = modelLogic.cameraAxis;
            if (freeAxis) writeRotation(freeAxis, rotation);
            if (cameraAxis) writeRotation(cameraAxis, rotation);
        },
    },
});

/**
 * 工厂函数：RToolLogic 的唯一创建入口。
 *
 * @param data 组件数据（raw）
 */
export function rToolLogic(data: RTool): RToolLogic
{
    const logic = setupMRSToolBaseLogicState(Object.create(rToolLogicProto) as RToolLogic & RToolLogicState, data);
    logic._cameraDir = null;

    return logic;
}

/** 是否为旋转轴组件（旧实现用 `instanceof CoordinateRotationAxis`） */
function isRotationAxis(item: MRSToolSelectedItem | undefined): item is CoordinateRotationAxis
{
    return !!item && item.__type__ === 'CoordinateRotationAxis';
}

/** 把欧拉角写到组件的宿主对象上（值未变化时跳过写入，避免触发几何体重建） */
function writeRotation(component: CoordinateRotationAxis | CoordinateRotationFreeAxis, rotation: Vector3Like): void
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
