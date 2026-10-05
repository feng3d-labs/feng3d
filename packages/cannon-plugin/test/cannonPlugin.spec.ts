// 副作用导入：各碰撞体 / 刚体 / 物理世界都是纯数据类型，只用作类型标注的 import
// 会被转译器整条擦除，于是 registerLogic 不执行、logic() 返回 null（与 ui 包测试同款坑）。
import 'feng3d';
import { Object3D } from 'feng3d';
import { logic } from '@feng3d/reactivity';
import { Box, Cylinder, Plane, Sphere } from 'cannon-es';
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
