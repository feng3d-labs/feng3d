import { reactive } from 'feng3d';
import { createPhysicsDemo } from './PhysicsDemo';
import { createBox, createSphere } from './PhysicsSceneParts';

const demo = createPhysicsDemo(document.getElementById('webgpu') as HTMLCanvasElement);

/**
 * 弹簧示例 —— 1:1 对应 cannon-es 的 `spring.html`（一幕 `Flat box`）。
 *
 * 原版场景：
 * - 重力 (0, -10, 0)，**没有地面**
 * - 一个**静态**小球（半径 0.1，就在原点）
 * - 一个扁盒子：半边长 (1, 1, 0.3)、质量 5、位置 (1, -1, 0)
 * - 一根弹簧连着它们：A 端锚点在盒子局部 (-1, 1, 0)、B 端在小球中心，
 *   `restLength 0 / stiffness 50 / damping 1`
 *
 * 盒子会被弹簧拉住、绕着小球荡——因为静止长度是 0，它总想回到球心。
 */
demo.addScene('Flat box', (world) =>
{
    reactive(world).gravity = { x: 0, y: -10, z: 0 };

    const size = 1;

    const sphere = createSphere('StaticSphere', { x: 0, y: 0, z: 0 }, 0.1, {
        mass: 0,
        color: { r: 0.9, g: 0.6, b: 0.35 },
    });

    const box = createBox('Box', { x: size, y: -size, z: 0 }, { x: size, y: size, z: size * 0.3 }, {
        mass: 5,
        color: { r: 0.5, g: 0.75, b: 0.95 },
    });

    // 弹簧挂在盒子上，另一头按名字指向静态球
    (box.components as unknown[]).push({
        __type__: 'Spring',
        targetName: 'StaticSphere',
        localAnchorA: { x: -size, y: size, z: 0 },
        localAnchorB: { x: 0, y: 0, z: 0 },
        restLength: 0,
        stiffness: 50,
        damping: 1,
    });

    return [sphere, box];
});
