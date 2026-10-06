import { Behaviour, BehaviourLogic, Components, createBehaviourLogicBase, matchType, Object3D, registerComponentType } from 'feng3d';
import { logic as getLogic, registerLogic, UnReadonly } from '@feng3d/reactivity';
import { quatFromEuler, type Vector3Like } from '@feng3d/math';
import { Body, Vec3 } from 'cannon-es';
import type { ColliderLogic } from './Collider';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        Rigidbody: Rigidbody;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Rigidbody: RigidbodyLogic;
    }
}

/**
 * 刚体类型（对应 cannon-es 的 Body.DYNAMIC / STATIC / KINEMATIC）。
 *
 * - `dynamic`：受重力与碰撞影响（质量大于 0 时的默认值）
 * - `static`：永不动，但仍参与碰撞（质量等于 0 时的默认值）
 * - `kinematic`：不受力，但按 velocity 匀速移动、并把碰撞推给别的物体
 */
export type RigidbodyType = 'dynamic' | 'static' | 'kinematic';

/** 类型名 → cannon-es 的 Body 类型常量（`as const` 保住字面量类型，与 Body 构造选项的 BodyType 对齐） */
const TYPE_MAP = {
    dynamic: Body.DYNAMIC,
    static: Body.STATIC,
    kinematic: Body.KINEMATIC,
} as const;

/**
 * 刚体（纯数据接口）。
 *
 * 与 Collider 挂在同一个 Object3D 上：初始化时收集同一对象上所有碰撞体的物理形状，
 * 组装成一个 cannon-es 的 Body；位置由祖先 PhysicsWorld 每帧步进后写回 Object3D。
 *
 * 质量缺失时按 0 处理（与 cannon.js/cannon-es 的 Body 默认一致，即静态物体）；
 * 要参与动力学请在字面量里显式声明 mass。
 */
export interface Rigidbody extends Behaviour
{
    readonly __type__: 'Rigidbody';

    /** 质量（缺失时默认 0，即静态刚体） */
    readonly mass?: number;

    /** 刚体类型（缺失时由 cannon-es 按 mass 推断：>0 动态、=0 静态） */
    readonly type?: RigidbodyType;

    /** 初始线速度（缺失时为 0；kinematic 刚体靠它匀速移动） */
    readonly velocity?: Vector3Like;

    /** 初始角速度（缺失时为 0） */
    readonly angularVelocity?: Vector3Like;

    /** 是否允许休眠（缺失时用 cannon-es 默认 true）；静止久了会自动睡去以省算力 */
    readonly allowSleep?: boolean;

    /** 碰撞过滤分组（位掩码，缺失时用 cannon-es 默认 1） */
    readonly collisionFilterGroup?: number;

    /** 碰撞过滤掩码（只与这些分组的物体碰撞，缺失时用默认 -1 即全部） */
    readonly collisionFilterMask?: number;

    /** 是否固定旋转（只平动、不转动） */
    readonly fixedRotation?: boolean;

    /**
     * 该刚体的**材质名**（对应原版 `new CANNON.Material('slippery')`）。
     *
     * 与 {@link Rigidbody.friction} 的区别：那个是"按摩擦值自动建材质"，适合单个物体的粗略对比；
     * 材质名是**成对**描述接触的（原版 `friction.html` 就是给地面与箱子各起名，
     * 再用 {@link PhysicsWorld.contactMaterials} 声明"这两者相遇时摩擦是多少"）。
     */
    readonly materialName?: string;

    /** 是否触发器（照常报告接触，但不产生碰撞响应——用于"穿过并触发"） */
    readonly isTrigger?: boolean;

    /**
     * 是否参与碰撞**响应**（缺失时 true）。
     *
     * 置 false 时刚体照常参与检测（能收到 collide 事件），但不会被推开——
     * 原版 `trimesh.html` 的 "Raycasting" 幕用一批这种"标记点"来显示射线命中的位置。
     */
    readonly collisionResponse?: boolean;

    /** 线性阻尼（缺失时用 cannon-es 默认 0.01） */
    readonly linearDamping?: number;

    /** 角阻尼（缺失时用 cannon-es 默认 0.01） */
    readonly angularDamping?: number;

    /**
     * 该刚体的摩擦系数（缺失时沿用 PhysicsWorld 的世界默认）。
     *
     * 注意：cannon-es 的摩擦/弹性是**接触对**属性——只给 body 设 Material、
     * 没有对应 ContactMaterial 时 World 会退回世界默认，等于没写。
     * 所以声明本字段会让该刚体拿到独立材质，并由 PhysicsWorld 自动注册接触材质（见那边注释）。
     */
    readonly friction?: number;

    /** 该刚体的弹性系数（0 = 完全不弹，1 = 完全弹回）。语义同 friction。 */
    readonly restitution?: number;
}

/**
 * 刚体 logic 接口。
 */
export interface RigidbodyLogic extends BehaviourLogic
{
    /** 物理刚体（cannon-es） */
    readonly body: Body;

    /** 该刚体声明的摩擦系数（未声明时 undefined，由 PhysicsWorld 用世界默认） */
    readonly friction: number | undefined;

    /** 该刚体声明的弹性系数（未声明时 undefined） */
    readonly restitution: number | undefined;

    /** 该刚体声明的材质名（未声明时 undefined） */
    readonly materialName: string | undefined;

    /** 该刚体声明的"是否参与碰撞响应"（未声明时 undefined = 按 cannon-es 默认） */
    readonly collisionResponse: boolean | undefined;

    /**
     * 施加**持续的力**（cannon-es 每次 step 后会把力清零，所以要持续就得每帧调用）。
     *
     * @param force 世界坐标下的力
     * @param relativePoint 相对刚体质心的施力点（缺失时按质心处理 = 只平动）；给偏移会产生力矩
     */
    applyForce(force: Vector3Like, relativePoint?: Vector3Like): void;

    /**
     * 施加**局部坐标系下的力**（对应 cannon-es 的 applyLocalForce）。
     *
     * 与原版 `impulses.html` 的 "Local force" 幕对应：那里把球绕 Z 转了 180°，
     * 于是"局部球顶"在世界上是底部——同一个局部力方向也就反了过来。
     *
     * @param localForce 刚体局部坐标下的力
     * @param localPoint 刚体局部坐标下的施力点（缺失时按质心处理）
     */
    applyLocalForce(localForce: Vector3Like, localPoint?: Vector3Like): void;

    /**
     * 施加力矩。
     *
     * @param torque 世界坐标下的力矩
     */
    applyTorque(torque: Vector3Like): void;

    /**
     * 施加**瞬时冲量**（一次调用即改变动量，不需要每帧调用）。
     *
     * @param impulse 世界坐标下的冲量
     * @param relativePoint 相对刚体质心的施力点（缺失时按质心处理 = 只平动）；
     *   给一个偏移就会产生**角动量**（原版 `trigger.html` 就靠它让球一边前进一边转）
     */
    applyImpulse(impulse: Vector3Like, relativePoint?: Vector3Like): void;
}

/**
 * 工厂函数：RigidbodyLogic 的唯一创建入口。
 *
 * @param data 刚体数据（raw）
 */
export function rigidbodyLogic(data: Rigidbody): RigidbodyLogic
{
    const writable = data as UnReadonly<Rigidbody>;
    if (writable.mass === undefined) writable.mass = 0;

    const { state, members } = createBehaviourLogicBase(data);
    // 把声明过的字段透传给 cannon-es 的 Body（未声明的一律传 undefined，交给它用默认值推断）
    const toVec3 = (v: Vector3Like | undefined) => (v === undefined ? undefined : new Vec3(v.x, v.y, v.z));
    const body = new Body({
        mass: data.mass ?? 0,
        type: data.type === undefined ? undefined : TYPE_MAP[data.type],
        velocity: toVec3(data.velocity),
        angularVelocity: toVec3(data.angularVelocity),
        allowSleep: data.allowSleep,
        collisionFilterGroup: data.collisionFilterGroup,
        collisionFilterMask: data.collisionFilterMask,
        fixedRotation: data.fixedRotation,
        isTrigger: data.isTrigger,
        linearDamping: data.linearDamping,
        angularDamping: data.angularDamping,
    });

    const logic: RigidbodyLogic = {
        get component() { return members.component; },
        get entity() { return state.entity as Object3D | null; },
        get isVisibleAndEnabled() { return members.isVisibleAndEnabled; },
        get body() { return body; },
        get friction() { return data.friction; },
        get restitution() { return data.restitution; },
        get materialName() { return data.materialName; },
        get collisionResponse() { return data.collisionResponse; },
        applyForce(force, relativePoint)
        {
            body.applyForce(
                new Vec3(force.x, force.y, force.z),
                relativePoint === undefined ? undefined : new Vec3(relativePoint.x, relativePoint.y, relativePoint.z));
        },
        applyLocalForce(localForce, localPoint)
        {
            body.applyLocalForce(
                new Vec3(localForce.x, localForce.y, localForce.z),
                localPoint === undefined ? undefined : new Vec3(localPoint.x, localPoint.y, localPoint.z));
        },
        applyTorque(torque) { body.applyTorque(new Vec3(torque.x, torque.y, torque.z)); },
        applyImpulse(impulse, relativePoint)
        {
            body.applyImpulse(
                new Vec3(impulse.x, impulse.y, impulse.z),
                relativePoint === undefined ? undefined : new Vec3(relativePoint.x, relativePoint.y, relativePoint.z));
        },
        init(object3D)
        {
            members.init(object3D);

            const o3d = state.entity as Object3D | null;
            if (o3d === null) return;

            // 注意：组件 init 发生在 owner 的 logic **构造期间**，此时 logic 注册表里是占位对象，
            // 读 owner 的 logic 成员会得到 undefined（Object3D.ts 的 getParentLogic 有同样说明）。
            // 因此这里一律读 raw 数据，而不是 getLogic(o3d) 的成员。
            const position = o3d.position ?? { x: 0, y: 0, z: 0 };
            body.position.set(position.x, position.y, position.z);

            // 初始旋转：Object3D.rotation 是欧拉角（弧度），cannon-es 用四元数，这里转一次。
            // 旋转顺序用 @feng3d/math 的默认序，与写回时 mat4GetRotation 的默认序一致。
            const rotation = o3d.rotation ?? { x: 0, y: 0, z: 0 };
            const quaternion = quatFromEuler(rotation.x, rotation.y, rotation.z);
            body.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);

            // 收集同一 Object3D 上所有碰撞体的形状（带各自的 offset，拼成复合刚体）
            for (const component of o3d.components ?? [])
            {
                if (!matchType(component as Components, 'Collider')) continue;
                const colliderLogic = getLogic(component) as ColliderLogic | null;
                if (colliderLogic === null) continue;

                const shape = colliderLogic.shape;
                if (shape === null) continue;

                const offset = colliderLogic.offset;
                body.addShape(shape, new Vec3(offset.x, offset.y, offset.z));
            }
        },
        beforeRender(renderObject) { members.beforeRender(renderObject); },
        update(interval) { members.update(interval); },
        get isLoaded() { return members.isLoaded; },
        dispose() { members.dispose(); },
    };

    return logic;
}

registerLogic('Rigidbody', rigidbodyLogic);
registerComponentType('Rigidbody', { baseTypes: ['Behaviour'] });
