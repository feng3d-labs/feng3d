import { reactive } from 'feng3d';
import { createPhysicsDemo } from './PhysicsDemo';
import { createBox, createCylinder, createSphere } from './PhysicsSceneParts';

const demo = createPhysicsDemo(document.getElementById('webgpu') as HTMLCanvasElement);

/**
 * 碰撞过滤示例 —— 1:1 对应 cannon-es 的 `collision_filter.html`。
 *
 * 原版用**位掩码**控制谁和谁碰：
 * `(A.group & B.mask) && (B.group & A.mask)` 都为真时才允许接触，判断发生在 broadphase。
 *
 * 场景（**无重力**、solver 迭代 5、也没有地面）：
 * - **球**：r=1、group 1、mask 2|3，放在 (-5,0,0) 并给初速度 (5,0,0) —— 它水平射向另外两个
 * - **盒**：半边长 1、group 2、mask 1，就在原点
 * - **圆柱**：r=1/h=2.2/10 段、group 3、mask 1，放在 (5,0,0)
 *
 * 于是球会**穿过**盒与圆柱继续飞（它们彼此不允许碰撞），
 * 而盒与圆柱之间也不碰（group 2 的 mask 只有 1，group 4 的 mask 也只有 1）。
 */
demo.addScene('Collision filter', (world) =>
{
    reactive(world).gravity = { x: 0, y: 0, z: 0 };
    reactive(world).solverIterations = 5;

    // 分组必须是 2 的幂
    const GROUP1 = 1;
    const GROUP2 = 2;
    const GROUP3 = 4;
    const size = 1;
    const mass = 1;

    return [
        createSphere('Sphere', { x: -5, y: 0, z: 0 }, size, {
            mass,
            velocity: { x: 5, y: 0, z: 0 },
            collisionFilterGroup: GROUP1,
            collisionFilterMask: GROUP2 | GROUP3,
            color: { r: 0.9, g: 0.6, b: 0.35 },
        }),
        createBox('Box', { x: 0, y: 0, z: 0 }, { x: size, y: size, z: size }, {
            mass,
            collisionFilterGroup: GROUP2,
            collisionFilterMask: GROUP1,
            color: { r: 0.5, g: 0.75, b: 0.95 },
        }),
        createCylinder('Cylinder', { x: 5, y: 0, z: 0 }, size, size, size * 2.2, 10, {
            mass,
            collisionFilterGroup: GROUP3,
            collisionFilterMask: GROUP1,
            color: { r: 0.6, g: 0.85, b: 0.6 },
        }),
    ];
});
