import { reactive } from 'feng3d';
import type { Object3D } from 'feng3d';
import { createPhysicsDemo } from './PhysicsDemo';
import {
    createBox, createBoxConvex, createCompound, createConvex, createCylinder, createGroundPlane, createParticle, createSphere,
} from './PhysicsSceneParts';

const demo = createPhysicsDemo(document.getElementById('webgpu') as HTMLCanvasElement);

/** 原版 stacks.html 的全局常量 */
const SIZE = 2;
const MASS = 5;

/**
 * 原版 `createTetra()`：顶点各偏移 -0.35 的四面体（与 `shapes.html` 用的是同一个）。
 *
 * > 原版有幕写成 `createTetra(size)`，但函数签名不收参数——这个参数其实被忽略了。
 * > 这里保持一致：入参不参与计算。
 */
const TETRA_VERTICES = [
    { x: 0, y: 0, z: 0 },
    { x: 2, y: 0, z: 0 },
    { x: 0, y: 2, z: 0 },
    { x: 0, y: 0, z: 2 },
].map((v) => ({ x: v.x - 0.35, y: v.y - 0.35, z: v.z - 0.35 }));

const TETRA_FACES = [[0, 3, 2], [0, 1, 3], [0, 2, 1], [1, 2, 3]];

/** 原版 `createCompound(mass)`：四个半尺寸盒子拼成的复合体 */
function createStackCompound(mass: number): Object3D
{
    return createCompound('Compound', { x: 0, y: 0, z: 0 }, [
        { shape: 'box', offset: { x: 0, y: SIZE, z: 0 }, size: SIZE * 0.5 },
        { shape: 'box', offset: { x: 0, y: 0, z: 0 }, size: SIZE * 0.5 },
        { shape: 'box', offset: { x: 0, y: -SIZE, z: 0 }, size: SIZE * 0.5 },
        { shape: 'box', offset: { x: SIZE, y: -SIZE, z: 0 }, size: SIZE * 0.5 },
    ], { mass, color: { r: 0.75, g: 0.6, b: 0.85 } });
}

/**
 * 堆叠调试矩阵 —— 1:1 对应 cannon-es 的 `stacks.html`（**26 幕**）。
 *
 * 这是作者用来"两两组合地排查形状对"的调试场：九种形状（球 / 盒 / 复合体 / 凸包四面体 / 圆柱 / 粒子）
 * 两两配对，共 26 种组合，每一幕都把两个形状叠在一起看它们怎么落、怎么滑、怎么翻。
 *
 * 全局照搬原版：`size = 2`、`mass = 5`；世界重力 **-10**、solver 迭代 **20**、
 * 接触刚度 **1e7**、松弛 **5**，而且地面**下移到 y = -1**（不是 0）。
 *
 * 幕名就用原版的 `形状/形状` 写法（左 = 上面那个，右 = 下面那个，与原版一致）。
 */
function addStackScene(title: string, build: () => Object3D[])
{
    demo.addScene(title, (world) =>
    {
        reactive(world).gravity = { x: 0, y: -10, z: 0 };
        reactive(world).solverIterations = 20;
        reactive(world).contactEquationStiffness = 1e7;
        reactive(world).contactEquationRelaxation = 5;

        // 原版地面在 y = -1
        const ground = createGroundPlane();
        (ground as { position?: unknown }).position = { x: 0, y: -1, z: 0 };

        return [ground, ...build()];
    });
}

// ---- 球在下 ----
addStackScene('sphere/sphere', () => [
    createSphere('Sphere-1', { x: 0, y: SIZE * 3, z: 0 }, SIZE, { mass: MASS }),
    createSphere('Sphere-2', { x: 0, y: SIZE, z: 0 }, SIZE, { mass: MASS }),
]);

addStackScene('sphere/plane', () => [
    createSphere('Sphere', { x: 0, y: SIZE * 3, z: 0 }, SIZE, { mass: MASS }),
]);

addStackScene('sphere/box', () => [
    createBox('Box', { x: 0, y: SIZE, z: 0 }, { x: SIZE, y: SIZE, z: SIZE }, { mass: MASS }),
    createSphere('Sphere', { x: 0, y: SIZE * 3, z: 0 }, SIZE, { mass: MASS }),
]);

addStackScene('sphere/compound', () => [
    createSphere('Sphere', { x: SIZE, y: SIZE * 6, z: 0 }, SIZE * 0.5, { mass: MASS }),
    (() => { const c = createStackCompound(MASS); (c as { position?: unknown }).position = { x: 0, y: SIZE * 3, z: 0 }; return c; })(),
]);

addStackScene('sphere/convex', () => [
    createSphere('Sphere', { x: 0, y: SIZE * 6, z: 0 }, SIZE * 0.5, { mass: MASS }),
    createConvex('Tetra', { x: 0, y: SIZE, z: 0 }, TETRA_VERTICES, TETRA_FACES, { mass: MASS, color: { r: 0.6, g: 0.85, b: 0.7 } }),
]);

addStackScene('sphere/cylinder', () => [
    createSphere('Sphere', { x: 0, y: SIZE * 6, z: 0 }, SIZE * 0.5, { mass: MASS }),
    createCylinder('Cylinder', { x: 0, y: SIZE * 3, z: 0 }, SIZE, SIZE, SIZE * 2, 10, { mass: MASS }),
]);

addStackScene('sphere/particle', () => [
    createSphere('Sphere', { x: 0, y: SIZE, z: 0 }, SIZE * 0.5, { mass: MASS }),
    createParticle('Particle', { x: -0.02, y: SIZE * 3, z: 0 }, { mass: 1 }),
]);

// ---- 平面/单形状落体 ----
addStackScene('plane/box', () => [
    createBox('Box', { x: 0, y: SIZE, z: 0 }, { x: SIZE, y: SIZE, z: SIZE }, { mass: MASS }),
]);

addStackScene('plane/compound', () => [
    (() => { const c = createStackCompound(5); (c as { position?: unknown }).position = { x: 0, y: SIZE * 4, z: 0 }; return c; })(),
]);

addStackScene('plane/convex', () => [
    createConvex('Tetra', { x: 0, y: SIZE, z: 0 }, TETRA_VERTICES, TETRA_FACES, { mass: MASS, color: { r: 0.6, g: 0.85, b: 0.7 } }),
]);

addStackScene('plane/cylinder', () => [
    createCylinder('Cylinder', { x: 0, y: SIZE * 3, z: 0 }, SIZE, SIZE, SIZE * 2, 10, { mass: MASS }),
]);

addStackScene('plane/particle', () => [
    createParticle('Particle', { x: -0.02, y: SIZE * 3, z: 0 }, { mass: 1 }),
]);

// ---- 盒在下 ----
addStackScene('box/box', () => [
    createBox('Box-1', { x: 0, y: SIZE, z: 0 }, { x: SIZE * 0.5, y: SIZE * 0.5, z: SIZE * 0.5 }, { mass: MASS }),
    createBox('Box-2', { x: -SIZE * 0.5, y: SIZE * 3, z: 0 }, { x: SIZE * 0.5, y: SIZE * 0.5, z: SIZE * 0.5 }, { mass: MASS }),
]);

addStackScene('box/compound', () => [
    (() => { const c = createStackCompound(5); (c as { position?: unknown }).position = { x: -SIZE * 0.5, y: SIZE * 2, z: 0 }; return c; })(),
    createBox('Box', { x: 0, y: SIZE * 7, z: 0 }, { x: SIZE * 0.5, y: SIZE * 0.5, z: SIZE * 0.5 }, { mass: MASS }),
]);

addStackScene('box/convex', () => [
    createBox('Box', { x: 0, y: SIZE * 2, z: 0 }, { x: SIZE * 0.5, y: SIZE * 0.5, z: SIZE * 0.5 }, { mass: MASS }),
    createConvex('Tetra', { x: 0, y: SIZE * 5, z: 0 }, TETRA_VERTICES, TETRA_FACES, { mass: MASS, color: { r: 0.6, g: 0.85, b: 0.7 } }),
]);

addStackScene('box/cylinder', () => [
    createBox('Box', { x: 0, y: SIZE * 5, z: 0 }, { x: SIZE * 0.5, y: SIZE * 0.5, z: SIZE * 0.5 }, { mass: MASS }),
    createCylinder('Cylinder', { x: 0, y: SIZE * 2, z: 0 }, SIZE, SIZE, SIZE * 2, 10, { mass: MASS }),
]);

addStackScene('box/particle', () => [
    createBox('Box', { x: 0, y: SIZE, z: 0 }, { x: SIZE * 0.5, y: SIZE * 0.5, z: SIZE * 0.5 }, { mass: MASS }),
    createParticle('Particle', { x: 0, y: SIZE * 3, z: 0 }, { mass: 1 }),
]);

// ---- 复合体在下 ----
addStackScene('compound/compound', () => [
    (() => { const c = createStackCompound(5); (c as { position?: unknown }).position = { x: -SIZE * 0.5, y: SIZE * 6, z: 0 }; return c; })(),
    (() => { const c = createStackCompound(5); (c as { position?: unknown }).position = { x: -SIZE * 0.5, y: SIZE * 2, z: 0 }; return c; })(),
]);

addStackScene('compound/convex', () => [
    createConvex('Tetra', { x: 0, y: SIZE * 3, z: 0 }, TETRA_VERTICES, TETRA_FACES, { mass: MASS, color: { r: 0.6, g: 0.85, b: 0.7 } }),
    (() => { const c = createStackCompound(5); (c as { position?: unknown }).position = { x: 0, y: SIZE, z: 0 }; return c; })(),
]);

addStackScene('compound/cylinder', () => [
    createCylinder('Cylinder', { x: 0, y: SIZE * 5, z: 0 }, SIZE, SIZE, SIZE * 2, 10, { mass: MASS }),
    (() => { const c = createStackCompound(5); (c as { position?: unknown }).position = { x: 0, y: SIZE, z: 0 }; return c; })(),
]);

addStackScene('compound/particle', () => [
    (() => { const c = createStackCompound(5); (c as { position?: unknown }).position = { x: 0, y: SIZE * 4, z: 0 }; return c; })(),
    createParticle('Particle', { x: 0, y: SIZE * 7, z: 0 }, { mass: 1 }),
]);

// ---- 凸包在下 ----
addStackScene('convex/convex', () => [
    createConvex('Tetra', { x: -0.1, y: SIZE * 5, z: 0.1 }, TETRA_VERTICES, TETRA_FACES, { mass: MASS, color: { r: 0.6, g: 0.85, b: 0.7 } }),
    createBoxConvex('BoxConvex', { x: 0, y: SIZE * 3, z: 0 }, SIZE, { mass: MASS }),
]);

addStackScene('convex/cylinder', () => [
    createConvex('Tetra', { x: -0.1, y: SIZE * 5, z: 0.1 }, TETRA_VERTICES, TETRA_FACES, { mass: MASS, color: { r: 0.6, g: 0.85, b: 0.7 } }),
    createCylinder('Cylinder', { x: 0, y: SIZE * 2, z: 0 }, SIZE, SIZE, SIZE * 2, 10, { mass: MASS }),
]);

addStackScene('convex/particle', () => [
    createConvex('Tetra', { x: 0, y: SIZE, z: 0 }, TETRA_VERTICES, TETRA_FACES, { mass: MASS, color: { r: 0.6, g: 0.85, b: 0.7 } }),
    createParticle('Particle', { x: 0, y: SIZE * 3, z: 0 }, { mass: 1 }),
]);

// ---- 圆柱在下 ----
addStackScene('cylinder/cylinder', () => [
    createCylinder('Cylinder-1', { x: 0, y: SIZE * 3, z: 0 }, SIZE, SIZE, SIZE * 2, 10, { mass: MASS }),
    // 上面那个圆柱**横躺**（绕 X 转 -90°）
    createCylinder('Cylinder-2', { x: 0, y: SIZE * 6, z: 0 }, SIZE, SIZE, SIZE * 2, 10, {
        mass: MASS,
        rotation: { x: -Math.PI / 2, y: 0, z: 0 },
        color: { r: 0.5, g: 0.75, b: 0.95 },
    }),
]);

addStackScene('cylinder/particle', () => [
    createCylinder('Cylinder', { x: 0, y: SIZE * 2, z: 0 }, SIZE, SIZE, SIZE * 2, 10, { mass: MASS }),
    createParticle('Particle', { x: 0, y: SIZE * 4, z: 0 }, { mass: 1 }),
]);
