import { reactive } from 'feng3d';
import { createPhysicsDemo } from './PhysicsDemo';
import { createBox, createGroundPlane } from './PhysicsSceneParts';

const demo = createPhysicsDemo(document.getElementById('webgpu') as HTMLCanvasElement);

/**
 * 固定旋转示例 —— 1:1 对应 cannon-es 的 `fixed_rotation.html`。
 *
 * 原版场景：
 * - 地面 Plane，重力 (0, -10, 0)
 * - 两个半边长 1 的盒子（即 2×2×2），质量 1，**都开了 fixedRotation**
 * - 第一个在 (0, 1, 0)（正好贴地），第二个在 (-1.5, 4, 0) 落下
 *
 * 开 fixedRotation 后它们只平动、不翻滚，所以会稳稳地落下来停住。
 */
demo.addScene('Fixed rotation', (world) =>
{
    reactive(world).gravity = { x: 0, y: -10, z: 0 };

    return [
        createGroundPlane(),
        createBox('Box-1', { x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 1 }, { mass: 1, fixedRotation: true }),
        createBox('Box-2', { x: -1.5, y: 4, z: 0 }, { x: 1, y: 1, z: 1 }, { mass: 1, fixedRotation: true }),
    ];
});
