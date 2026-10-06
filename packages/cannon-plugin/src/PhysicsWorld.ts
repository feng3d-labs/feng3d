import { Behaviour, BehaviourLogic, Components, createBehaviourLogicBase, findByName, matchType, Object3D, reactive, registerComponentType } from 'feng3d';
import { logic as getLogic, registerLogic, UnReadonly } from '@feng3d/reactivity';
import { mat4FromQuaternion, mat4GetRotation, type Vector3Like, type WritableVector3Like } from '@feng3d/math';
// 别名导入：cannon-es 的 Material 与 feng3d 的纯数据类 Material 同名，
// 而 check-imperative-construction.mjs 只看名字、不看导入来源（已知局限），
// 直接写 new Material() 会被判为「对纯数据类的 new」——与 Plane / Sphere 同一类误报。
import { Body, ContactMaterial, Material as CannonMaterial, World, type GSSolver, type RaycastVehicle as CannonRaycastVehicle, type SPHSystem as CannonSPHSystem, type Spring as CannonSpring } from 'cannon-es';
import type { ConstraintLogic } from './Constraint';
import type { RigidbodyLogic } from './Rigidbody';
import type { SpringLogic } from './Spring';
import type { VehicleLogic } from './Vehicle';
import type { SPHParticleLogic } from './SPHParticle';
import type { SPHSystemLogic } from './SPHSystem';

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

    /** 求解器迭代次数（缺失时用 cannon-es 默认 10）；刚体多、需要更好力传递时调大 */
    readonly solverIterations?: number;

    /** 接触方程刚度（缺失时用 cannon-es 默认 1e7）；调小 = 接触更"软" */
    readonly contactEquationStiffness?: number;

    /** 接触方程松弛时间（缺失时用 cannon-es 默认 3）；调大更稳但更"软" */
    readonly contactEquationRelaxation?: number;

    /** 是否用快速四元数归一化（缺失时 false）；刚体多到不太动时可省算力 */
    readonly quatNormalizeFast?: boolean;

    /** 每几次步进才归一化一次四元数（缺失时 0 = 每次都归一化） */
    readonly quatNormalizeSkip?: number;
}

/**
 * 「开始接触」事件（由 cannon-es 在 `step()` 期间派发）。
 *
 * 同时给出物理刚体与它们对应的 Object3D（刚体还没挂到场景上时后者为 null）。
 */
export interface CollideEvent
{
    /** A 端所属的 Object3D */
    readonly objectA: Object3D | null;
    /** B 端所属的 Object3D */
    readonly objectB: Object3D | null;
    /** A 端刚体 */
    readonly bodyA: Body;
    /** B 端刚体 */
    readonly bodyB: Body;
}

/**
 * 物理世界 logic 接口。
 */
export interface PhysicsWorldLogic extends BehaviourLogic
{
    /** 物理世界（cannon-es） */
    readonly world: World;

    /**
     * 订阅「开始接触」事件，返回退订函数。
     *
     * 事件在 `world.step()` 期间由 cannon-es 派发；回调里拿到的 Object3D 来自本帧的
     * 「刚体 → Object3D」映射，因此需要刚体已经注册（即至少跑过一帧 update）。
     *
     * @param listener 事件回调
     * @returns 退订函数
     */
    onCollide(listener: (event: CollideEvent) => void): () => void;
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
    /** 已创建的车辆实例（每帧要 updateVehicle，所以必须留住） */
    const createdVehicles = new Map<Components, CannonRaycastVehicle>();

    // ---- SPH（光滑粒子流体） ----
    /** 求解器实例（子树里第一个 SPHSystem 组件创建；缺失时不起 SPH） */
    let sphSystem: CannonSPHSystem | null = null;
    /** 已创建的粒子刚体：组件 → 刚体 */
    const createdSPHParticles = new Map<Components, Body>();
    /** 粒子刚体 → 所属 Object3D（每帧把位置写回） */
    const sphParticleToObject3D = new Map<Body, Object3D>();

    // ---- 碰撞事件 ----
    /** 「开始接触」的订阅者 */
    const collideListeners = new Set<(event: CollideEvent) => void>();
    /**
     * 刚体 → 所属 Object3D（每帧重建）。
     *
     * 提到闭包级是因为碰撞事件在 step 期间派发，回调要读**本帧**这份映射。
     */
    const bodyToObject3D = new Map<Body, Object3D>();

    // cannon-es 的 beginContact 载荷是 { bodyA, bodyB }；这里转成带 Object3D 的 CollideEvent
    world.addEventListener('beginContact', (event: { bodyA: Body; bodyB: Body }) =>
    {
        if (collideListeners.size === 0) return;

        const collideEvent: CollideEvent = {
            objectA: bodyToObject3D.get(event.bodyA) ?? null,
            objectB: bodyToObject3D.get(event.bodyB) ?? null,
            bodyA: event.bodyA,
            bodyB: event.bodyB,
        };
        for (const listener of collideListeners) listener(collideEvent);
    });

    // ---- 求解器与接触方程（堆叠很多刚体时这些参数决定稳不稳） ----
    // world.solver 默认是 GSSolver，只有它有 iterations
    if (data.solverIterations !== undefined) (world.solver as GSSolver).iterations = data.solverIterations;
    if (data.contactEquationStiffness !== undefined) world.defaultContactMaterial.contactEquationStiffness = data.contactEquationStiffness;
    if (data.contactEquationRelaxation !== undefined) world.defaultContactMaterial.contactEquationRelaxation = data.contactEquationRelaxation;
    if (data.quatNormalizeFast !== undefined) world.quatNormalizeFast = data.quatNormalizeFast;
    if (data.quatNormalizeSkip !== undefined) world.quatNormalizeSkip = data.quatNormalizeSkip;

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
        onCollide(listener)
        {
            collideListeners.add(listener);

            return () => { collideListeners.delete(listener); };
        },
        init(object3D) { members.init(object3D); },
        beforeRender(renderObject) { members.beforeRender(renderObject); },
        update(interval)
        {
            members.update(interval);

            const o3d = state.entity as Object3D | null;
            if (o3d === null) return;

            // 每帧重建「刚体 → 所属 Object3D」映射，并对账 world 里的刚体：
            // 本帧新出现的加进去，已从场景消失的移除（动态场景必需，否则会一直泄漏）
            bodyToObject3D.clear();
            const rigidbodies = getLogic(o3d).getComponentsInChildren('Rigidbody', true);
            const currentBodies = new Set<Body>();
            for (const rigidbody of rigidbodies)
            {
                const rigidbodyLogic = getLogic(rigidbody) as RigidbodyLogic | null;
                if (rigidbodyLogic === null) continue;

                const body = rigidbodyLogic.body;
                currentBodies.add(body);
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

            // 对账：已从场景消失的刚体（动态场景里被 splice 掉的）要从 world 移除
            for (const body of [...registered])
            {
                if (currentBodies.has(body)) continue;
                world.removeBody(body);
                registered.delete(body);
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

            // interval 单位是毫秒（Ticker 约定），第二参为「距上次调用的秒数」
            const elapsed = interval ?? (1000 / 60);

            // ---- SPH：注册求解器与粒子 ----
            // cannon-es 0.20 的 World 没有 addSystem，但 step() 会遍历 world.subsystems 逐个 update()。
            const sphSystemDatas = getLogic(o3d).getComponentsInChildren('SPHSystem', true);
            if (sphSystem === null && sphSystemDatas.length > 0)
            {
                const sphLogic = getLogic(sphSystemDatas[0]) as SPHSystemLogic | null;
                if (sphLogic !== null && sphLogic.createSystem !== null)
                {
                    sphSystem = sphLogic.createSystem();
                    world.subsystems.push(sphSystem);
                }
            }

            if (sphSystem !== null)
            {
                const sphParticles = getLogic(o3d).getComponentsInChildren('SPHParticle', true);
                for (const particleData of sphParticles)
                {
                    if (createdSPHParticles.has(particleData)) continue;

                    const particleLogic = getLogic(particleData) as SPHParticleLogic | null;
                    if (particleLogic === null || particleLogic.createBody === null) continue;

                    const owner = particleLogic.entity;
                    if (owner === null) continue;

                    const body = particleLogic.createBody();
                    const position = owner.position ?? { x: 0, y: 0, z: 0 };
                    body.position.set(position.x, position.y, position.z);

                    world.addBody(body);
                    sphSystem.add(body);
                    createdSPHParticles.set(particleData, body);
                    sphParticleToObject3D.set(body, owner);
                }
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

            // ---- 车辆：同样要在 step **之前**更新（射线探地 + 悬挂 + 摩擦） ----
            const vehicles = getLogic(o3d).getComponentsInChildren('Vehicle', true);
            for (const vehicleData of vehicles)
            {
                const vehicleLogic = getLogic(vehicleData) as VehicleLogic | null;
                if (vehicleLogic === null || vehicleLogic.createVehicle === null) continue;

                let vehicle = createdVehicles.get(vehicleData);
                if (vehicle === undefined)
                {
                    // 底盘刚体 = 车辆组件所在对象上的 Rigidbody
                    const owner = vehicleLogic.entity;
                    const chassisBody = owner === null ? null : bodyOf(owner);
                    if (chassisBody === null) continue;

                    vehicle = vehicleLogic.createVehicle(chassisBody);
                    vehicle.addToWorld(world);
                    createdVehicles.set(vehicleData, vehicle);
                }

                // 控制量每帧重读（改数据即可驾驶）
                for (let i = 0; i < vehicleLogic.wheels.length; i++)
                {
                    const wheel = vehicleLogic.wheels[i];
                    if (wheel.driving === true) vehicle.applyEngineForce(vehicleLogic.engineForce, i);
                    if (wheel.steering === true) vehicle.setSteeringValue(vehicleLogic.steering, i);
                    if (vehicleLogic.brake !== 0) vehicle.setBrake(vehicleLogic.brake, i);
                }

                vehicle.updateVehicle(elapsed / 1000);
            }

            const gravity = data.gravity ?? { x: 0, y: -9.82, z: 0 };
            world.gravity.set(gravity.x, gravity.y, gravity.z);

            world.step(1 / 60, elapsed / 1000, 3);

            // 步进后把位置与旋转写回场景数据
            for (const [body, object3D] of bodyToObject3D)
            {
                writeTransform(object3D, body);
            }

            // SPH 粒子也写回（它们不是 Rigidbody，不在上面那张映射里）
            for (const [body, object3D] of sphParticleToObject3D)
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
            for (const vehicle of createdVehicles.values()) vehicle.removeFromWorld(world);
            createdVehicles.clear();
            for (const body of createdSPHParticles.values()) world.removeBody(body);
            createdSPHParticles.clear();
            sphParticleToObject3D.clear();
            sphSystem = null;
            createdSprings.clear();
            createdConstraints.clear();
            collideListeners.clear();
            bodyToObject3D.clear();
        },
    };

    return logic;
}

registerLogic('PhysicsWorld', physicsWorldLogic);
registerComponentType('PhysicsWorld', { baseTypes: ['Behaviour'] });
