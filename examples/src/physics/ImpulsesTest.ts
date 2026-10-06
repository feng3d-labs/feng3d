import { logic, reactive } from 'feng3d';
import type { Rigidbody, RigidbodyLogic } from '@feng3d/cannon-plugin';
import { createPhysicsDemo } from './PhysicsDemo';
import { createSphere } from './PhysicsSceneParts';

const demo = createPhysicsDemo(document.getElementById('webgpu') as HTMLCanvasElement);

/** 原版 impulses.html 的全局常量 */
const RADIUS = 1;
const MASS = 2;
const STRENGTH = 500;
const DT = 1 / 60;
const DAMPING = 0.5;

/** 球顶（相对球心）——"Top" 系列都用它当施力点 */
const TOP_POINT = { x: 0, y: RADIUS, z: 0 };

/**
 * 冲量 / 力示例 —— 1:1 对应 cannon-es 的 `impulses.html`（**六幕**）。
 *
 * 六幕全是"一个半径为 1、质量 2、阻尼 0.5 的球"，只有**施加方式**不同——
 * 原版就是想让人看清"作用点不同、力和冲量不同"带来的差别：
 *
 * | 幕 | 施加方式 | 效果 |
 * |---|---|---|
 * | `Center impulse` | `applyImpulse`（质心） | 只平动 |
 * | `Top impulse` | `applyImpulse`（球顶） | 平动 + 自转 |
 * | `Center force` | `applyForce`（质心） | 只平动，且**只作用一步** |
 * | `Top force` | `applyForce`（球顶） | 平动 + 力矩 |
 * | `Local force` | `applyLocalForce`（局部球顶） | 球被绕 Z 转了 180°，"局部顶"在世界上是底部 |
 * | `Torque` | `applyTorque` | 纯自转 |
 *
 * 冲量是 `strength × dt`（= 力作用一帧的等效），所以"Center impulse"与"Center force"初始速度相同。
 * 注意前五幕都是**在创建时施加一次**——cannon-es 每步后会把 force 清零，所以"力"只影响一步。
 *
 * @param title 幕名
 * @param apply 施加方式
 * @param rotation 初始姿态（只有 Local force 幕需要）
 */
function addImpulseScene(title: string, apply: (rigidbodyLogic: RigidbodyLogic) => void, rotation?: { x: number; y: number; z: number })
{
    demo.addScene(title, (world) =>
    {
        // 原版 setupWorld 没有设重力，用的是 cannon-es 的默认值
        reactive(world).gravity = { x: 0, y: -9.82, z: 0 };

        const sphere = createSphere('Sphere', { x: 0, y: 0, z: 0 }, RADIUS, {
            mass: MASS,
            linearDamping: DAMPING,
            angularDamping: DAMPING,
            rotation,
            color: { r: 0.85, g: 0.8, b: 0.75 },
        });

        const rigidbodyLogic = logic(sphere.components![2] as Rigidbody) as RigidbodyLogic;
        apply(rigidbodyLogic);

        return [sphere];
    });
}

addImpulseScene('Center impulse', (l) => l.applyImpulse({ x: -STRENGTH * DT, y: 0, z: 0 }));
addImpulseScene('Top impulse', (l) => l.applyImpulse({ x: -STRENGTH * DT, y: 0, z: 0 }, TOP_POINT));
addImpulseScene('Center force', (l) => l.applyForce({ x: -STRENGTH, y: 0, z: 0 }));
addImpulseScene('Top force', (l) => l.applyForce({ x: -STRENGTH, y: 0, z: 0 }, TOP_POINT));
addImpulseScene('Local force', (l) => l.applyLocalForce({ x: -STRENGTH, y: 0, z: 0 }, TOP_POINT), { x: 0, y: 0, z: Math.PI });
addImpulseScene('Torque', (l) => l.applyTorque({ x: 0, y: 0, z: STRENGTH }));
