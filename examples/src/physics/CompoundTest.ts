import { reactive } from 'feng3d';
import { createPhysicsDemo } from './PhysicsDemo';
import { createCompound, createGroundPlane } from './PhysicsSceneParts';

const demo = createPhysicsDemo(document.getElementById('webgpu') as HTMLCanvasElement);

/**
 * 复合形状示例 —— 1:1 对应 cannon-es 的 `compound.html`（两幕）。
 *
 * 复合形状 = 一个刚体上挂多个子形状（各自带位置偏移）。原版用它在 `Boxes` 里
 * 拼出一个"十字"、在 `Spheres` 里拼出四个球组成的方块。
 *
 * 两幕的重力都是 (0, -30, 0)、质量都是 10、出生点都是 (0, 6, 0)，
 * 区别是初始姿态反了一点点（Boxes 绕 Z +0.03π、Spheres 绕 Z -0.03π），
 * 好让它们落地时朝不同方向倒。
 */
demo.addScene('Boxes', (world) =>
{
    reactive(world).gravity = { x: 0, y: -30, z: 0 };

    const size = 1.5;

    // 原版的七个偏移（注意两侧是对称的，中间一横一竖）
    const offsets = [
        { x: -size, y: -size, z: 0 },
        { x: -size, y: size, z: 0 },
        { x: size, y: -size, z: 0 },
        { x: size, y: size, z: 0 },
        { x: size, y: 0, z: 0 },
        { x: 0, y: -size, z: 0 },
        { x: 0, y: size, z: 0 },
    ];

    const body = createCompound('CompoundBoxes', { x: 0, y: 6, z: 0 }, offsets.map((offset) => ({
        shape: 'box' as const,
        offset,
        size: size * 0.5,
    })), {
        mass: 10,
        rotation: { x: 0, y: 0, z: Math.PI * 0.03 },
        color: { r: 0.9, g: 0.65, b: 0.4 },
    });

    return [createGroundPlane(), body];
});

demo.addScene('Spheres', (world) =>
{
    reactive(world).gravity = { x: 0, y: -30, z: 0 };

    const offsets = [
        { x: -1, y: -1, z: 0 },
        { x: -1, y: 1, z: 0 },
        { x: 1, y: -1, z: 0 },
        { x: 1, y: 1, z: 0 },
    ];

    const body = createCompound('CompoundSpheres', { x: 0, y: 6, z: 0 }, offsets.map((offset) => ({
        shape: 'sphere' as const,
        offset,
        size: 1,
    })), {
        mass: 10,
        rotation: { x: 0, y: 0, z: -Math.PI * 0.03 },
        color: { r: 0.5, g: 0.75, b: 0.95 },
    });

    return [createGroundPlane(), body];
});
