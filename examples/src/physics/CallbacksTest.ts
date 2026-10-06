import { logic, reactive, ticker } from 'feng3d';
import type { Rigidbody, RigidbodyLogic } from '@feng3d/cannon-plugin';
import { createPhysicsDemo } from './PhysicsDemo';
import { createSphere } from './PhysicsSceneParts';

const demo = createPhysicsDemo(document.getElementById('webgpu') as HTMLCanvasElement);

/**
 * 回调示例 —— 1:1 对应 cannon-es 的 `callbacks.html`（一幕 `Moon`）。
 *
 * 原版用 world 的 `preStep` 回调**每帧**给月亮施加一个指向行星的引力
 * （`F = 1500 / d²`，方向从月亮指向行星原点），于是月亮绕着行星转。
 *
 * 这里用 `ticker.onframe` 做同一件事——因为 feng3d 的物理步进是由渲染帧驱动的，
 * 每帧施加一次力与 cannon-es 的 preStep 语义一致（applyForce 每步后都会被清零，所以必须每帧给）。
 *
 * 场景（**无重力**）：
 * - 月亮：r=0.5、mass 5、在 (-5,0,0)、初速度 (0,8,0)、阻尼 0
 * - 行星：r=3.5、mass 0（静态）、在原点
 */
demo.addScene('Moon', (world) =>
{
    reactive(world).gravity = { x: 0, y: 0, z: 0 };

    const moon = createSphere('Moon', { x: -5, y: 0, z: 0 }, 0.5, {
        mass: 5,
        velocity: { x: 0, y: 8, z: 0 },
        linearDamping: 0,
        color: { r: 0.85, g: 0.85, b: 0.8 },
    });
    const planet = createSphere('Planet', { x: 0, y: 0, z: 0 }, 3.5, {
        mass: 0,
        color: { r: 0.45, g: 0.6, b: 0.85 },
    });

    // 取月亮**刚体组件**的 logic
    const moonLogic = logic(moon.components![2] as Rigidbody) as RigidbodyLogic | null;
    const sceneIndex = demo.settings.scene;

    ticker.onframe(() =>
    {
        // 切到别的场景后就不再施力（原版每幕各有自己的 world，天然隔离）
        if (demo.settings.scene !== sceneIndex || moonLogic === null) return;

        const p = moonLogic.body.position;
        // 从月亮指向行星原点
        const dx = -p.x;
        const dy = -p.y;
        const dz = -p.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (distance === 0) return;

        const k = 1500 / (distance * distance);
        moonLogic.applyForce({ x: (dx / distance) * k, y: (dy / distance) * k, z: (dz / distance) * k });
    });

    return [moon, planet];
});
