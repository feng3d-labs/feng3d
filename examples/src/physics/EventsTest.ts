import { reactive } from 'feng3d';
import { createPhysicsDemo } from './PhysicsDemo';
import { createGroundPlane, createSphere } from './PhysicsSceneParts';

const demo = createPhysicsDemo(document.getElementById('webgpu') as HTMLCanvasElement);

/**
 * 事件示例 —— 1:1 对应 cannon-es 的 `events.html`（一幕 `'collide' event`）。
 *
 * 原版场景：
 * - 重力 (0, -20, 0)，接触刚度 5e7、松弛 4，静态地面 Plane
 * - 一个 **mass 30** 的球（r=1）从 (0, 6, 0) 掉下来
 * - 球上监听 `collide` 事件，撞到地面时把"撞到了哪个刚体、接触是什么"打到控制台
 *
 * 这里用 `PhysicsWorldLogic.onCollide` 接（它把 cannon-es 的 beginContact 转成带 Object3D 的载荷）。
 */
demo.addScene("'collide' event", (world) =>
{
    reactive(world).gravity = { x: 0, y: -20, z: 0 };
    reactive(world).contactEquationStiffness = 5e7;
    reactive(world).contactEquationRelaxation = 4;

    return [
        createGroundPlane(),
        createSphere('Sphere', { x: 0, y: 6, z: 0 }, 1, {
            mass: 30,
            color: { r: 0.9, g: 0.6, b: 0.35 },
        }),
    ];
});
