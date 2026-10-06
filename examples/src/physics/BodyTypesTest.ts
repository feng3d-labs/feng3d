import { reactive } from 'feng3d';
import type { Object3D } from 'feng3d';
import { createPhysicsDemo } from './PhysicsDemo';
import { createBox, createGroundPlane, createSphere } from './PhysicsSceneParts';

const demo = createPhysicsDemo(document.getElementById('webgpu') as HTMLCanvasElement);

/**
 * 刚体类型示例 —— 1:1 对应 cannon-es 的 `body_types.html`。
 *
 * 原版场景（只有一幕 `Moving box`）：
 * - 重力 (0, -40, 0)，接触刚度 1e8，地面 Plane
 * - 一个 **KINEMATIC** 盒子：半边长 2（4×4×4）、质量 0、初速度 (0, 5, 0)，
 *   并且`每 1 秒把速度方向翻转一次`——它自己不受力，靠速度上下平移，把动态球顶来顶去
 * - 一个 **dynamic** 球：半径 2、质量 5，从 (0, 6, 0) 落下
 */
demo.addScene('Moving box', (world) =>
{
    reactive(world).gravity = { x: 0, y: -40, z: 0 };
    reactive(world).contactEquationStiffness = 1e8;

    const kinematicBox = createBox('KinematicBox', { x: 0, y: 1, z: 0 }, { x: 2, y: 2, z: 2 }, {
        mass: 0,
        type: 'kinematic',
        velocity: { x: 0, y: 5, z: 0 },
        color: { r: 0.45, g: 0.6, b: 0.9 },
    });

    // 原版就是每秒翻转一次速度方向（y 上 / y 下）
    let upward = false;
    setInterval(() =>
    {
        upward = !upward;
        const writable = reactive(kinematicBox) as unknown as { velocity: { x: number; y: number; z: number } };
        writable.velocity = { x: 0, y: upward ? 5 : -5, z: 0 };
    }, 1000);

    const sphere = createSphere('Sphere', { x: 0, y: 6, z: 0 }, 2, { mass: 5, color: { r: 0.9, g: 0.6, b: 0.35 } });

    return [createGroundPlane(), kinematicBox, sphere] as Object3D[];
});
