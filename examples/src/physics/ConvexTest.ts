import { reactive } from 'feng3d';
import type { Object3D } from 'feng3d';
import { createPhysicsDemo } from './PhysicsDemo';
import { createBoxConvex, createCylinder, createConvex, createGroundPlane } from './PhysicsSceneParts';

const demo = createPhysicsDemo(document.getElementById('webgpu') as HTMLCanvasElement);

/** 原版 `createTetra()` 的四面体（顶点偏移 -0.35，四个面固定绕向） */
const TETRA_VERTICES = [
    { x: 0, y: 0, z: 0 },
    { x: 2, y: 0, z: 0 },
    { x: 0, y: 2, z: 0 },
    { x: 0, y: 0, z: 2 },
].map((v) => ({ x: v.x - 0.35, y: v.y - 0.35, z: v.z - 0.35 }));

const TETRA_FACES = [[0, 3, 2], [0, 1, 3], [0, 2, 1], [1, 2, 3]];

/**
 * 凸包示例 —— 1:1 对应 cannon-es 的 `convex.html`（三幕）。
 *
 * 三幕都用重力 (0, -30, 0)、接触刚度 5e6、松弛 3，区别在摆什么、摆多大：
 * - `Various`：立方体凸包 + 四面体 + 圆柱（圆柱在 cannon-es 里本就是凸包）
 * - `Convex on convex`：两个大立方体凸包叠着，看上面的怎么翻下来
 * - `Convex wall`：3×3 一面墙的立方体凸包
 */
demo.addScene('Various', (world) =>
{
    reactive(world).gravity = { x: 0, y: -30, z: 0 };
    reactive(world).contactEquationStiffness = 5e6;
    reactive(world).contactEquationRelaxation = 3;

    const size = 0.5;
    const mass = 10;

    return [
        createGroundPlane(),
        createBoxConvex('BoxConvex', { x: -1, y: size + 1, z: 0 }, size, { mass }),
        createConvex('Tetra', { x: -5, y: size + 1, z: -3 }, TETRA_VERTICES, TETRA_FACES, {
            mass,
            color: { r: 0.6, g: 0.85, b: 0.7 },
        }),
        createCylinder('Cylinder', { x: 0, y: size * 4 + 1, z: 0 }, 0.5, 0.5, 2, 20, {
            mass,
            rotation: { x: 0, y: 0, z: Math.PI / 3 },
            color: { r: 0.5, g: 0.75, b: 0.95 },
        }),
    ];
});

demo.addScene('Convex on convex', (world) =>
{
    reactive(world).gravity = { x: 0, y: -30, z: 0 };
    reactive(world).contactEquationStiffness = 5e6;
    reactive(world).contactEquationRelaxation = 3;

    const size = 2;
    const mass = 10;

    return [
        createGroundPlane(),
        createBoxConvex('BoxConvex-1', { x: 0, y: size + 1, z: 0 }, size, { mass }),
        createBoxConvex('BoxConvex-2', { x: -1.5, y: size * 4 + 1, z: 0 }, size, {
            mass,
            color: { r: 0.9, g: 0.65, b: 0.4 },
        }),
    ];
});

demo.addScene('Convex wall', (world) =>
{
    reactive(world).gravity = { x: 0, y: -30, z: 0 };
    reactive(world).contactEquationStiffness = 5e6;
    reactive(world).contactEquationRelaxation = 3;

    const size = 1;
    const mass = 10;

    const wall: Object3D[] = [];
    for (let i = 0; i < 3; i++)
    {
        for (let j = 0; j < 3; j++)
        {
            wall.push(createBoxConvex('BoxConvex-' + i + '-' + j, {
                x: -(size * 2 * i + 0.01),
                y: size * 2 * j + size * 1.2,
                z: 0,
            }, size, { mass }));
        }
    }

    return [createGroundPlane(), ...wall];
});
