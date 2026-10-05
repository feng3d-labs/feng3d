import { Behaviour, BehaviourLogic, Components, createBehaviourLogicBase, matchType, Object3D, registerComponentType } from 'feng3d';
import { logic as getLogic, registerLogic, UnReadonly } from '@feng3d/reactivity';
import { quatFromEuler } from '@feng3d/math';
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
    const body = new Body({ mass: data.mass ?? 0 });

    const logic: RigidbodyLogic = {
        get component() { return members.component; },
        get entity() { return state.entity as Object3D | null; },
        get isVisibleAndEnabled() { return members.isVisibleAndEnabled; },
        get body() { return body; },
        get friction() { return data.friction; },
        get restitution() { return data.restitution; },
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
