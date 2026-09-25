import { logic as getLogic, Plane, shortcut, Vector3, windowEventProxy } from 'feng3d';
import type { Object3D } from 'feng3d';
import { reactive, registerLogic, UnReadonly } from '@feng3d/reactivity';
import type { CoordinatePlane, MToolModel } from './models/MToolModel';
import { MToolModelLogic } from './models/MToolModel';
import { MRSToolBase, MRSToolBaseLogic } from './MRSToolBase';
import type { MRSToolSelectedItem } from './MRSToolBase';

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

/** MToolLogic 逻辑类：拖拽坐标轴/平面/中心方块平移选中对象。 */
export class MToolLogic extends MRSToolBaseLogic
{
    #data: MTool;

    protected constructor(data: MTool)
    {
        // 默认值填充（须在 super 之前完成）
        const writable = data as UnReadonly<MTool>;
        if (data.changeXYZ === undefined) writable.changeXYZ = { x: 0, y: 0, z: 0 };

        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: MTool): MToolLogic
    {
        return new MToolLogic(data);
    }

    /** 工具模型 Logic（拾取与平面翻转使用） */
    get toolModelLogic(): MToolModelLogic | null
    {
        const component = this.#data.toolModel;

        return component ? getLogic(component) : null;
    }

    override init(entity?: Object3D): void
    {
        super.init(entity);

        // 工具模型：3 轴 + 3 平面 + 中心方块（旧实现 `new Object3D().addComponent(MToolModel)`）
        this.setToolModel({
            __type__: 'Object3D',
            name: 'Object3DMoveModel',
            components: [{ __type__: 'MToolModel' }],
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

        // gizmo 宿主的世界矩阵，以及中心与 X/Y/Z 轴上点坐标
        const globalMatrix = getLogic(host)?.local2world;
        const cameraSceneTransform = getLogic(this.editorCamera)?.local2world;
        if (!globalMatrix || !cameraSceneTransform) return;

        const po = globalMatrix.transformPoint3(new Vector3(0, 0, 0));
        const px = globalMatrix.transformPoint3(new Vector3(1, 0, 0));
        const py = globalMatrix.transformPoint3(new Vector3(0, 1, 0));
        const pz = globalMatrix.transformPoint3(new Vector3(0, 0, 1));
        const ox = px.subTo(po);
        const oy = py.subTo(po);
        const oz = pz.subTo(po);

        // 摄像机前方方向（相机局部 Z 轴）
        const cameraDir = cameraSceneTransform.getAxisZ();
        const movePlane3D = new Plane();
        const writable = this.#data as UnReadonly<MTool>;
        writable.movePlane3D = movePlane3D;

        // 单轴：过该轴且面向相机的平面；平面：由两个轴确定的平面；中心方块：面向相机的平面
        switch (item)
        {
            case modelLogic.xAxis:
                this.selectedItem = item;
                movePlane3D.fromNormalAndPoint(cameraDir.crossTo(ox).crossTo(ox), po);
                writable.changeXYZ = { x: 1, y: 0, z: 0 };
                break;
            case modelLogic.yAxis:
                this.selectedItem = item;
                movePlane3D.fromNormalAndPoint(cameraDir.crossTo(oy).crossTo(oy), po);
                writable.changeXYZ = { x: 0, y: 1, z: 0 };
                break;
            case modelLogic.zAxis:
                this.selectedItem = item;
                movePlane3D.fromNormalAndPoint(cameraDir.crossTo(oz).crossTo(oz), po);
                writable.changeXYZ = { x: 0, y: 0, z: 1 };
                break;
            case modelLogic.yzPlane:
                this.selectedItem = item;
                movePlane3D.fromPoints(po, py, pz);
                writable.changeXYZ = { x: 0, y: 1, z: 1 };
                break;
            case modelLogic.xzPlane:
                this.selectedItem = item;
                movePlane3D.fromPoints(po, px, pz);
                writable.changeXYZ = { x: 1, y: 0, z: 1 };
                break;
            case modelLogic.xyPlane:
                this.selectedItem = item;
                movePlane3D.fromPoints(po, px, py);
                writable.changeXYZ = { x: 1, y: 1, z: 0 };
                break;
            case modelLogic.oCube:
                this.selectedItem = item;
                movePlane3D.fromNormalAndPoint(cameraDir, po);
                writable.changeXYZ = { x: 1, y: 1, z: 1 };
                break;
            default:
                return;
        }

        writable.startSceneTransform = globalMatrix.clone();
        writable.startPlanePos = toPlain(this.getLocalMousePlaneCross());
        // 工具宿主的本地位置（raw 数据可能缺失，缺失时按原点计）
        const sp = host.position ?? { x: 0, y: 0, z: 0 };
        writable.startPos = { x: sp.x, y: sp.y, z: sp.z };
        this.#data.mrsToolTarget?.startTranslation();

        windowEventProxy.on('mousemove', this.onMouseMove, this);
    }

    private onMouseMove(): void
    {
        const target = this.#data.mrsToolTarget;
        const startPlanePos = this.#data.startPlanePos;
        const startSceneTransform = this.#data.startSceneTransform;
        const changeXYZ = this.#data.changeXYZ;
        if (!target || !startPlanePos || !startSceneTransform || !changeXYZ) return;

        const crossPos = this.getLocalMousePlaneCross();
        if (!crossPos) return;

        // 平面内位移，按受影响的轴筛选
        const addPos = crossPos.subTo(new Vector3(startPlanePos.x, startPlanePos.y, startPlanePos.z));
        addPos.x *= changeXYZ.x;
        addPos.y *= changeXYZ.y;
        addPos.z *= changeXYZ.z;

        // 换算为场景空间位移（旧实现用起点矩阵叠加平移后取位置差）
        const sceneTransform = startSceneTransform.clone();
        sceneTransform.prependTranslation(addPos.x, addPos.y, addPos.z);
        const sceneAddpos = sceneTransform.getPosition().subTo(startSceneTransform.getPosition());
        target.translation(sceneAddpos);
    }

    protected override onMouseUp(): void
    {
        super.onMouseUp();
        windowEventProxy.off('mousemove', this.onMouseMove, this);
        this.#data.mrsToolTarget?.stopTranslation();

        const writable = this.#data as UnReadonly<MTool>;
        writable.startPos = undefined;
        writable.startPlanePos = undefined;
        writable.startSceneTransform = undefined;
    }

    protected override updateToolModel(): void
    {
        // 鼠标按下（拖拽中）时不更新平面朝向
        if (this.#data.ismouseDown) return;
        if (!this.editorCamera) return;

        const host = this.host;
        const modelLogic = this.toolModelLogic;
        if (!host || !modelLogic) return;

        const cameraPos = getLogic(this.editorCamera)?.worldPosition;
        const toolWorld2Local = getLogic(host)?.world2local;
        if (!cameraPos || !toolWorld2Local) return;
        const localCameraPos = toolWorld2Local.transformPoint3(cameraPos);

        // 三个平面翻到相机所在的一侧（旧实现改的是平面宿主对象的位置）
        flipPlane(modelLogic.xyPlane, localCameraPos.x, localCameraPos.y);
        flipPlane(modelLogic.yzPlane, localCameraPos.y, localCameraPos.z);
        flipPlane(modelLogic.xzPlane, localCameraPos.x, localCameraPos.z);
    }
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
    // 经响应式代理整体写入新位置
    const r_object3D = reactive(object3D);
    r_object3D.position = {
        x: outerAxis > 0 ? half : -half,
        y: 0,
        z: innerAxis > 0 ? half : -half,
    };
}

/** 去掉 Vector3 类实例，写回纯数据坐标 */
function toPlain(vector: Vector3 | undefined): { x: number, y: number, z: number } | undefined
{
    return vector ? { x: vector.x, y: vector.y, z: vector.z } : undefined;
}

// 注册到 logic 分发表
registerLogic('MTool', MToolLogic as unknown as new (data: MTool) => MToolLogic);
