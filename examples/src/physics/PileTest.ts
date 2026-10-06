import { WebGPU } from '@feng3d/webgpu';
import { logic, reactive, ticker } from 'feng3d';
import type { Object3D, View } from 'feng3d';
import '@feng3d/cannon-plugin';

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init(); // 初始化 WebGPU

/**
 * 堆积示例（对应 cannon-es 的 `pile.html`）。
 *
 * 复刻原版场景：一个 10×10 的容器（地面 + 四面墙），**每 100ms 从上方扔一个球**进去，
 * 最多同时保留 80 个——球越堆越高，最后稳定成一座圆锥形的堆。
 *
 * 与原版一致的参数（这几项是 80 个球堆叠不抖、不穿的必要条件，逐条对齐了原版）：
 * - 重力 **-50**（不是地球重力——原版为了让球压得实、演示更快）
 * - 求解器迭代 5 次、接触刚度 5e6、松弛时间 10
 * - 快速四元数归一化、每 3 步归一化一次
 * - 球半径 1、质量 5，出生点 (-2·sin i, 14, 2·cos i)，即绕着中心下落
 *
 * 「运行时持续创建对象」走的是 children 的写入路径（Container 的 push/splice 就是为此设计的）：
 * 新球 `reactive(view.root).children.push(ball)`，超出上限的老球从 children 里 splice 掉。
 * 这也是本示例与其它示例最大的不同——它是**动态场景**，不是一次性摆好的。
 */
const CONTAINER_SIZE = 5;
const BALL_RADIUS = 1;
const BALL_MASS = 5;
const MAX_BALLS = 80;
const SPAWN_INTERVAL = 100;

const COLORS = [
    { r: 0.90, g: 0.45, b: 0.30 },
    { r: 0.35, g: 0.75, b: 0.40 },
    { r: 0.35, g: 0.55, b: 0.95 },
    { r: 0.90, g: 0.75, b: 0.30 },
];

/**
 * 造一个球的场景数据。
 *
 * @param x 出生点 x
 * @param y 出生点 y
 * @param z 出生点 z
 * @param index 序号（决定颜色）
 * @returns 球的 Object3D 数据
 */
function createBall(x: number, y: number, z: number, index: number): Object3D
{
    const color = COLORS[index % COLORS.length];

    return {
        __type__: 'Object3D',
        name: 'Ball-' + index,
        position: { x, y, z },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'SphereGeometry', radius: BALL_RADIUS },
            material: {
                __type__: 'ColorMaterial',
                uniforms: {
                    u_diffuseInput: { __type__: 'Color4', r: color.r, g: color.g, b: color.b, a: 1 },
                },
            },
        }, {
            __type__: 'SphereCollider',
            radius: BALL_RADIUS,
        }, {
            __type__: 'Rigidbody',
            mass: BALL_MASS,
        }],
    };
}

/** 容器尺寸：原版 pile 的四道墙在 ±5，墙本身高 6、厚 0.4 */
const WALL_COLOR = { r: 0.22, g: 0.24, b: 0.29 };
const WALL_THICKNESS = 0.4;
const WALL_HEIGHT = 6;

/** 造一面墙（视觉与碰撞同一个盒子） */
function createWall(name: string, x: number, z: number, width: number, depth: number, color: { r: number; g: number; b: number })
{
    return {
        __type__: 'Object3D',
        name,
        position: { x, y: WALL_HEIGHT / 2, z },
        scale: { x: width, y: WALL_HEIGHT, z: depth },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'CubeGeometry' },
            material: {
                __type__: 'ColorMaterial',
                uniforms: { u_diffuseInput: { __type__: 'Color4', r: color.r, g: color.g, b: color.b, a: 1 } },
            },
        }, {
            __type__: 'BoxCollider',
            width,
            height: WALL_HEIGHT,
            depth,
        }, {
            __type__: 'Rigidbody',
            mass: 0,
        }],
    };
}

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'PhysicsPile',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.09, g: 0.10, b: 0.13, a: 1 },
        }, {
            __type__: 'PhysicsWorld',
            // ↓ 逐项对齐原版 pile.html
            gravity: { x: 0, y: -50, z: 0 },
            solverIterations: 5,
            contactEquationStiffness: 5e6,
            contactEquationRelaxation: 10,
            quatNormalizeFast: true,
            quatNormalizeSkip: 3,
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 12, z: 26 },
            rotation: { x: -0.36, y: 0, z: 0 },
            components: [{ __type__: 'PerspectiveCamera' }],
        }, {
            // 地面：原版是无边界 Plane，这里用一块够大的盒子（视觉与碰撞一致）
            __type__: 'Object3D',
            name: 'Ground',
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: {
                    __type__: 'ColorMaterial',
                    uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0.18, g: 0.20, b: 0.24, a: 1 } },
                },
            }, {
                __type__: 'BoxCollider',
                width: 30,
                height: 1,
                depth: 30,
            }, {
                __type__: 'Rigidbody',
                mass: 0,
            }],
            position: { x: 0, y: -0.5, z: 0 },
            scale: { x: 30, y: 1, z: 30 },
        },
        createWall('Wall-Xmin', -CONTAINER_SIZE, 0, WALL_THICKNESS, CONTAINER_SIZE * 2, WALL_COLOR),
        createWall('Wall-Xmax', CONTAINER_SIZE, 0, WALL_THICKNESS, CONTAINER_SIZE * 2, WALL_COLOR),
        createWall('Wall-Zmin', 0, -CONTAINER_SIZE, CONTAINER_SIZE * 2, WALL_THICKNESS, WALL_COLOR),
        createWall('Wall-Zmax', 0, CONTAINER_SIZE, CONTAINER_SIZE * 2, WALL_THICKNESS, WALL_COLOR)],
    },
};
const viewLogic = logic(view);

// 运行时往根节点加球 / 删球：走 children 的写入路径
const r_root = reactive(view.root) as unknown as { children: Object3D[] };
const spawnedBalls: Object3D[] = [];

let spawnIndex = 0;
setInterval(() =>
{
    spawnIndex++;
    // 与原版同样的出生点：( -2·sin i, 14, 2·cos i )
    const ball = createBall(-2 * Math.sin(spawnIndex), 14, 2 * Math.cos(spawnIndex), spawnIndex);

    r_root.children.push(ball);
    spawnedBalls.push(ball);

    // 超过上限就移除最早的那个
    if (spawnedBalls.length > MAX_BALLS)
    {
        const oldest = spawnedBalls.shift()!;
        const index = r_root.children.indexOf(oldest);
        if (index >= 0) r_root.children.splice(index, 1);
    }
}, SPAWN_INTERVAL);

ticker.onframe(() =>
{
    webgpu.submit(viewLogic.submit);
});
