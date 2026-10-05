import { planeFromNormalAndPoint, planeFromPoints } from 'feng3d';
import { logic as getLogic, mat4Copy, mat4GetAxisZ, mat4GetPosition, mat4PrependTranslation, mat4TransformPoint3, Matrix4x4, Plane, shortcut, vec3Cross, vec3Sub, Vector3, windowEventProxy } from 'feng3d';
import type { Object3D } from 'feng3d';
import { createLogicProto, reactive, UnReadonly } from '@feng3d/reactivity';
import type { CoordinatePlane, MToolModel, MToolModelLogic } from './models/MToolModel';
import { mrsToolBaseLogicProto, setupMRSToolBaseLogicState } from './MRSToolBase';
import type { MRSToolBase, MRSToolBaseLogic, MRSToolBaseLogicState, MRSToolSelectedItem } from './MRSToolBase';

/**
 * 位移工具（纯数据接口）。
 *
 * 迁移自旧写法 `@RegisterComponent() class MTool extends MRSToolBase`：
 * 新范式中组件是纯数据接口，行为由 {@link MToolLogic} 提供。
 * 原 class 的私有字段（`changeXYZ` / `startPlanePos` / `startPos`）改为数据字段。
 */
export interface MTool extends MRSToolBase
{
    /** 组件类型名 */
    readonly __type__: 'MTool';

    /** 工具模型组件（由 Logic 在 init 中创建） */
    readonly toolModel?: MToolModel;

    /** 用于判断是否改变了 XYZ（默认 { x: 0, y: 0, z: 0 }） */
    readonly changeXYZ?: { readonly x: number, readonly y: number, readonly z: number };

    /** 开始拖拽时的平面交点 */
    readonly startPlanePos?: { readonly x: number, readonly y: number, readonly z: number };

    /** 开始拖拽时的位置 */
    readonly startPos?: { readonly x: number, readonly y: number, readonly z: number };
}

declare module 'feng3d'
{
    interface ComponentMap
    {
        MTool: MTool;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        MTool: MToolLogic;
    }
}

/** MToolLogic 逻辑接口：拖拽坐标轴/平面/中心方块平移选中对象。 */
export interface MToolLogic extends MRSToolBaseLogic
{
    /** 工具模型 Logic（拾取与平面翻转使用） */
    readonly toolModelLogic: MToolModelLogic | null;
}

/** MToolLogic 实例的内部状态（不进公开接口，工厂装配时写入） */
interface MToolLogicState extends MRSToolBaseLogicState
{
    /** 关联的组件数据（raw） */
    _data: MTool;

    onMouseMove(): void;
}

/** MToolLogic 的共享原型：继承 MRSToolBase 基类实现，覆写 init / 拖拽回调 */
const mToolLogicProto = createLogicProto<MToolLogic>(mrsToolBaseLogicProto, {
    /** 工具模型 Logic（拾取与平面翻转使用） */
    toolModelLogic: {
        get: function (this: MToolLogic & MToolLogicState): MToolModelLogic | null
        {
            const component = this._data.toolModel;

            return component ? getLogic(component) : null;
        },
    },
    init: {
        value: function (this: MToolLogic & MToolLogicState, entity?: Object3D): void
        {
            mrsToolBaseLogicProto.init.call(this, entity);

            // 工具模型：3 轴 + 3 平面 + 中心方块（旧实现 `new Object3D().addComponent(MToolModel)`）
            this.setToolModel({
                __type__: 'Object3D',
                name: 'Object3DMoveModel',
                components: [{ __type__: 'MToolModel' }],
            });
        },
    },
    onItemMouseDown: {
        value: function (this: MToolLogic & MToolLogicState, item: MRSToolSelectedItem): void
        {
            if (!shortcut.getState('mouseInView3D')) return;
            if (shortcut.keyState.getKeyState('alt')) return;
            if (!this.editorCamera) return;

            const host = this.host;
            const modelLogic = this.toolModelLogic;
            if (!host || !modelLogic) return;

            mrsToolBaseLogicProto.onItemMouseDown.call(this, item);

            // gizmo 宿主的世界矩阵，以及中心与 X/Y/Z 轴上点坐标
            const cameraObject = this.editorCameraObject;
            const globalMatrix = getLogic(host)?.local2world;
            const cameraSceneTransform = cameraObject ? getLogic(cameraObject)?.local2world : null;
            if (!globalMatrix || !cameraSceneTransform) return;

            // 阶段 C-e：`Matrix4x4` 的 class 已删除，实例方法换成等价纯函数；
            // 下面要对结果用 `subTo`，所以 out 一律传真正的 Vector3 实例
            const po = { x: 0, y: 0, z: 0 };
            const px = { x: 0, y: 0, z: 0 };
            const py = { x: 0, y: 0, z: 0 };
            const pz = { x: 0, y: 0, z: 0 };

            mat4TransformPoint3(globalMatrix, { x: 0, y: 0, z: 0 }, po);
            mat4TransformPoint3(globalMatrix, { x: 1, y: 0, z: 0 }, px);
            mat4TransformPoint3(globalMatrix, { x: 0, y: 1, z: 0 }, py);
            mat4TransformPoint3(globalMatrix, { x: 0, y: 0, z: 1 }, pz);
            const ox = vec3Sub(px, po);
            const oy = vec3Sub(py, po);
            const oz = vec3Sub(pz, po);

            // 摄像机前方方向（相机局部 Z 轴）
            const cameraDir = { x: 0, y: 0, z: 0 };

            mat4GetAxisZ(cameraSceneTransform, cameraDir);
            const movePlane3D: Plane = { __type__: 'Plane', a: 0, b: 1, c: 0, d: 0 };
            const writable = this._data as UnReadonly<MTool>;
            writable.movePlane3D = movePlane3D;

            // 单轴：过该轴且面向相机的平面；平面：由两个轴确定的平面；中心方块：面向相机的平面
            switch (item)
            {
                case modelLogic.xAxis:
                    this.selectedItem = item;
                    planeFromNormalAndPoint(vec3Cross(vec3Cross(cameraDir, ox), ox), po);
                    writable.changeXYZ = { x: 1, y: 0, z: 0 };
                    break;
                case modelLogic.yAxis:
                    this.selectedItem = item;
                    planeFromNormalAndPoint(vec3Cross(vec3Cross(cameraDir, oy), oy), po);
                    writable.changeXYZ = { x: 0, y: 1, z: 0 };
                    break;
                case modelLogic.zAxis:
                    this.selectedItem = item;
                    planeFromNormalAndPoint(vec3Cross(vec3Cross(cameraDir, oz), oz), po);
                    writable.changeXYZ = { x: 0, y: 0, z: 1 };
                    break;
                case modelLogic.yzPlane:
                    this.selectedItem = item;
                    planeFromPoints(po, py, pz, movePlane3D);
                    writable.changeXYZ = { x: 0, y: 1, z: 1 };
                    break;
                case modelLogic.xzPlane:
                    this.selectedItem = item;
                    planeFromPoints(po, px, pz, movePlane3D);
                    writable.changeXYZ = { x: 1, y: 0, z: 1 };
                    break;
                case modelLogic.xyPlane:
                    this.selectedItem = item;
                    planeFromPoints(po, px, py, movePlane3D);
                    writable.changeXYZ = { x: 1, y: 1, z: 0 };
                    break;
                case modelLogic.oCube:
                    this.selectedItem = item;
                    planeFromNormalAndPoint(cameraDir, po);
                    writable.changeXYZ = { x: 1, y: 1, z: 1 };
                    break;
                default:
                    return;
            }

            writable.startSceneTransform = { __type__: 'Matrix4x4', ...mat4Copy(globalMatrix) };
            writable.startPlanePos = toPlain(this.getLocalMousePlaneCross());
            // 工具宿主的本地位置（raw 数据可能缺失，缺失时按原点计）
            const sp = host.position ?? { x: 0, y: 0, z: 0 };
            writable.startPos = { x: sp.x, y: sp.y, z: sp.z };
            this._data.mrsToolTarget?.startTranslation();

            windowEventProxy.on('mousemove', this.onMouseMove, this);
        },
    },
    onMouseMove: {
        value: function (this: MToolLogic & MToolLogicState): void
        {
            const target = this._data.mrsToolTarget;
            const startPlanePos = this._data.startPlanePos;
            const startSceneTransform = this._data.startSceneTransform;
            const changeXYZ = this._data.changeXYZ;
            if (!target || !startPlanePos || !startSceneTransform || !changeXYZ) return;

            const crossPos = this.getLocalMousePlaneCross();
            if (!crossPos) return;

            // 平面内位移，按受影响的轴筛选
            const addPos = vec3Sub(crossPos, { x: startPlanePos.x, y: startPlanePos.y, z: startPlanePos.z });
            addPos.x *= changeXYZ.x;
            addPos.y *= changeXYZ.y;
            addPos.z *= changeXYZ.z;

            // 换算为场景空间位移（旧实现用起点矩阵叠加平移后取位置差）
            const sceneTransform: Matrix4x4 = { __type__: 'Matrix4x4', ...mat4Copy(startSceneTransform) };

            mat4PrependTranslation(sceneTransform, addPos.x, addPos.y, addPos.z, sceneTransform);
            const scenePos = { x: 0, y: 0, z: 0 };
            const startPos3 = { x: 0, y: 0, z: 0 };

            mat4GetPosition(sceneTransform, scenePos);
            mat4GetPosition(startSceneTransform, startPos3);
            const sceneAddpos = vec3Sub(scenePos, startPos3);

            target.translation(sceneAddpos);
        },
    },
    onMouseUp: {
        value: function (this: MToolLogic & MToolLogicState): void
        {
            mrsToolBaseLogicProto.onMouseUp.call(this);
            windowEventProxy.off('mousemove', this.onMouseMove, this);
            this._data.mrsToolTarget?.stopTranslation();

            const writable = this._data as UnReadonly<MTool>;
            writable.startPos = undefined;
            writable.startPlanePos = undefined;
            writable.startSceneTransform = undefined;
        },
    },
    updateToolModel: {
        value: function (this: MToolLogic & MToolLogicState): void
        {
            // 鼠标按下（拖拽中）时不更新平面朝向
            if (this._data.ismouseDown) return;
            if (!this.editorCamera) return;

            const host = this.host;
            const modelLogic = this.toolModelLogic;
            if (!host || !modelLogic) return;

            const cameraObject = this.editorCameraObject;
            const cameraPos = cameraObject ? getLogic(cameraObject)?.worldPosition : null;
            const toolWorld2Local = getLogic(host)?.world2local;
            if (!cameraPos || !toolWorld2Local) return;
            const localCameraPos = mat4TransformPoint3(toolWorld2Local, cameraPos);

            // 三个平面翻到相机所在的一侧（旧实现改的是平面宿主对象的位置）
            flipPlane(modelLogic.xyPlane, localCameraPos.x, localCameraPos.y);
            flipPlane(modelLogic.yzPlane, localCameraPos.y, localCameraPos.z);
            flipPlane(modelLogic.xzPlane, localCameraPos.x, localCameraPos.z);
        },
    },
});

/**
 * 工厂函数：MToolLogic 的唯一创建入口。
 *
 * @param data 组件数据（raw）
 */
export function mToolLogic(data: MTool): MToolLogic
{
    // 默认值填充（须在 super 之前完成）
    const writable = data as UnReadonly<MTool>;
    if (data.changeXYZ === undefined) writable.changeXYZ = { x: 0, y: 0, z: 0 };

    return setupMRSToolBaseLogicState(Object.create(mToolLogicProto) as MToolLogic & MToolLogicState, data);
}

/**
 * 把坐标平面翻到相机所在的一侧。
 *
 * 平面四边形在自身局部空间从原点向 +X/+Z 铺开（边长 `width`），因此相机在负方向时
 * 把中心移到 -width/2 处即可翻面（等价旧实现改宿主对象位置为 0 / -width）。
 *
 * @param plane 平面组件
 * @param outerAxis 第一个局部轴方向上相机的位置分量
 * @param innerAxis 第二个局部轴方向上相机的位置分量
 */
function flipPlane(plane: CoordinatePlane | null, outerAxis: number, innerAxis: number): void
{
    if (!plane) return;
    const object3D = getLogic(plane)?.entity as Object3D | undefined;
    if (!object3D) return;

    const width = plane.width ?? 20;
    const half = width / 2;
    const target = {
        x: outerAxis > 0 ? half : -half,
        y: 0,
        z: innerAxis > 0 ? half : -half,
    };
    // 值未变化时跳过写入（逐帧写入会让渲染树每帧重算）
    const current = object3D.position;
    if (current && current.x === target.x && current.y === target.y && current.z === target.z) return;

    // 经响应式代理整体写入新位置
    reactive(object3D).position = target;
}

/** 去掉 Vector3 类实例，写回纯数据坐标 */
function toPlain(vector: Vector3 | undefined): { x: number, y: number, z: number } | undefined
{
    return vector ? { x: vector.x, y: vector.y, z: vector.z } : undefined;
}
