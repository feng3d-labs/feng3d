import { reactive } from 'feng3d';
import type { Object3D } from 'feng3d';
import { createPhysicsDemo } from './PhysicsDemo';
import { createBox, createGroundPlane, createSphere } from './PhysicsSceneParts';

const demo = createPhysicsDemo(document.getElementById('webgpu') as HTMLCanvasElement);

/**
 * 堆积示例 —— 1:1 对应 cannon-es 的 `pile.html`（一幕 `Pile`）。
 *
 * 原版场景：一个 10×10 的容器（地面 + 四面墙，墙在 ±5），**每 100ms 从上方扔一个球**，
 * 最多同时保留 80 个——球越堆越高，最后稳定成一座圆锥形的堆。
 *
 * 参数逐条对齐原版（这几项是 80 个球堆叠不抖、不穿的必要条件）：
 * - 重力 **-50**（不是地球重力，原版为了让球压得实、演示更快）
 * - 求解器迭代 **5**、接触刚度 **5e6**、松弛时间 **10**
 * - 快速四元数归一化、每 **3** 步归一化一次
 * - 球半径 **1**、质量 **5**，出生点 `(-2·sin i, 14, 2·cos i)`（绕着中心落下）
 *
 * > 这是**动态场景**：球是在运行期加的，走脚手架的 `addChild` / `removeChild`
 * > （对应原版直接 `world.addBody` + `demo.addVisual`）。静态场景直接返回子树即可。
 */
demo.addScene('Pile', (world, context) =>
{
    reactive(world).gravity = { x: 0, y: -50, z: 0 };
    reactive(world).solverIterations = 5;
    reactive(world).contactEquationStiffness = 5e6;
    reactive(world).contactEquationRelaxation = 10;
    reactive(world).quatNormalizeFast = true;
    reactive(world).quatNormalizeSkip = 3;

    const containerSize = 5;
    const wallThickness = 0.4;
    const wallHeight = 6;
    const wallColor = { r: 0.22, g: 0.24, b: 0.29 };

    const walls = [
        createBox('Wall-Xmin', { x: -containerSize, y: wallHeight / 2, z: 0 }, { x: wallThickness / 2, y: wallHeight / 2, z: containerSize }, { mass: 0, color: wallColor }),
        createBox('Wall-Xmax', { x: containerSize, y: wallHeight / 2, z: 0 }, { x: wallThickness / 2, y: wallHeight / 2, z: containerSize }, { mass: 0, color: wallColor }),
        createBox('Wall-Zmin', { x: 0, y: wallHeight / 2, z: -containerSize }, { x: containerSize, y: wallHeight / 2, z: wallThickness / 2 }, { mass: 0, color: wallColor }),
        createBox('Wall-Zmax', { x: 0, y: wallHeight / 2, z: containerSize }, { x: containerSize, y: wallHeight / 2, z: wallThickness / 2 }, { mass: 0, color: wallColor }),
    ];

    // 每 100ms 扔一个球，超过 80 个就移除最早的（与原版一致）
    const spawned: Object3D[] = [];
    const sceneIndex = demo.settings.scene;
    let spawnIndex = 0;
    setInterval(() =>
    {
        // 切到别的场景后就不再往里扔（原版每幕各有独立的 world）
        if (demo.settings.scene !== sceneIndex) return;

        spawnIndex++;
        const ball = createSphere('Ball-' + spawnIndex, {
            x: -2 * Math.sin(spawnIndex),
            y: 14,
            z: 2 * Math.cos(spawnIndex),
        }, 1, { mass: 5 });

        context.addChild(ball);
        spawned.push(ball);

        if (spawned.length > 80) context.removeChild(spawned.shift()!);
    }, 100);

    return [createGroundPlane(), ...walls];
});
