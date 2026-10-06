import { logic, reactive } from 'feng3d';
import type { Rigidbody, RigidbodyLogic } from '@feng3d/cannon-plugin';
import { createPhysicsDemo } from './PhysicsDemo';
import { createBox, createSphere } from './PhysicsSceneParts';

const demo = createPhysicsDemo(document.getElementById('webgpu') as HTMLCanvasElement);

/**
 * 触发器示例 —— 1:1 对应 cannon-es 的 `trigger.html`。
 *
 * 原版场景（**无重力**）：
 * - 球：r=1、mass 1，放在 (-5,0,0)，然后施加一个**带偏移的冲量** `applyImpulse((5.5,0,0), (0,1,0))`
 *   —— 施力点在球顶，所以球一边向前冲一边自转；阻尼 0.3 / 0.3 让它慢慢停下来
 * - 触发器：Box(半边长 2,2,5) 且 `isTrigger: true`，放在 (5,1,0)——**不挡球**，但照样报告接触
 *
 * 两个事件：进入时触发器的 `collide`（= 这里的 `onCollide`），
 * 离开时 world 的 `endContact`（= 这里的 `onEndCollide`）。
 * 示例里把结果打到控制台（与原版一致）。
 */
demo.addScene('Trigger', (world) =>
{
    reactive(world).gravity = { x: 0, y: 0, z: 0 };

    const radius = 1;

    const sphere = createSphere('Sphere', { x: -5, y: 0, z: 0 }, radius, {
        mass: 1,
        linearDamping: 0.3,
        angularDamping: 0.3,
        color: { r: 0.9, g: 0.6, b: 0.35 },
    });
    const trigger = createBox('Trigger', { x: 5, y: radius, z: 0 }, { x: 2, y: 2, z: 5 }, {
        mass: 0,
        isTrigger: true,
        color: { r: 0.5, g: 0.75, b: 0.95 },
    });

    // 原版给的是带偏移的冲量：(5.5,0,0) 作用在球顶 (0,radius,0) —— 于是球会自转
    // 取的是球**刚体组件**的 logic（createSphere 的组件顺序：[MeshRenderer, SphereCollider, Rigidbody]）
    const sphereLogic = logic(sphere.components![2] as Rigidbody) as RigidbodyLogic | null;
    sphereLogic?.applyImpulse({ x: 5.5, y: 0, z: 0 }, { x: 0, y: radius, z: 0 });

    return [sphere, trigger];
});
