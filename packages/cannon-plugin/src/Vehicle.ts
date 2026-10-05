import { Component3D, Component3DLogic, ComponentLogicState, createComponentLogicBase, Object3D, registerComponentType } from 'feng3d';
import { registerLogic, UnReadonly } from '@feng3d/reactivity';
import type { Vector3Like } from '@feng3d/math';
// 别名导入：cannon-es 的 RaycastVehicle 与本组件不同名，但 Vehicle 这个名字太泛，统一加 Cannon 前缀。
import { RaycastVehicle as CannonRaycastVehicle, Vec3, type Body, type WheelInfoOptions } from 'cannon-es';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        Vehicle: Vehicle;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Vehicle: VehicleLogic;
    }
}

/**
 * 一个车轮的配置（纯数据）。
 */
export interface VehicleWheel
{
    /** 车轮与底盘的连接点（底盘局部坐标） */
    readonly position: Vector3Like;

    /** 车轮半径（缺失时 0.4） */
    readonly radius?: number;

    /** 悬挂方向（局部坐标，缺失时 (0,-1,0)，即朝下） */
    readonly direction?: Vector3Like;

    /** 轮轴方向（局部坐标，缺失时 (-1,0,0)） */
    readonly axle?: Vector3Like;

    /** 是否是转向轮（受 steering 控制） */
    readonly steering?: boolean;

    /** 是否是驱动轮（受 engineForce 驱动） */
    readonly driving?: boolean;

    /** 悬挂硬度（缺失时用 cannon-es 默认） */
    readonly suspensionStiffness?: number;

    /** 抓地力上限（缺失时用 cannon-es 默认） */
    readonly frictionSlip?: number;

    /** 悬挂静止长度（缺失时用 cannon-es 默认） */
    readonly suspensionRestLength?: number;
}

/**
 * 射线车辆（纯数据接口）：给一个刚体装上带悬挂的车轮。
 *
 * cannon-es 的 `RaycastVehicle` 用**射线**去探地面，而不是真的做车轮碰撞——
 * 所以它只需要一个底盘刚体 + 若干车轮配置，跑起来比一堆铰链组成的车稳定得多。
 *
 * 组件挂在**底盘**所在的 Object3D 上（那个对象要已有 Rigidbody）。
 * `engineForce` / `steering` / `brake` 是运行时控制量：改它们（经 reactive）即可驾驶。
 */
export interface Vehicle extends Component3D
{
    readonly __type__: 'Vehicle';

    /** 车轮配置 */
    readonly wheels: readonly VehicleWheel[];

    /** 引擎力（施加给驱动轮；正值前进，缺失时 0） */
    readonly engineForce?: number;

    /** 转向角（弧度，施加给转向轮；缺失时 0） */
    readonly steering?: number;

    /** 刹车力（缺失时 0） */
    readonly brake?: number;
}

/**
 * 射线车辆 logic 接口。
 */
export interface VehicleLogic extends Component3DLogic
{
    /** 车轮配置（缺省字段已补全） */
    readonly wheels: readonly VehicleWheel[];

    /** 引擎力（缺失时 0） */
    readonly engineForce: number;

    /** 转向角（缺失时 0） */
    readonly steering: number;

    /** 刹车力（缺失时 0） */
    readonly brake: number;

    /** 用底盘刚体创建 cannon-es 车辆（由 PhysicsWorld 调用；基座为 null，工厂装配） */
    readonly createVehicle: ((body: Body) => CannonRaycastVehicle) | null;
}

/**
 * 射线车辆 logic 的内部状态。
 */
export interface VehicleLogicState extends ComponentLogicState
{
    /** 车辆工厂（工厂装配） */
    createVehicle: ((body: Body) => CannonRaycastVehicle) | null;
}

/**
 * 把可选的三维字面量转成 Vec3。
 *
 * @param v 三维字面量
 * @param fallback 缺失时的默认值
 * @returns Vec3
 */
function toVec3(v: Vector3Like | undefined, fallback: Vector3Like): Vec3
{
    const source = v ?? fallback;

    return new Vec3(source.x, source.y, source.z);
}

/**
 * 工厂函数：VehicleLogic 的唯一创建入口。
 *
 * @param data 车辆数据（raw）
 */
export function vehicleLogic(data: Vehicle): VehicleLogic
{
    // 构造参数字段可选，默认值由工厂补（写在 raw 数据上）
    const writable = data as UnReadonly<Vehicle>;
    if (writable.engineForce === undefined) writable.engineForce = 0;
    if (writable.steering === undefined) writable.steering = 0;
    if (writable.brake === undefined) writable.brake = 0;

    const { state: componentState, members: componentMembers } = createComponentLogicBase(data);
    const state = componentState as VehicleLogicState;

    state.createVehicle = (body) =>
    {
        const vehicle = new CannonRaycastVehicle({
            chassisBody: body,
            // 这些轴索引描述"底盘局部哪个轴是右 / 上 / 前"，默认值即标准的 Y-up 右手系
            indexRightAxis: 0,
            indexUpAxis: 1,
            indexForwardAxis: 2,
        });

        for (const wheel of data.wheels)
        {
            const options: WheelInfoOptions = {
                radius: wheel.radius ?? 0.4,
                directionLocal: toVec3(wheel.direction, { x: 0, y: -1, z: 0 }),
                axleLocal: toVec3(wheel.axle, { x: -1, y: 0, z: 0 }),
                chassisConnectionPointLocal: toVec3(wheel.position, { x: 0, y: 0, z: 0 }),
            };
            if (wheel.suspensionStiffness !== undefined) options.suspensionStiffness = wheel.suspensionStiffness;
            if (wheel.frictionSlip !== undefined) options.frictionSlip = wheel.frictionSlip;
            if (wheel.suspensionRestLength !== undefined) options.suspensionRestLength = wheel.suspensionRestLength;

            vehicle.addWheel(options);
        }

        return vehicle;
    };

    const logic: VehicleLogic = {
        get component() { return componentMembers.component; },
        get entity() { return state.entity as Object3D | null; },
        get wheels() { return data.wheels; },
        get engineForce() { return data.engineForce ?? 0; },
        get steering() { return data.steering ?? 0; },
        get brake() { return data.brake ?? 0; },
        get createVehicle() { return state.createVehicle; },
        init(object3D) { componentMembers.init(object3D); },
        beforeRender(renderObject) { componentMembers.beforeRender(renderObject); },
        get isLoaded() { return componentMembers.isLoaded; },
        dispose() { componentMembers.dispose(); },
    };

    return logic;
}

registerLogic('Vehicle', vehicleLogic);
registerComponentType('Vehicle', { baseTypes: ['Component3D'] });
