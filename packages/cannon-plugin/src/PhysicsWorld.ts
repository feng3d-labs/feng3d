import { Behaviour, BehaviourLogic, createBehaviourLogicBase, Object3D, reactive, registerComponentType } from 'feng3d';
import { logic as getLogic, registerLogic, UnReadonly } from '@feng3d/reactivity';
import type { Vector3Like, WritableVector3Like } from '@feng3d/math';
import { Body, World } from 'cannon-es';
import type { RigidbodyLogic } from './Rigidbody';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        PhysicsWorld: PhysicsWorld;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        PhysicsWorld: PhysicsWorldLogic;
    }
}

/**
 * 物理世界组件（纯数据接口）。
 *
 * 挂载后每帧执行一次步进：把子树里所有 Rigidbody 注册进 cannon-es 的 World，
 * 步进后再把刚体位置写回各自的 Object3D。
 *
 * 它与 Rigidbody 都是 Behaviour，由 sceneLogic 每帧驱动 update；
 * 因此不需要（也没有）旧版那样的 addChild / addComponent 事件监听。
 */
export interface PhysicsWorld extends Behaviour
{
    readonly __type__: 'PhysicsWorld';

    /** 重力加速度（缺失时默认 (0, -9.82, 0)） */
    readonly gravity?: Vector3Like;
}

/**
 * 物理世界 logic 接口。
 */
export interface PhysicsWorldLogic extends BehaviourLogic
{
    /** 物理世界（cannon-es） */
    readonly world: World;
}

/**
 * 把刚体位置写回 Object3D（§11.3：经响应式代理写入 raw 数据）。
 *
 * @param object3D 目标对象
 * @param x 世界位置 x
 * @param y 世界位置 y
 * @param z 世界位置 z
 */
function writePosition(object3D: Object3D, x: number, y: number, z: number): void
{
    const r_o3d = reactive(object3D) as UnReadonly<Object3D>;
    const position = r_o3d.position as WritableVector3Like | undefined;

    if (position === undefined)
    {
        // raw 数据没有 position 字段时整体写入（带判别字段，与资源侧一致）
        r_o3d.position = { __type__: 'Vector3', x, y, z } as Vector3Like;
    }
    else
    {
        position.x = x;
        position.y = y;
        position.z = z;
    }
}

/**
 * 工厂函数：PhysicsWorldLogic 的唯一创建入口。
 *
 * @param data 物理世界数据（raw）
 */
export function physicsWorldLogic(data: PhysicsWorld): PhysicsWorldLogic
{
    const writable = data as UnReadonly<PhysicsWorld>;
    if (writable.gravity === undefined) writable.gravity = { x: 0, y: -9.82, z: 0 };

    const { state, members } = createBehaviourLogicBase(data);
    const world = new World();
    const registered = new Set<Body>();

    const logic: PhysicsWorldLogic = {
        get component() { return members.component; },
        get entity() { return state.entity as Object3D | null; },
        get isVisibleAndEnabled() { return members.isVisibleAndEnabled; },
        get world() { return world; },
        init(object3D) { members.init(object3D); },
        beforeRender(renderObject) { members.beforeRender(renderObject); },
        update(interval)
        {
            members.update(interval);

            const o3d = state.entity as Object3D | null;
            if (o3d === null) return;

            // 每帧重建「刚体 → 所属 Object3D」映射：既补齐新出现的刚体，也能丢弃已移除的
            const bodyToObject3D = new Map<Body, Object3D>();
            const rigidbodies = getLogic(o3d).getComponentsInChildren('Rigidbody', true);
            for (const rigidbody of rigidbodies)
            {
                const rigidbodyLogic = getLogic(rigidbody) as RigidbodyLogic | null;
                if (rigidbodyLogic === null) continue;

                const body = rigidbodyLogic.body;
                if (!registered.has(body))
                {
                    world.addBody(body);
                    registered.add(body);
                }

                const object3D = rigidbodyLogic.entity;
                if (object3D !== null) bodyToObject3D.set(body, object3D);
            }

            const gravity = data.gravity ?? { x: 0, y: -9.82, z: 0 };
            world.gravity.set(gravity.x, gravity.y, gravity.z);

            // interval 单位是毫秒（Ticker 约定），第二参为「距上次调用的秒数」
            const elapsed = interval ?? (1000 / 60);
            world.step(1 / 60, elapsed / 1000, 3);

            // 步进后把位置写回场景数据
            for (const [body, object3D] of bodyToObject3D)
            {
                writePosition(object3D, body.position.x, body.position.y, body.position.z);
            }
        },
        get isLoaded() { return members.isLoaded; },
        dispose()
        {
            members.dispose();
            for (const body of registered) world.removeBody(body);
            registered.clear();
        },
    };

    return logic;
}

registerLogic('PhysicsWorld', physicsWorldLogic);
registerComponentType('PhysicsWorld', { baseTypes: ['Behaviour'] });
