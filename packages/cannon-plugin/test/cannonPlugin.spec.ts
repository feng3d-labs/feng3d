// 副作用导入：各碰撞体 / 刚体 / 物理世界都是纯数据类型，只用作类型标注的 import
// 会被转译器整条擦除，于是 registerLogic 不执行、logic() 返回 null（与 ui 包测试同款坑）。
import 'feng3d';
import { Object3D, reactive } from 'feng3d';
import { logic } from '@feng3d/reactivity';
import { Body, Box, ConvexPolyhedron, Cylinder, Heightfield, HingeConstraint as CannonHingeConstraint, Particle, Plane, Sphere, Trimesh } from 'cannon-es';
import { describe, expect, it } from 'vitest';
import '../src/index';
import type { BoxCollider } from '../src/BoxCollider';
import type { CylinderCollider } from '../src/CylinderCollider';
import type { PhysicsWorld } from '../src/PhysicsWorld';
import type { PhysicsWorldLogic } from '../src/PhysicsWorld';
import type { PlaneCollider } from '../src/PlaneCollider';
import type { Rigidbody, RigidbodyLogic } from '../src/Rigidbody';
import type { ColliderLogic } from '../src/Collider';
import type { SphereCollider } from '../src/SphereCollider';
import type { TrimeshCollider } from '../src/TrimeshCollider';
import type { ConvexCollider } from '../src/ConvexCollider';
import type { HeightfieldCollider } from '../src/HeightfieldCollider';
import type { ParticleCollider } from '../src/ParticleCollider';
import type { ConeTwistConstraint } from '../src/ConeTwistConstraint';
import type { HingeConstraint, HingeConstraintLogic } from '../src/HingeConstraint';
import type { Vehicle } from '../src/Vehicle';
import type { SPHParticle } from '../src/SPHParticle';
import type { SPHSystem } from '../src/SPHSystem';

describe('cannon-plugin：碰撞体', () =>
{
    it('BoxCollider 缺省尺寸补成 1/1/1，shape 是半边长各半的 Box', () =>
    {
        const data = { __type__: 'BoxCollider' } as BoxCollider;
        const colliderLogic = logic(data) as ColliderLogic;

        expect(data.width).toBe(1);
        expect(data.height).toBe(1);
        expect(data.depth).toBe(1);
        const shape = colliderLogic.shape as Box;
        expect(shape).toBeInstanceOf(Box);
        expect(shape.halfExtents.x).toBe(0.5);
        expect(shape.halfExtents.y).toBe(0.5);
        expect(shape.halfExtents.z).toBe(0.5);
    });

    it('BoxCollider 显式尺寸不被覆盖，半边长按尺寸的一半', () =>
    {
        const data = { __type__: 'BoxCollider', width: 2, height: 4, depth: 6 } as BoxCollider;
        const shape = (logic(data) as ColliderLogic).shape as Box;

        expect(shape.halfExtents.x).toBe(1);
        expect(shape.halfExtents.y).toBe(2);
        expect(shape.halfExtents.z).toBe(3);
    });

    it('SphereCollider 缺省半径 0.5，shape 半径一致', () =>
    {
        const data = { __type__: 'SphereCollider' } as SphereCollider;
        const shape = (logic(data) as ColliderLogic).shape as Sphere;

        expect(data.radius).toBe(0.5);
        expect(shape).toBeInstanceOf(Sphere);
        expect(shape.radius).toBe(0.5);
    });

    it('TrimeshCollider 从几何体的顶点/索引生成 Trimesh', () =>
    {
        const data = { __type__: 'TrimeshCollider', geometry: { __type__: 'CubeGeometry' } } as TrimeshCollider;
        const shape = (logic(data) as ColliderLogic).shape as Trimesh;

        expect(shape).toBeInstanceOf(Trimesh);
        expect(shape.vertices.length).toBeGreaterThan(0);
        expect(shape.indices.length).toBeGreaterThan(0);
    });

    it('ConvexCollider 从几何体的顶点/三角面生成 ConvexPolyhedron', () =>
    {
        const data = { __type__: 'ConvexCollider', geometry: { __type__: 'CubeGeometry' } } as ConvexCollider;
        const shape = (logic(data) as ColliderLogic).shape as ConvexPolyhedron;

        expect(shape).toBeInstanceOf(ConvexPolyhedron);
        expect(shape.vertices.length).toBeGreaterThan(0);
        expect(shape.faces.length).toBeGreaterThan(0);
    });

    it('ConvexCollider 支持显式顶点与面（四面体这类没有现成几何的形状）', () =>
    {
        const data = {
            __type__: 'ConvexCollider',
            vertices: [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }],
            faces: [[0, 1, 2], [0, 2, 3], [0, 3, 1], [1, 3, 2]],
        } as ConvexCollider;
        const shape = (logic(data) as ColliderLogic).shape as ConvexPolyhedron;

        expect(shape).toBeInstanceOf(ConvexPolyhedron);
        expect(shape.vertices.length).toBe(4);
        expect(shape.faces.length).toBe(4);
    });

    it('ParticleCollider 的 shape 是 Particle（点状、无体积）', () =>
    {
        const data = { __type__: 'ParticleCollider' } as ParticleCollider;
        const shape = (logic(data) as ColliderLogic).shape;

        expect(shape).toBeInstanceOf(Particle);
    });

    it('HeightfieldCollider 缺省 elementSize 补成 1，shape 是 Heightfield', () =>
    {
        const data = { __type__: 'HeightfieldCollider', heights: [[0, 0], [0, 1]] } as HeightfieldCollider;
        const shape = (logic(data) as ColliderLogic).shape as Heightfield;

        expect(data.elementSize).toBe(1);
        expect(shape).toBeInstanceOf(Heightfield);
    });

    it('PlaneCollider 的 shape 是 Plane', () =>
    {
        const data = { __type__: 'PlaneCollider' } as PlaneCollider;
        const shape = (logic(data) as ColliderLogic).shape;

        expect(shape).toBeInstanceOf(Plane);
    });

    it('CylinderCollider 缺省参数补成 0.5/0.5/2/16', () =>
    {
        const data = { __type__: 'CylinderCollider' } as CylinderCollider;
        const shape = (logic(data) as ColliderLogic).shape as Cylinder;

        expect(data.topRadius).toBe(0.5);
        expect(data.bottomRadius).toBe(0.5);
        expect(data.height).toBe(2);
        expect(data.segmentsW).toBe(16);
        expect(shape).toBeInstanceOf(Cylinder);
        expect(shape.radiusTop).toBe(0.5);
        expect(shape.height).toBe(2);
    });

    it('shape 惰性创建且只创建一次（多次访问同一实例）', () =>
    {
        const data = { __type__: 'BoxCollider' } as BoxCollider;
        const colliderLogic = logic(data) as ColliderLogic;

        expect(colliderLogic.shape).toBe(colliderLogic.shape);
    });
});

describe('cannon-plugin：刚体', () =>
{
    it('缺省质量 0（与 cannon-es 的 Body 默认一致，即静态）', () =>
    {
        const data = { __type__: 'Rigidbody' } as Rigidbody;
        const rigidbodyLogic = logic(data) as RigidbodyLogic;

        expect(data.mass).toBe(0);
        expect(rigidbodyLogic.body.mass).toBe(0);
    });

    it('挂载后收集同一 Object3D 上碰撞体的形状，并从本地位置初始化刚体位置', () =>
    {
        const object3D: Object3D = {
            __type__: 'Object3D',
            position: { x: 1, y: 2, z: 3 },
            components: [
                { __type__: 'BoxCollider', width: 2, height: 2, depth: 2 },
                { __type__: 'SphereCollider', radius: 1 },
                { __type__: 'Rigidbody', mass: 5 },
            ],
        };
        logic(object3D);

        const rigidbody = object3D.components![2] as Rigidbody;
        const rigidbodyLogic = logic(rigidbody) as RigidbodyLogic;

        expect(rigidbodyLogic.body.mass).toBe(5);
        // 两个碰撞体 → 两个形状
        expect(rigidbodyLogic.body.shapes.length).toBe(2);
        expect(rigidbodyLogic.body.position.x).toBe(1);
        expect(rigidbodyLogic.body.position.y).toBe(2);
        expect(rigidbodyLogic.body.position.z).toBe(3);
    });

    it('初始旋转从 Object3D.rotation（欧拉角）转成刚体四元数', () =>
    {
        const object3D: Object3D = {
            __type__: 'Object3D',
            rotation: { x: 0, y: Math.PI / 2, z: 0 },
            components: [
                { __type__: 'BoxCollider' },
                { __type__: 'Rigidbody', mass: 1 },
            ],
        };
        logic(object3D);
        const rigidbody = object3D.components![1] as Rigidbody;
        const rigidbodyLogic = logic(rigidbody) as RigidbodyLogic;

        // 绕 Y 轴 90° → 四元数 (0, √½, 0, √½)
        expect(rigidbodyLogic.body.quaternion.y).toBeCloseTo(Math.SQRT1_2, 5);
        expect(rigidbodyLogic.body.quaternion.w).toBeCloseTo(Math.SQRT1_2, 5);
    });

    it('多个碰撞体带各自的 offset，拼成复合刚体（偏移逐项进入 body）', () =>
    {
        const object3D: Object3D = {
            __type__: 'Object3D',
            components: [
                { __type__: 'BoxCollider', width: 2, height: 0.3, depth: 0.3 },
                { __type__: 'SphereCollider', radius: 0.5, offset: { x: -0.85, y: 0, z: 0 } },
                { __type__: 'SphereCollider', radius: 0.5, offset: { x: 0.85, y: 0, z: 0 } },
                { __type__: 'Rigidbody', mass: 1 },
            ],
        };
        logic(object3D);
        const rigidbody = object3D.components![3] as Rigidbody;
        const rigidbodyLogic = logic(rigidbody) as RigidbodyLogic;

        expect(rigidbodyLogic.body.shapes.length).toBe(3);
        // 未声明 offset 的杆在原点
        expect(rigidbodyLogic.body.shapeOffsets[0].x).toBe(0);
        // 两个球分别在 ±0.85
        expect(rigidbodyLogic.body.shapeOffsets[1].x).toBeCloseTo(-0.85, 6);
        expect(rigidbodyLogic.body.shapeOffsets[2].x).toBeCloseTo(0.85, 6);
    });
});

describe('cannon-plugin：物理世界', () =>
{
    /** 构造「物理世界（根）+ 一个下落刚体（子）」的场景 */
    function createScene()
    {
        const object3D: Object3D = {
            __type__: 'Object3D',
            components: [{ __type__: 'PhysicsWorld' }],
            children: [
                {
                    __type__: 'Object3D',
                    position: { x: 0, y: 10, z: 0 },
                    components: [
                        { __type__: 'BoxCollider', width: 1, height: 1, depth: 1 },
                        { __type__: 'Rigidbody', mass: 1 },
                    ],
                },
            ],
        };
        logic(object3D);

        return object3D;
    }

    it('缺省重力是 (0, -9.82, 0)', () =>
    {
        const data = { __type__: 'PhysicsWorld' } as PhysicsWorld;
        logic(data);

        expect(data.gravity).toEqual({ x: 0, y: -9.82, z: 0 });
    });

    it('步进后把子树里的刚体注册进 world', () =>
    {
        const object3D = createScene();
        const physicsWorld = object3D.components![0] as PhysicsWorld;
        const physicsWorldLogic = logic(physicsWorld) as PhysicsWorldLogic;

        physicsWorldLogic.update(1000 / 60);

        expect(physicsWorldLogic.world.bodies.length).toBe(1);
        // 反复注册不产生重复 body
        physicsWorldLogic.update(1000 / 60);
        expect(physicsWorldLogic.world.bodies.length).toBe(1);
    });

    it('连续步进后刚体受重力下落，位置写回 Object3D', () =>
    {
        const object3D = createScene();
        const physicsWorld = object3D.components![0] as PhysicsWorld;
        const child = object3D.children![0];
        const physicsWorldLogic = logic(physicsWorld) as PhysicsWorldLogic;

        for (let i = 0; i < 60; i++) physicsWorldLogic.update(1000 / 60);

        // 1 秒自由落体：y 从 10 降到 10 - 0.5 * 9.82 ≈ 5.1
        expect(child.position!.y).toBeLessThan(9);
        expect(child.position!.y).toBeGreaterThan(4);
        // 水平方向不受力
        expect(child.position!.x).toBe(0);
    });

    it('步进后把刚体旋转写回 Object3D.rotation（四元数 → 欧拉角）', () =>
    {
        const object3D = createScene();
        const physicsWorld = object3D.components![0] as PhysicsWorld;
        const child = object3D.children![0];
        const rigidbody = child.components![1] as Rigidbody;
        const physicsWorldLogic = logic(physicsWorld) as PhysicsWorldLogic;
        const rigidbodyLogic = logic(rigidbody) as RigidbodyLogic;

        // 先跑一帧完成注册，再人为把刚体转过 90°（绕 Y）
        physicsWorldLogic.update(1000 / 60);
        rigidbodyLogic.body.quaternion.set(0, Math.SQRT1_2, 0, Math.SQRT1_2);
        physicsWorldLogic.update(1000 / 60);

        expect(child.rotation).toBeDefined();
        expect(child.rotation!.y).toBeCloseTo(Math.PI / 2, 4);
    });

    it('世界重力原样传给 cannon-es 的 world.gravity', () =>
    {
        const object3D: Object3D = {
            __type__: 'Object3D',
            components: [{ __type__: 'PhysicsWorld', gravity: { x: 0, y: -1, z: 0 } }],
        };
        logic(object3D);
        const physicsWorld = object3D.components![0] as PhysicsWorld;
        const physicsWorldLogic = logic(physicsWorld) as PhysicsWorldLogic;

        physicsWorldLogic.update(1000 / 60);

        expect(physicsWorldLogic.world.gravity.y).toBe(-1);
    });

    it('世界默认摩擦/弹性写到 defaultContactMaterial', () =>
    {
        const data = { __type__: 'PhysicsWorld', friction: 0.5, restitution: 0.9 } as PhysicsWorld;
        const physicsWorldLogic = logic(data) as PhysicsWorldLogic;

        expect(physicsWorldLogic.world.defaultContactMaterial.friction).toBe(0.5);
        expect(physicsWorldLogic.world.defaultContactMaterial.restitution).toBe(0.9);
    });

    it('DistanceConstraint 按 targetName 找到另一端刚体并注册到 world（不重复注册）', () =>
    {
        const object3D: Object3D = {
            __type__: 'Object3D',
            components: [{ __type__: 'PhysicsWorld' }],
            children: [{
                __type__: 'Object3D',
                name: 'Anchor',
                position: { x: 0, y: 10, z: 0 },
                components: [{ __type__: 'BoxCollider' }, { __type__: 'Rigidbody', mass: 0 }],
            }, {
                __type__: 'Object3D',
                name: 'Bob',
                position: { x: 0, y: 8, z: 0 },
                components: [
                    { __type__: 'SphereCollider' },
                    { __type__: 'Rigidbody', mass: 1 },
                    { __type__: 'DistanceConstraint', targetName: 'Anchor', distance: 2 },
                ],
            }],
        };
        logic(object3D);
        const physicsWorld = object3D.components![0] as PhysicsWorld;
        const physicsWorldLogic = logic(physicsWorld) as PhysicsWorldLogic;

        physicsWorldLogic.update(1000 / 60);
        expect(physicsWorldLogic.world.constraints.length).toBe(1);

        // 反复步进不重复创建
        physicsWorldLogic.update(1000 / 60);
        expect(physicsWorldLogic.world.constraints.length).toBe(1);
    });

    it('targetName 找不到对应对象时不创建约束（也不抛错）', () =>
    {
        const object3D: Object3D = {
            __type__: 'Object3D',
            components: [{ __type__: 'PhysicsWorld' }],
            children: [{
                __type__: 'Object3D',
                name: 'Bob',
                components: [
                    { __type__: 'SphereCollider' },
                    { __type__: 'Rigidbody', mass: 1 },
                    { __type__: 'DistanceConstraint', targetName: 'NotExist' },
                ],
            }],
        };
        logic(object3D);
        const physicsWorld = object3D.components![0] as PhysicsWorld;
        const physicsWorldLogic = logic(physicsWorld) as PhysicsWorldLogic;

        expect(() => physicsWorldLogic.update(1000 / 60)).not.toThrow();
        expect(physicsWorldLogic.world.constraints.length).toBe(0);
    });

    it('HingeConstraint 同样按 targetName 连接两端刚体', () =>
    {
        const object3D: Object3D = {
            __type__: 'Object3D',
            components: [{ __type__: 'PhysicsWorld' }],
            children: [{
                __type__: 'Object3D',
                name: 'Frame',
                components: [{ __type__: 'BoxCollider' }, { __type__: 'Rigidbody', mass: 0 }],
            }, {
                __type__: 'Object3D',
                name: 'Door',
                position: { x: 1, y: 0, z: 0 },
                components: [
                    { __type__: 'BoxCollider' },
                    { __type__: 'Rigidbody', mass: 1 },
                    { __type__: 'HingeConstraint', targetName: 'Frame' },
                ],
            }],
        };
        logic(object3D);
        const physicsWorld = object3D.components![0] as PhysicsWorld;
        const physicsWorldLogic = logic(physicsWorld) as PhysicsWorldLogic;

        physicsWorldLogic.update(1000 / 60);
        expect(physicsWorldLogic.world.constraints.length).toBe(1);
    });

    it('LockConstraint / PointToPointConstraint 与其它约束同构地连接两端刚体', () =>
    {
        for (const type of ['LockConstraint', 'PointToPointConstraint'])
        {
            const object3D: Object3D = {
                __type__: 'Object3D',
                components: [{ __type__: 'PhysicsWorld' }],
                children: [{
                    __type__: 'Object3D',
                    name: 'A',
                    components: [{ __type__: 'BoxCollider' }, { __type__: 'Rigidbody', mass: 0 }],
                }, {
                    __type__: 'Object3D',
                    name: 'B',
                    position: { x: 2, y: 0, z: 0 },
                    components: [
                        { __type__: 'BoxCollider' },
                        { __type__: 'Rigidbody', mass: 1 },
                        { __type__: type, targetName: 'A' },
                    ],
                }],
            } as Object3D;
            logic(object3D);
            const physicsWorldLogic = logic(object3D.components![0] as PhysicsWorld) as PhysicsWorldLogic;

            physicsWorldLogic.update(1000 / 60);

            expect(physicsWorldLogic.world.constraints.length, type).toBe(1);
        }
    });

    it('ConeTwistConstraint 与其它约束同构地连接两端刚体', () =>
    {
        const object3D: Object3D = {
            __type__: 'Object3D',
            components: [{ __type__: 'PhysicsWorld' }],
            children: [{
                __type__: 'Object3D',
                name: 'Upper',
                components: [{ __type__: 'BoxCollider' }, { __type__: 'Rigidbody', mass: 0 }],
            }, {
                __type__: 'Object3D',
                name: 'Lower',
                position: { x: 0, y: -2, z: 0 },
                components: [
                    { __type__: 'BoxCollider' },
                    { __type__: 'Rigidbody', mass: 1 },
                    { __type__: 'ConeTwistConstraint', targetName: 'Upper', angle: Math.PI / 4, twistAngle: Math.PI / 8 },
                ],
            }],
        };
        logic(object3D);
        const physicsWorldLogic = logic(object3D.components![0] as PhysicsWorld) as PhysicsWorldLogic;

        physicsWorldLogic.update(1000 / 60);

        expect(physicsWorldLogic.world.constraints.length).toBe(1);
    });

    it('HingeConstraint 的 enableMotor / motorSpeed 真的落到 cannon-es 的马达上', () =>
    {
        const data = {
            __type__: 'HingeConstraint',
            targetName: 'Frame',
            enableMotor: true,
            motorSpeed: -14,
        } as unknown as HingeConstraint;
        const hingeLogic = logic(data) as HingeConstraintLogic;
        const bodyA = new Body({ mass: 0 });
        const bodyB = new Body({ mass: 1 });

        const hinge = hingeLogic.createConstraint?.(bodyA, bodyB) as CannonHingeConstraint;

        expect(hinge).toBeInstanceOf(CannonHingeConstraint);
        expect((hinge as unknown as { motorEquation: { enabled: boolean; targetVelocity: number } }).motorEquation.enabled).toBe(true);
        expect((hinge as unknown as { motorEquation: { targetVelocity: number } }).motorEquation.targetVelocity).toBe(-14);
    });

    it('Spring 走"步进前钩子"：被它吊住的刚体不会自由落体', () =>
    {
        const object3D: Object3D = {
            __type__: 'Object3D',
            components: [{ __type__: 'PhysicsWorld' }],
            children: [{
                __type__: 'Object3D',
                name: 'Anchor',
                position: { x: 0, y: 10, z: 0 },
                components: [{ __type__: 'BoxCollider' }, { __type__: 'Rigidbody', mass: 0 }],
            }, {
                __type__: 'Object3D',
                name: 'Bob',
                position: { x: 0, y: 6, z: 0 },
                components: [
                    { __type__: 'SphereCollider' },
                    { __type__: 'Rigidbody', mass: 1 },
                    { __type__: 'Spring', targetName: 'Anchor', restLength: 4, stiffness: 200, damping: 5 },
                ],
            }],
        };
        logic(object3D);
        const physicsWorldLogic = logic(object3D.components![0] as PhysicsWorld) as PhysicsWorldLogic;

        for (let i = 0; i < 60; i++) physicsWorldLogic.update(1000 / 60);

        const bob = object3D.children![1];
        // 无弹簧时 1 秒自由落体会掉到 y≈1；被弹簧吊住则应稳定在静止长度附近（略被拉伸）
        expect(bob.position!.y).toBeGreaterThan(4);
    });

    it('applyImpulse 施加瞬时冲量：速度按「冲量 / 质量」变化', () =>
    {
        const object3D: Object3D = {
            __type__: 'Object3D',
            // 关掉重力，只看冲量的效果
            components: [{ __type__: 'PhysicsWorld', gravity: { x: 0, y: 0, z: 0 } }],
            children: [{
                __type__: 'Object3D',
                components: [{ __type__: 'BoxCollider' }, { __type__: 'Rigidbody', mass: 2 }],
            }],
        };
        logic(object3D);
        const physicsWorldLogic = logic(object3D.components![0] as PhysicsWorld) as PhysicsWorldLogic;
        const rigidbodyLogic = logic(object3D.children![0].components![1] as Rigidbody) as RigidbodyLogic;

        physicsWorldLogic.update(1000 / 60);
        rigidbodyLogic.applyImpulse({ x: 4, y: 0, z: 0 });
        physicsWorldLogic.update(1000 / 60);

        // 冲量 4 / 质量 2 = 速度 2 m/s（step 里有 cannon-es 默认的线性阻尼，故只保留 3 位精度）
        expect(rigidbodyLogic.body.velocity.x).toBeCloseTo(2, 3);
    });

    it('onCollide 订阅开始接触事件；退订后不再回调', () =>
    {
        const object3D: Object3D = {
            __type__: 'Object3D',
            components: [{ __type__: 'PhysicsWorld' }],
            children: [{
                __type__: 'Object3D',
                name: 'Ground',
                components: [{ __type__: 'BoxCollider', width: 10, height: 1, depth: 10 }, { __type__: 'Rigidbody', mass: 0 }],
            }, {
                __type__: 'Object3D',
                name: 'Ball',
                position: { x: 0, y: 3, z: 0 },
                components: [{ __type__: 'SphereCollider', radius: 0.5 }, { __type__: 'Rigidbody', mass: 1 }],
            }],
        };
        logic(object3D);
        const physicsWorldLogic = logic(object3D.components![0] as PhysicsWorld) as PhysicsWorldLogic;

        const events: string[] = [];
        const off = physicsWorldLogic.onCollide((event) =>
        {
            events.push(String((event.objectA as Object3D | null)?.name) + '|' + String((event.objectB as Object3D | null)?.name));
        });

        for (let i = 0; i < 120; i++) physicsWorldLogic.update(1000 / 60);
        expect(events.length).toBeGreaterThan(0);
        expect(events.some((e) => e.includes('Ground') && e.includes('Ball'))).toBe(true);

        const before = events.length;
        off();
        for (let i = 0; i < 120; i++) physicsWorldLogic.update(1000 / 60);
        expect(events.length).toBe(before);
    });

    it('Vehicle 按底盘刚体创建射线车辆并驱动（不抛错，底盘落到悬挂高度）', () =>
    {
        const object3D: Object3D = {
            __type__: 'Object3D',
            components: [{ __type__: 'PhysicsWorld' }],
            children: [{
                __type__: 'Object3D',
                name: 'Ground',
                components: [{ __type__: 'BoxCollider', width: 100, height: 1, depth: 100 }, { __type__: 'Rigidbody', mass: 0 }],
            }, {
                __type__: 'Object3D',
                name: 'Chassis',
                position: { x: 0, y: 2, z: 0 },
                components: [
                    { __type__: 'BoxCollider', width: 1.8, height: 0.6, depth: 4 },
                    { __type__: 'Rigidbody', mass: 100 },
                    {
                        __type__: 'Vehicle',
                        wheels: [
                            { position: { x: -0.9, y: -0.3, z: 1.4 }, steering: true, driving: true },
                            { position: { x: 0.9, y: -0.3, z: 1.4 }, steering: true, driving: true },
                            { position: { x: -0.9, y: -0.3, z: -1.4 } },
                            { position: { x: 0.9, y: -0.3, z: -1.4 } },
                        ],
                        engineForce: 200,
                        steering: 0.2,
                    },
                ],
            }],
        };
        logic(object3D);
        const physicsWorldLogic = logic(object3D.components![0] as PhysicsWorld) as PhysicsWorldLogic;
        const vehicle = object3D.children![1].components![2] as Vehicle;

        expect(() => { for (let i = 0; i < 120; i++) physicsWorldLogic.update(1000 / 60); }).not.toThrow();
        // 控制量原样保留
        expect(vehicle.engineForce).toBe(200);
        // 底盘被悬挂托住：两秒自由落体会掉到地面以下，这里必须还在半空
        expect(object3D.children![1].position!.y).toBeGreaterThan(1);
    });

    it('运行时往 children push 新刚体会进世界，splice 掉会从世界移除（动态场景对账）', () =>
    {
        const root: Object3D = {
            __type__: 'Object3D',
            components: [{ __type__: 'PhysicsWorld' }],
            children: [],
        };
        logic(root);
        const physicsWorldLogic = logic(root.components![0] as PhysicsWorld) as PhysicsWorldLogic;

        physicsWorldLogic.update(1000 / 60);
        expect(physicsWorldLogic.world.bodies.length).toBe(0);

        const r_root = reactive(root) as unknown as { children: Object3D[] };
        r_root.children.push({
            __type__: 'Object3D',
            name: 'Dynamic',
            position: { x: 0, y: 5, z: 0 },
            components: [{ __type__: 'BoxCollider' }, { __type__: 'Rigidbody', mass: 1 }],
        });

        physicsWorldLogic.update(1000 / 60);
        expect(physicsWorldLogic.world.bodies.length).toBe(1);

        r_root.children.splice(0, 1);
        physicsWorldLogic.update(1000 / 60);
        expect(physicsWorldLogic.world.bodies.length).toBe(0);
    });

    it('PhysicsWorld 的求解器与接触方程参数按声明生效', () =>
    {
        const data = {
            __type__: 'PhysicsWorld',
            solverIterations: 5,
            contactEquationStiffness: 5e6,
            contactEquationRelaxation: 10,
            quatNormalizeFast: true,
            quatNormalizeSkip: 3,
        } as PhysicsWorld;
        const physicsWorldLogic = logic(data) as PhysicsWorldLogic;

        expect((physicsWorldLogic.world.solver as unknown as { iterations: number }).iterations).toBe(5);
        expect(physicsWorldLogic.world.defaultContactMaterial.contactEquationStiffness).toBe(5e6);
        expect(physicsWorldLogic.world.defaultContactMaterial.contactEquationRelaxation).toBe(10);
        expect(physicsWorldLogic.world.quatNormalizeFast).toBe(true);
        expect(physicsWorldLogic.world.quatNormalizeSkip).toBe(3);
    });

    it('SPHSystem / SPHParticle 接入求解器与刚体表，缺省参数由工厂补齐', () =>
    {
        const object3D: Object3D = {
            __type__: 'Object3D',
            components: [
                { __type__: 'PhysicsWorld' },
                { __type__: 'SPHSystem', density: 2 },
            ],
            children: [{
                __type__: 'Object3D',
                name: 'P1',
                position: { x: 1, y: 2, z: 3 },
                components: [{ __type__: 'SPHParticle' }],
            }, {
                __type__: 'Object3D',
                name: 'P2',
                position: { x: -1, y: 2, z: 0 },
                components: [{ __type__: 'SPHParticle', mass: 2 }],
            }],
        };
        logic(object3D);
        const physicsWorldLogic = logic(object3D.components![0] as PhysicsWorld) as PhysicsWorldLogic;
        const sphSystem = object3D.components![1] as SPHSystem;
        // 第二个粒子才是显式声明了 mass 的那个
        const particle = object3D.children![1].components![0] as SPHParticle;

        physicsWorldLogic.update(1000 / 60);

        // 求解器进了 world.subsystems（step 会逐个 update），粒子进了 world.bodies
        expect(physicsWorldLogic.world.subsystems.length).toBe(1);
        expect(physicsWorldLogic.world.bodies.length).toBe(2);
        // 缺省值由工厂补在数据上
        expect(sphSystem.smoothingRadius).toBe(1);
        expect(particle.radius).toBe(0.1);
        expect(particle.linearDamping).toBe(0.9);
        // 显式给的不会被覆盖
        expect(sphSystem.density).toBe(2);
        expect(particle.mass).toBe(2);
    });

    it('刚体声明弹性时拿到独立材质，并注册与世界默认材质的 ContactMaterial（弹性取较大者）', () =>
    {
        const object3D: Object3D = {
            __type__: 'Object3D',
            components: [{ __type__: 'PhysicsWorld' }],
            children: [{
                __type__: 'Object3D',
                components: [
                    { __type__: 'BoxCollider' },
                    { __type__: 'Rigidbody', mass: 1, restitution: 0.9 },
                ],
            }],
        };
        logic(object3D);
        const physicsWorld = object3D.components![0] as PhysicsWorld;
        const physicsWorldLogic = logic(physicsWorld) as PhysicsWorldLogic;
        physicsWorldLogic.update(1000 / 60);

        const rigidbody = object3D.children![0].components![1] as Rigidbody;
        const rigidbodyLogic = logic(rigidbody) as RigidbodyLogic;
        const material = rigidbodyLogic.body.material;

        expect(material).toBeTruthy();
        const contact = physicsWorldLogic.world.getContactMaterial(material!, physicsWorldLogic.world.defaultMaterial);
        expect(contact).toBeTruthy();
        expect(contact!.restitution).toBe(0.9);
    });

    it('同参数的刚体复用同一个材质（不各建一份）', () =>
    {
        const object3D: Object3D = {
            __type__: 'Object3D',
            components: [{ __type__: 'PhysicsWorld' }],
            children: [
                { __type__: 'Object3D', components: [{ __type__: 'BoxCollider' }, { __type__: 'Rigidbody', mass: 1, restitution: 0.5 }] },
                { __type__: 'Object3D', components: [{ __type__: 'BoxCollider' }, { __type__: 'Rigidbody', mass: 1, restitution: 0.5 }] },
            ],
        };
        logic(object3D);
        const physicsWorld = object3D.components![0] as PhysicsWorld;
        const physicsWorldLogic = logic(physicsWorld) as PhysicsWorldLogic;
        physicsWorldLogic.update(1000 / 60);

        const m0 = (logic(object3D.children![0].components![1] as Rigidbody) as RigidbodyLogic).body.material;
        const m1 = (logic(object3D.children![1].components![1] as Rigidbody) as RigidbodyLogic).body.material;

        expect(m0).toBe(m1);
    });

    it('dispose 后 world 里的刚体被移除', () =>
    {
        const object3D = createScene();
        const physicsWorld = object3D.components![0] as PhysicsWorld;
        const physicsWorldLogic = logic(physicsWorld) as PhysicsWorldLogic;

        physicsWorldLogic.update(1000 / 60);
        expect(physicsWorldLogic.world.bodies.length).toBe(1);

        physicsWorldLogic.dispose();
        expect(physicsWorldLogic.world.bodies.length).toBe(0);
    });
});
