import { logic as getLogic, Plane, shortcut, Vector2, Vector3, windowEventProxy } from 'feng3d';
import type { Object3D } from 'feng3d';
import { reactive, UnReadonly } from '@feng3d/reactivity';
import type { SToolModel } from './models/SToolModel';
import { SToolModelLogic } from './models/SToolModel';
import { MRSToolBase, MRSToolBaseLogic } from './MRSToolBase';
import type { MRSToolSelectedItem } from './MRSToolBase';

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

/** SToolLogic 逻辑类：沿单轴拖拽缩放，或拖拽中心方块等比缩放。 */
export class SToolLogic extends MRSToolBaseLogic
{
    #data: STool;

    protected constructor(data: STool)
    {
        // 默认值填充（须在 super 之前完成）
        const writable = data as UnReadonly<STool>;
        if (data.changeXYZ === undefined) writable.changeXYZ = { x: 0, y: 0, z: 0 };

        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: STool): SToolLogic
    {
        return new SToolLogic(data);
    }

    /** 工具模型 Logic（拾取与轴线更新使用） */
    get toolModelLogic(): SToolModelLogic | null
    {
        const component = this.#data.toolModel;

        return component ? getLogic(component) : null;
    }

    override init(entity?: Object3D): void
    {
        super.init(entity);

        // 工具模型：3 个缩放轴 + 中心方块
        this.setToolModel({
            __type__: 'Object3D',
            name: 'Object3DScaleModel',
            components: [{ __type__: 'SToolModel' }],
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

        // 全局矩阵：中心与三轴点坐标
        const cameraObject = this.editorCameraObject;
        const globalMatrix = getLogic(host)?.local2world;
        const cameraSceneTransform = cameraObject ? getLogic(cameraObject)?.local2world : null;
        if (!globalMatrix || !cameraSceneTransform) return;

        const po = globalMatrix.transformPoint3(new Vector3(0, 0, 0));
        const px = globalMatrix.transformPoint3(new Vector3(1, 0, 0));
        const py = globalMatrix.transformPoint3(new Vector3(0, 1, 0));
        const pz = globalMatrix.transformPoint3(new Vector3(0, 0, 1));
        const ox = px.subTo(po);
        const oy = py.subTo(po);
        const oz = pz.subTo(po);
        const cameraDir = cameraSceneTransform.getAxisZ();

        const movePlane3D = new Plane();
        const writable = this.#data as UnReadonly<STool>;
        writable.movePlane3D = movePlane3D;

        // 单轴：过该轴且面向相机的平面；中心方块：按屏幕拖动等比缩放
        if (item === modelLogic.xCube)
        {
            this.selectedItem = item;
            movePlane3D.fromNormalAndPoint(cameraDir.crossTo(ox).crossTo(ox), po);
            writable.changeXYZ = { x: 1, y: 0, z: 0 };
        }
        else if (item === modelLogic.yCube)
        {
            this.selectedItem = item;
            movePlane3D.fromNormalAndPoint(cameraDir.crossTo(oy).crossTo(oy), po);
            writable.changeXYZ = { x: 0, y: 1, z: 0 };
        }
        else if (item === modelLogic.zCube)
        {
            this.selectedItem = item;
            movePlane3D.fromNormalAndPoint(cameraDir.crossTo(oz).crossTo(oz), po);
            writable.changeXYZ = { x: 0, y: 0, z: 1 };
        }
        else if (item === modelLogic.oCube)
        {
            this.selectedItem = item;
            writable.startMousePos = new Vector2(windowEventProxy.clientX, windowEventProxy.clientY);
            writable.changeXYZ = { x: 1, y: 1, z: 1 };
        }
        else
        {
            return;
        }

        writable.startSceneTransform = globalMatrix.clone();
        writable.startPlanePos = this.getLocalMousePlaneCross();
        this.#data.mrsToolTarget?.startScale();

        windowEventProxy.on('mousemove', this.onMouseMove, this);
    }

    private onMouseMove(): void
    {
        const target = this.#data.mrsToolTarget;
        const modelLogic = this.toolModelLogic;
        const selectedItem = this.#data.selectedItem;
        if (!target || !modelLogic || !selectedItem) return;

        const addScale = new Vector3();
        if (selectedItem === modelLogic.oCube)
        {
            // 中心方块：按屏幕对角拖动量等比缩放
            const startMousePos = this.#data.startMousePos;
            if (!startMousePos) return;
            const distance = windowEventProxy.clientX - windowEventProxy.clientY - startMousePos.x + startMousePos.y;
            const height = document.querySelector('canvas')?.clientHeight || window.innerHeight;
            const scale = 1 + (distance * 2) / height;
            addScale.set(scale, scale, scale);
        }
        else
        {
            // 单轴：平面交点相对起点的偏移比例
            const startPlanePos = this.#data.startPlanePos;
            const changeXYZ = this.#data.changeXYZ;
            const crossPos = this.getLocalMousePlaneCross();
            if (!startPlanePos || !changeXYZ || !crossPos) return;

            const offset = crossPos.subTo(startPlanePos);
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

    protected override onMouseUp(): void
    {
        super.onMouseUp();
        windowEventProxy.off('mousemove', this.onMouseMove, this);

        this.#data.mrsToolTarget?.stopScale();

        const modelLogic = this.toolModelLogic;
        if (modelLogic?.xCube) reactive(modelLogic.xCube).scaleValue = 1;
        if (modelLogic?.yCube) reactive(modelLogic.yCube).scaleValue = 1;
        if (modelLogic?.zCube) reactive(modelLogic.zCube).scaleValue = 1;

        const writable = this.#data as UnReadonly<STool>;
        writable.startMousePos = undefined;
        writable.startPlanePos = undefined;
        writable.startSceneTransform = undefined;
    }

    protected override updateToolModel(): void
    {
        // 缩放轴模型不需要逐帧更新（与 MTool / RTool 不同）
    }
}
