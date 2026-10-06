import { logic, reactive } from 'feng3d';
import type { Object3D } from 'feng3d';
import type { Vector3Like } from '@feng3d/math';
import type { PhysicsWorldLogic } from '@feng3d/cannon-plugin';
import { createPhysicsDemo } from './PhysicsDemo';
import { createGroundPlane, createSphere } from './PhysicsSceneParts';

const demo = createPhysicsDemo(document.getElementById('webgpu') as HTMLCanvasElement);

/** 原版的环面参数：`createTorus(4, 3.5, 16, 16)`——管半径比环半径还大，是个"胖甜甜圈" */
const TORUS_RADIUS = 4;
const TORUS_TUBE = 3.5;
const TORUS_SEGMENTS = 16;

/** 环面几何：视觉与碰撞**共用同一份**，保证看到的形状就是碰到的形状 */
const TORUS_GEOMETRY = {
    __type__: 'TorusGeometry',
    radius: TORUS_RADIUS,
    tubeRadius: TORUS_TUBE,
    segmentsR: TORUS_SEGMENTS,
    segmentsT: TORUS_SEGMENTS,
} as const;

/**
 * 造一个环面刚体（三角网格碰撞）。
 *
 * @param name 名字
 * @param position 位置
 * @param options 额外字段（质量、初速度、角速度等）
 * @returns 环面 Object3D
 */
function createTorus(
    name: string,
    position: { x: number; y: number; z: number },
    options: { mass?: number; velocity?: Vector3Like; angularVelocity?: Vector3Like },
): Object3D
{
    return {
        __type__: 'Object3D',
        name,
        position,
        // 环面初始躺在 X-Y 平面，绕 X 转 -90° 把它放平
        rotation: { x: -Math.PI / 2, y: 0, z: 0 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: TORUS_GEOMETRY,
            material: {
                __type__: 'ColorMaterial',
                uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0.85, g: 0.6, b: 0.35, a: 1 } },
            },
        }, {
            __type__: 'TrimeshCollider',
            geometry: TORUS_GEOMETRY,
        }, {
            __type__: 'Rigidbody',
            mass: options.mass ?? 1,
            ...(options.velocity === undefined ? {} : { velocity: options.velocity }),
            ...(options.angularVelocity === undefined ? {} : { angularVelocity: options.angularVelocity }),
        } as never],
    };
}

/**
 * 三角网格示例 —— 1:1 对应 cannon-es 的 `trimesh.html`（**两幕**）。
 *
 * **Raycasting 幕**（**无重力**）：演示 `world.raycastClosest`。
 * 一个**旋转的环面**加一片 10×10 的"标记点"；每步之后从 `(-10, i·0.1, j·0.1)` 往 `(10, …)`
 * 打一条水平射线，把**命中点**写到对应标记点的位置上——于是你看到的其实是一张"射线切面图"，
 * 随环面转动而流动。标记点设了 `collisionResponse: false`，所以它们只做记号、不挡射线。
 *
 * **Trimesh 幕**（重力 -10、接触刚度 1e7）：真正看三角网格怎么碰撞——
 * 一个球落在**会滚动的环面**上，两者互相推挤。
 */
demo.addScene('Raycasting', (world, _context) =>
{
    reactive(world).gravity = { x: 0, y: 0, z: 0 };

    const worldLogic = logic(world) as PhysicsWorldLogic | null;

    // 10×10 个标记点（原版就是 100 个 Particle）
    const N = 10;
    const markers: Object3D[] = [];
    for (let index = 0; index < N * N; index++)
    {
        const marker: Object3D = {
            __type__: 'Object3D',
            name: 'Marker-' + index,
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'SphereGeometry', radius: 0.1, segmentsW: 6, segmentsH: 6 },
                material: {
                    __type__: 'ColorMaterial',
                    uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0.4, g: 0.85, b: 0.7, a: 1 } },
                },
            }, {
                __type__: 'ParticleCollider',
            }, {
                __type__: 'Rigidbody',
                mass: 1,
                collisionResponse: false,
            }],
        };
        markers.push(marker);
    }

    // 每步之后打 100 条射线，把命中点写到标记点上（对应原版的 postStep 监听）
    if (worldLogic !== null)
    {
        worldLogic.onAfterStep(() =>
        {
            for (let i = 0; i < N; i++)
            {
                for (let j = 0; j < N; j++)
                {
                    const result = worldLogic.raycastClosest(
                        { x: -10, y: i * 0.1, z: j * 0.1 },
                        { x: 10, y: i * 0.1, z: j * 0.1 });

                    // 未命中时原版会用 result.hitPointWorld 的默认值(0,0,0) —— 保持一致
                    (reactive(markers[i * N + j]) as unknown as { position: unknown }).position = result.hitPoint;
                }
            }
        });
    }

    return [
        createTorus('Torus', { x: 0.01, y: 0.01, z: 0.01 }, { mass: 1, angularVelocity: { x: 0, y: 0, z: 1 } }),
        ...markers,
    ];
});

demo.addScene('Trimesh', (world) =>
{
    reactive(world).gravity = { x: 0, y: -10, z: 0 };
    reactive(world).contactEquationStiffness = 1e7;

    return [
        createGroundPlane(),
        createSphere('Sphere', { x: -3, y: 11, z: 3 }, 1, { mass: 1 }),
        createTorus('Torus', { x: 0, y: 4, z: 0 }, { mass: 1, velocity: { x: 0, y: 1, z: 1 } }),
    ];
});
