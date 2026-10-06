import { reactive } from 'feng3d';
import { createPhysicsDemo } from './PhysicsDemo';
import {
    createBox, createCompound, createConvex, createCylinder, createGroundPlane, createParticle, createSphere,
} from './PhysicsSceneParts';

const demo = createPhysicsDemo(document.getElementById('webgpu') as HTMLCanvasElement);

/**
 * 原版 `createTetra()` 的四面体：四个顶点各偏移 -0.35，四个面固定绕向。
 * feng3d 没有对应的现成几何，所以顶点与面**逐字照搬**原版。
 */
const TETRA_VERTICES = [
    { x: 0, y: 0, z: 0 },
    { x: 2, y: 0, z: 0 },
    { x: 0, y: 2, z: 0 },
    { x: 0, y: 0, z: 2 },
].map((v) => ({ x: v.x - 0.35, y: v.y - 0.35, z: v.z - 0.35 }));

/** 四个面（顶点索引），顺序与原版一致 */
const TETRA_FACES = [[0, 3, 2], [0, 1, 3], [0, 2, 1], [1, 2, 3]];

/**
 * 形状总览示例 —— 1:1 对应 cannon-es 的 `shapes.html`（一幕 `All shapes`）。
 *
 * 原版参数：重力 (0, -30, 0)、solver 迭代 17、接触刚度 1e6、松弛 3；所有刚体质量 1、size 1。
 * 台上摆了 7 样东西：球、两个圆柱（第二个横躺并转了 90°）、盒子、粒子、复合体、四面体凸包。
 */
demo.addScene('All shapes', (world) =>
{
    reactive(world).gravity = { x: 0, y: -30, z: 0 };
    reactive(world).solverIterations = 17;
    reactive(world).contactEquationStiffness = 1e6;
    reactive(world).contactEquationRelaxation = 3;

    const mass = 1;
    const size = 1;

    // 复合体：四个半尺寸盒子（偏移与原版逐个一致）
    const compound = createCompound('Compound', { x: size * 4, y: size + 1, z: size * 4 }, [
        { shape: 'box', offset: { x: 0, y: size, z: 0 }, size: size * 0.5 },
        { shape: 'box', offset: { x: 0, y: 0, z: 0 }, size: size * 0.5 },
        { shape: 'box', offset: { x: 0, y: -size, z: 0 }, size: size * 0.5 },
        { shape: 'box', offset: { x: size, y: -size, z: 0 }, size: size * 0.5 },
    ], { mass, color: { r: 0.75, g: 0.6, b: 0.85 } });

    return [
        createGroundPlane(),
        createSphere('Sphere', { x: -size * 2, y: size + 1, z: size * 2 }, size, { mass }),
        createCylinder('Cylinder', { x: size * 2, y: size + 1, z: size * 2 }, size, size, size * 2, 10, { mass }),
        createCylinder('Cylinder-2', { x: size * 2, y: size * 4 + 1, z: size * 2 }, size, size, size * 2, 10, {
            mass,
            rotation: { x: Math.PI / 2, y: Math.PI / 2, z: 0 },
            color: { r: 0.8, g: 0.8, b: 0.85 },
        }),
        createBox('Box', { x: size * 2, y: size + 1, z: -size * 2 }, { x: size, y: size, z: size }, { mass }),
        createParticle('Particle', { x: size * 2, y: size + 1, z: size * 4 }, { mass }),
        compound,
        createConvex('Tetra', { x: -size * 2, y: size + 1, z: -size * 2 }, TETRA_VERTICES, TETRA_FACES, {
            mass,
            color: { r: 0.6, g: 0.85, b: 0.7 },
        }),
    ];
});
