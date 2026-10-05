import { Behaviour, BehaviourLogic, Components, createBehaviourLogicBase, findByName, matchType, Object3D, reactive, registerComponentType } from 'feng3d';
import { logic as getLogic, registerLogic, UnReadonly } from '@feng3d/reactivity';
import { mat4FromQuaternion, mat4GetRotation, type Vector3Like, type WritableVector3Like } from '@feng3d/math';
// 别名导入：cannon-es 的 Material 与 feng3d 的纯数据类 Material 同名，
// 而 check-imperative-construction.mjs 只看名字、不看导入来源（已知局限），
// 直接写 new Material() 会被判为「对纯数据类的 new」——与 Plane / Sphere 同一类误报。
import { Body, ContactMaterial, Material as CannonMaterial, World, type Spring as CannonSpring } from 'cannon-es';
import type { ConstraintLogic } from './Constraint';
import type { RigidbodyLogic } from './Rigidbody';
import type { SpringLogic } from './Spring';

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
 * 步进后再把刚体的位置与旋转写回各自的 Object3D。
 *
 * 它与 Rigidbody 都是 Behaviour，由 sceneLogic 每帧驱动 update；
 * 因此不需要（也没有）旧版那样的 addChild / addComponent 事件监听。
 */
export interface PhysicsWorld extends Behaviour
{
    readonly __type__: 'PhysicsWorld';

    /** 重力加速度（缺失时默认 (0, -9.82, 0)） */
    readonly gravity?: Vector3Like;

    /** 世界默认摩擦系数（缺失时沿用 cannon-es 的 0.3） */
    readonly friction?: number;

    /** 世界默认弹性系数（缺失时沿用 cannon-es 的 0） */
    readonly restitution?: number;
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
 * 取某个 Object3D 上 Rigidbody 组件的物理刚体（没有则返回 null）。
 *
 * @param object3D 目标对象
 * @returns 刚体或 null
 */
function bodyOf(object3D: Object3D): Body | null
{
    for (const component of object3D.components ?? [])
    {
        if (!matchType(component as Components, 'Rigidbody')) continue;
        const rigidbodyLogic = getLogic(component) as RigidbodyLogic | null;
        if (rigidbodyLogic !== null) return rigidbodyLogic.body;
    }

    return null;
}

/**
 * 把刚体的位置与旋转写回 Object3D（§11.3：经响应式代理写入 raw 数据）。
 *
 * 旋转的约定：`Object3D.rotation` 是**欧拉角（弧度）**，而 cannon-es 用四元数，
 * 所以写回时经 `mat4FromQuaternion` + `mat4GetRotation` 分解一次（顺序取默认序，
 * 与 Rigidbody 初始化时的 `quatFromEuler` 一致）。
 *
 * @param object3D 目标对象
 * @param body 物理刚体
 */
function writeTransform(object3D: Object3D, body: Body): void
{
    const r_o3d = reactive(object3D) as UnReadonly<Object3D>;

    // ---- 位置 ----
    const position = r_o3d.position as WritableVector3Like | undefined;

    if (position === undefined)
    {
        // raw 数据没有该字段时整体写入（带判别字段，与资源侧一致）
        r_o3d.position = { __type__: 'Vector3', x: body.position.x, y: body.position.y, z: body.position.z } as Vector3Like;
    }
    else
    {
        position.x = body.position.x;
        position.y = body.position.y;
        position.z = body.position.z;
    }

    // ---- 旋转（四元数 → 欧拉角） ----
    const euler = mat4GetRotation(mat4FromQuaternion(body.quaternion));
    const rotation = r_o3d.rotation as WritableVector3Like | undefined;

    if (rotation === undefined)
    {
        r_o3d.rotation = { __type__: 'Vector3', x: euler.x, y: euler.y, z: euler.z } as Vector3Like;
    }
    else
    {
        rotation.x = euler.x;
        rotation.y = euler.y;
        rotation.z = euler.z;
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
    const createdConstraints = new Set<Components>();
    /** 已创建的弹簧实例（每帧要对它们 applyForce，所以必须留住） */
    const createdSprings = new Map<Components, CannonSpring>();

    // ---- 接触材质（摩擦 / 弹性） ----
    // 世界默认：cannon-es 的 defaultContactMaterial 兜住所有没有专门 ContactMaterial 的接触对
    if (data.friction !== undefined) world.defaultContactMaterial.friction = data.friction;
    if (data.restitution !== undefined) world.defaultContactMaterial.restitution = data.restitution;

    const defaultFriction = world.defaultContactMaterial.friction;
    const defaultRestitution = world.defaultContactMaterial.restitution;

    /** 按「摩擦:弹性」缓存的材质——同参数的刚体复用同一个 Material */
    const materialCache = new Map<string, CannonMaterial>();

    /**
     * 取（或创建）一组接触参数的材质，并为它与「世界默认」及「所有已登记自定义材质」
     * 注册 ContactMaterial。
     *
     * 为什么必须注册：cannon-es 的摩擦/弹性是**接触对**属性，只给 body 设 Material
     * 而没有对应 ContactMaterial 时，World 会退回 defaultContactMaterial——声明的值等于没写。
     * 组合参数取「**摩擦取两者平均、弹性取较大者**」，这样「一个很弹的球 + 一堆不弹的箱子」
     * 能表达出「球弹、箱子不弹」；这是启发式，够用但不是物理上唯一的定义。
     *
     * @param friction 摩擦系数
     * @param restitution 弹性系数
     * @returns 该参数对应的材质
     */
    function getMaterial(friction: number, restitution: number): CannonMaterial
    {
        const key = friction + ':' + restitution;
        const cached = materialCache.get(key);
        if (cached !== undefined) return cached;

        const material = new CannonMaterial();
        material.friction = friction;
        material.restitution = restitution;

        // 与世界默认材质
        world.addContactMaterial(new ContactMaterial(material, world.defaultMaterial, {
            friction: (friction + defaultFriction) / 2,
            restitution: Math.max(restitution, defaultRestitution),
        }));

        // 与其它已登记的自定义材质
        for (const [otherKey, other] of materialCache)
        {
            const [otherFriction, otherRestitution] = otherKey.split(':').map(Number);
            world.addContactMaterial(new ContactMaterial(material, other, {
                friction: (friction + otherFriction) / 2,
                restitution: Math.max(restitution, otherRestitution),
            }));
        }

        materialCache.set(key, material);

        return material;
    }

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

                // 刚体声明了摩擦/弹性时给它一个独立材质（未声明的字段沿用世界默认）
                if (rigidbodyLogic.friction !== undefined || rigidbodyLogic.restitution !== undefined)
                {
                    body.material = getMaterial(
                        rigidbodyLogic.friction ?? defaultFriction,
                        rigidbodyLogic.restitution ?? defaultRestitution);
                }

                const object3D = rigidbodyLogic.entity;
                if (object3D !== null) bodyToObject3D.set(body, object3D);
            }

            // ---- 约束：连接两个刚体（两端 body 都就绪才创建，且只创建一次） ----
            const constraints = getLogic(o3d).getComponentsInChildren('Constraint', true);
            for (const constraintData of constraints)
            {
                if (createdConstraints.has(constraintData)) continue;

                const constraintLogic = getLogic(constraintData) as ConstraintLogic | null;
                if (constraintLogic === null || constraintLogic.createConstraint === null) continue;

                // A 端：约束所在对象上的刚体；B 端：按名字在同一个物理世界子树里找
                const owner = constraintLogic.entity;
                const bodyA = owner === null ? null : bodyOf(owner);
                const target = findByName(o3d, constraintLogic.targetName);
                const bodyB = target === undefined ? null : bodyOf(target);
                if (bodyA === null || bodyB === null) continue;

                world.addConstraint(constraintLogic.createConstraint(bodyA, bodyB));
                createdConstraints.add(constraintData);
            }

            // ---- 弹簧：必须在 step **之前**施力 ----
            // cannon-es 的 Spring 不参与约束求解，要每帧自己 applyForce() 才生效，
            // 所以它走不了 addConstraint 那条路——这是 PhysicsWorld 里唯一的"步进前钩子"。
            const springs = getLogic(o3d).getComponentsInChildren('Spring', true);
            for (const springData of springs)
            {
                const springLogic = getLogic(springData) as SpringLogic | null;
                if (springLogic === null || springLogic.createSpring === null) continue;

                let spring = createdSprings.get(springData);
                if (spring === undefined)
                {
                    const owner = springLogic.entity;
                    const bodyA = owner === null ? null : bodyOf(owner);
                    const target = findByName(o3d, springLogic.targetName);
                    const bodyB = target === undefined ? null : bodyOf(target);
                    if (bodyA === null || bodyB === null) continue;

                    spring = springLogic.createSpring(bodyA, bodyB);
                    createdSprings.set(springData, spring);
                }

                spring.applyForce();
            }

            const gravity = data.gravity ?? { x: 0, y: -9.82, z: 0 };
            world.gravity.set(gravity.x, gravity.y, gravity.z);

            // interval 单位是毫秒（Ticker 约定），第二参为「距上次调用的秒数」
            const elapsed = interval ?? (1000 / 60);
            world.step(1 / 60, elapsed / 1000, 3);

            // 步进后把位置与旋转写回场景数据
            for (const [body, object3D] of bodyToObject3D)
            {
                writeTransform(object3D, body);
            }
        },
        get isLoaded() { return members.isLoaded; },
        dispose()
        {
            members.dispose();
            for (const body of registered) world.removeBody(body);
            registered.clear();
            for (const constraint of world.constraints.slice()) world.removeConstraint(constraint);
            createdSprings.clear();
            createdConstraints.clear();
        },
    };

    return logic;
}

registerLogic('PhysicsWorld', physicsWorldLogic);
registerComponentType('PhysicsWorld', { baseTypes: ['Behaviour'] });
