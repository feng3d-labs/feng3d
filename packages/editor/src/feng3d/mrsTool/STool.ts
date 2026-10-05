import { planeFromNormalAndPoint } from 'feng3d';
import { logic as getLogic, mat4Copy, mat4GetAxisZ, mat4TransformPoint3, Plane, shortcut, vec3Cross, vec3From, vec3Sub, Vector2, Vector3, windowEventProxy } from 'feng3d';
import type { Object3D } from 'feng3d';
import { reactive, UnReadonly } from '@feng3d/reactivity';
import type { SToolModel, SToolModelLogic } from './models/SToolModel';
import { createMRSToolBaseLogicBase } from './MRSToolBase';
import type { MRSToolBase, MRSToolBaseLogic, MRSToolSelectedItem } from './MRSToolBase';

/**
 * 缩放工具（纯数据接口）。
 *
 * 迁移自旧写法 `@RegisterComponent() class STool extends MRSToolBase`：
 * 新范式中组件是纯数据接口，行为由 {@link SToolLogic} 提供。
 * 原 class 的私有字段（`startMousePos` / `changeXYZ` / `startPlanePos`）改为数据字段。
 */
export interface STool extends MRSToolBase
{
    /** 组件类型名 */
    readonly __type__: 'STool';

    /** 工具模型组件（由 Logic 在 init 中创建） */
    readonly toolModel?: SToolModel;

    /** 开始拖拽时的鼠标屏幕坐标 */
    readonly startMousePos?: Vector2;

    /** 用于判断是否改变了 XYZ（默认 { x: 0, y: 0, z: 0 }） */
    readonly changeXYZ?: { readonly x: number, readonly y: number, readonly z: number };

    /** 开始拖拽时的平面交点（模型空间） */
    readonly startPlanePos?: Vector3;
}

declare module 'feng3d'
{
    interface ComponentMap
    {
        STool: STool;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        STool: SToolLogic;
    }
}

/** SToolLogic 逻辑接口：沿单轴拖拽缩放，或拖拽中心方块等比缩放。 */
export interface SToolLogic extends MRSToolBaseLogic
{
    /** 工具模型 Logic（拾取与轴线更新使用） */
    readonly toolModelLogic: SToolModelLogic | null;
}

/**
 * 工厂函数：SToolLogic 的唯一创建入口。
 *
 * @param data 组件数据（raw）
 */
export function sToolLogic(data: STool): SToolLogic
{
    // 默认值填充（须在 super 之前完成）
    const writable = data as UnReadonly<STool>;
    if (data.changeXYZ === undefined) writable.changeXYZ = { x: 0, y: 0, z: 0 };

    const { state, members: baseMembers } = createMRSToolBaseLogicBase(data);

    const logic: SToolLogic = {
        // ---- MRSToolBase 基类成员（显式委托） ----
        /** 关联的组件数据（raw） */
        get component() { return baseMembers.component; },
        /** 所属 Object3D */
        get entity() { return baseMembers.entity; },
        init(entity)
        {
            baseMembers.init(entity);

            // 工具模型：3 个缩放轴 + 中心方块
            baseMembers.setToolModel({
                __type__: 'Object3D',
                name: 'Object3DScaleModel',
                components: [{ __type__: 'SToolModel' }],
            });
        },
        beforeRender(renderObject) { baseMembers.beforeRender(renderObject); },
        get isLoaded() { return baseMembers.isLoaded; },
        dispose() { baseMembers.dispose(); },
        get editorCamera() { return baseMembers.editorCamera; },
        set editorCamera(v) { baseMembers.editorCamera = v; },
        get host() { return baseMembers.host; },
        get editorCameraObject() { return baseMembers.editorCameraObject; },
        get toolModel() { return baseMembers.toolModel; },
        setToolModel(object3D) { baseMembers.setToolModel(object3D); },
        get toolModelEntity() { return baseMembers.toolModelEntity; },
        get selectedItem() { return baseMembers.selectedItem; },
        set selectedItem(v) { baseMembers.selectedItem = v; },
        onAddedToScene() { baseMembers.onAddedToScene(); },
        onRemovedFromScene() { baseMembers.onRemovedFromScene(); },
        onItemMouseDown(item)
        {
            if (!shortcut.getState('mouseInView3D')) return;
            if (shortcut.keyState.getKeyState('alt')) return;
            if (!baseMembers.editorCamera) return;

            const host = baseMembers.host;
            const modelLogic = getToolModelLogic();
            if (!host || !modelLogic) return;

            baseMembers.onItemMouseDown(item);

            // 全局矩阵：中心与三轴点坐标
            const cameraObject = baseMembers.editorCameraObject;
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
            const cameraDir = { x: 0, y: 0, z: 0 };

            mat4GetAxisZ(cameraSceneTransform, cameraDir);

            const movePlane3D: Plane = { __type__: 'Plane', a: 0, b: 1, c: 0, d: 0 };
            const writable = data as UnReadonly<STool>;
            writable.movePlane3D = movePlane3D;

            // 单轴：过该轴且面向相机的平面；中心方块：按屏幕拖动等比缩放
            if (item === modelLogic.xCube)
            {
                baseMembers.selectedItem = item;
                planeFromNormalAndPoint(vec3Cross(vec3Cross(cameraDir, ox), ox), po);
                writable.changeXYZ = { x: 1, y: 0, z: 0 };
            }
            else if (item === modelLogic.yCube)
            {
                baseMembers.selectedItem = item;
                planeFromNormalAndPoint(vec3Cross(vec3Cross(cameraDir, oy), oy), po);
                writable.changeXYZ = { x: 0, y: 1, z: 0 };
            }
            else if (item === modelLogic.zCube)
            {
                baseMembers.selectedItem = item;
                planeFromNormalAndPoint(vec3Cross(vec3Cross(cameraDir, oz), oz), po);
                writable.changeXYZ = { x: 0, y: 0, z: 1 };
            }
            else if (item === modelLogic.oCube)
            {
                baseMembers.selectedItem = item;
                writable.startMousePos = { __type__: 'Vector2', x: windowEventProxy.clientX, y: windowEventProxy.clientY };
                writable.changeXYZ = { x: 1, y: 1, z: 1 };
            }
            else
            {
                return;
            }

            writable.startSceneTransform = { __type__: 'Matrix4x4', ...mat4Copy(globalMatrix) };
            writable.startPlanePos = baseMembers.getLocalMousePlaneCross();
            data.mrsToolTarget?.startScale();

            windowEventProxy.on('mousemove', onMouseMoveHandler, state);
        },
        updateToolModel()
        {
            // 缩放轴模型不需要逐帧更新（与 MTool / RTool 不同）
        },
        pickItem() { return baseMembers.pickItem(); },
        onMouseDown() { baseMembers.onMouseDown(); },
        onMouseUp()
        {
            baseMembers.onMouseUp();
            windowEventProxy.off('mousemove', onMouseMoveHandler, state);

            data.mrsToolTarget?.stopScale();

            const modelLogic = getToolModelLogic();
            if (modelLogic?.xCube) reactive(modelLogic.xCube).scaleValue = 1;
            if (modelLogic?.yCube) reactive(modelLogic.yCube).scaleValue = 1;
            if (modelLogic?.zCube) reactive(modelLogic.zCube).scaleValue = 1;

            const writable = data as UnReadonly<STool>;
            writable.startMousePos = undefined;
            writable.startPlanePos = undefined;
            writable.startSceneTransform = undefined;
        },
        getLocalMousePlaneCross() { return baseMembers.getLocalMousePlaneCross(); },
        getMousePlaneCross() { return baseMembers.getMousePlaneCross(); },
        getMouseRay3D() { return baseMembers.getMouseRay3D(); },

        // ---- STool 自身成员 ----
        /** 工具模型 Logic（拾取与轴线更新使用） */
        get toolModelLogic() { return getToolModelLogic(); },
    };

    /** 工具模型 Logic（拾取与轴线更新使用） */
    function getToolModelLogic(): SToolModelLogic | null
    {
        const component = data.toolModel;

        return component ? getLogic(component) : null;
    }

    function onMouseMove(): void
    {
        const target = data.mrsToolTarget;
        const modelLogic = getToolModelLogic();
        const selectedItem = data.selectedItem;
        if (!target || !modelLogic || !selectedItem) return;

        const addScale = { x: 0, y: 0, z: 0 };
        if (selectedItem === modelLogic.oCube)
        {
            // 中心方块：按屏幕对角拖动量等比缩放
            const startMousePos = data.startMousePos;
            if (!startMousePos) return;
            const distance = windowEventProxy.clientX - windowEventProxy.clientY - startMousePos.x + startMousePos.y;
            const height = document.querySelector('canvas')?.clientHeight || window.innerHeight;
            const scale = 1 + (distance * 2) / height;
            vec3From(scale, scale, scale, addScale);
        }
        else
        {
            // 单轴：平面交点相对起点的偏移比例
            const startPlanePos = data.startPlanePos;
            const changeXYZ = data.changeXYZ;
            const crossPos = baseMembers.getLocalMousePlaneCross();
            if (!startPlanePos || !changeXYZ || !crossPos) return;

            const offset = vec3Sub(crossPos, startPlanePos);
            if (changeXYZ.x && startPlanePos.x && offset.x !== 0) addScale.x = offset.x / startPlanePos.x;
            if (changeXYZ.y && startPlanePos.y && offset.y !== 0) addScale.y = offset.y / startPlanePos.y;
            if (changeXYZ.z && startPlanePos.z && offset.z !== 0) addScale.z = offset.z / startPlanePos.z;
            addScale.x += 1;
            addScale.y += 1;
            addScale.z += 1;
        }

        target.doScale(addScale);

        // 缩放轴手柄沿轴移动到当前缩放长度处
        if (modelLogic.xCube) reactive(modelLogic.xCube).scaleValue = addScale.x;
        if (modelLogic.yCube) reactive(modelLogic.yCube).scaleValue = addScale.y;
        if (modelLogic.zCube) reactive(modelLogic.zCube).scaleValue = addScale.z;
    }

    function onMouseMoveHandler(): void
    {
        onMouseMove();
    }

    // 基座内部按子类覆写分派（闭包形态下没有原型链）
    state.self = logic;

    return logic;
}
