import { reactive } from 'feng3d';
import type { Object3D } from 'feng3d';
import { createPhysicsDemo } from './PhysicsDemo';
import { createGroundPlane } from './PhysicsSceneParts';

const demo = createPhysicsDemo(document.getElementById('webgpu') as HTMLCanvasElement);

/** 原版 sph.html 的全局尺寸 */
const NX = 4;
const NY = 15;
const NZ = 4;
const WIDTH = 10;
const HEIGHT = 5;
const MASS = 0.01;

/** 流体材质名（原版给粒子、地面、四墙共用一个 Material） */
const FLUID_MATERIAL = 'fluid';

/**
 * 造一面"无限大"的静态墙（原版用 Plane）。
 *
 * cannon-es 的 Plane 法线朝**局部 +Z**，所以每面墙靠欧拉角把法线转到朝向容器内部，
 * 再放到容器的边界上。
 *
 * @param name 名字
 * @param position 位置
 * @param rotation 欧拉角
 * @returns 墙的 Object3D（原版不给墙做视觉）
 */
function createWall(name: string, position: { x: number; y: number; z: number }, rotation: { x: number; y: number; z: number }): Object3D
{
    return {
        __type__: 'Object3D',
        name,
        position,
        rotation,
        components: [{
            __type__: 'PlaneCollider',
        }, {
            __type__: 'Rigidbody',
            mass: 0,
            materialName: FLUID_MATERIAL,
        }],
    };
}

/**
 * 光滑粒子流体示例 —— 1:1 对应 cannon-es 的 `sph.html`（一幕 `240 particles`）。
 *
 * 原版场景（重力 -10、接触刚度 **1e11**、松弛 2、solver 迭代 10）：
 * - SPH 参数：密度 1、粘性 0.03、光滑半径 1.0；粒子 **mass 0.01**
 * - 容器：地面 + 四面墙（x 在 ±5、z 在 ±2.5）——墙就是 10×5 的水箱
 * - 粒子：`nx=4 · ny=15 · nz=4` = **240 个**，按 `k` 从下往上分 15 层堆，
 *   每个粒子的 x/z 带一点随机抖动（`randRange 0.1`）免得初态完全对齐、一开始就互相"卡住"
 * - 流体与容器共用一个材质，`ContactMaterial` 指定 friction **0.06**、restitution **0**
 *
 * 240 个粒子落下来会荡成水波——SPH 就是用粒子核函数近似连续流体的经典做法。
 *
 * > 两个照抄原版细节：粒子高度用的是 `(k * height) / nz`（**除以 nz 而不是 ny**，
 * > 这是原版的写法，虽然叫 ny 的那个变量其实当"层数"在用）；粒子线性阻尼取 cannon-es 的默认值 0.01。
 */
demo.addScene('240 particles', (world) =>
{
    reactive(world).gravity = { x: 0, y: -10, z: 0 };
    reactive(world).contactEquationStiffness = 1e11;
    reactive(world).contactEquationRelaxation = 2;
    reactive(world).solverIterations = 10;

    // 流体 × 流体（原版用同一个材质，因此也给容器用同一个名字）
    reactive(world).contactMaterials = [{
        a: FLUID_MATERIAL,
        b: FLUID_MATERIAL,
        friction: 0.06,
        restitution: 0,
    }];

    // SPH 求解器：组件只描述参数，PhysicsWorld 会在子树里找到它并接管粒子
    const sphHolder: Object3D = {
        __type__: 'Object3D',
        name: 'SPHSystem',
        components: [{
            __type__: 'SPHSystem',
            density: 1,
            viscosity: 0.03,
            smoothingRadius: 1.0,
        }],
    };

    // 地面（原版给地面做了视觉，四面墙没有）
    const ground = createGroundPlane();
    (ground.components as unknown[]).forEach((component) =>
    {
        const rigidbody = component as { __type__?: string; materialName?: string };
        if (rigidbody.__type__ === 'Rigidbody') rigidbody.materialName = FLUID_MATERIAL;
    });

    const walls = [
        // -x：法线转到 +X
        createWall('Wall-Xmin', { x: -WIDTH * 0.5, y: 0, z: 0 }, { x: 0, y: Math.PI / 2, z: 0 }),
        // +x：法线转到 -X
        createWall('Wall-Xmax', { x: WIDTH * 0.5, y: 0, z: 0 }, { x: 0, y: -Math.PI / 2, z: 0 }),
        // -z：法线保持 +Z
        createWall('Wall-Zmin', { x: 0, y: 0, z: -HEIGHT * 0.5 }, { x: 0, y: 0, z: 0 }),
        // +z：法线转到 -Z
        createWall('Wall-Zmax', { x: 0, y: 0, z: HEIGHT * 0.5 }, { x: 0, y: Math.PI, z: 0 }),
    ];

    const randRange = 0.1;
    const particles: Object3D[] = [];
    for (let i = 0; i < NX; i++)
    {
        for (let j = 0; j < NZ; j++)
        {
            for (let k = 0; k < NY; k++)
            {
                particles.push({
                    __type__: 'Object3D',
                    name: 'P-' + i + '-' + j + '-' + k,
                    position: {
                        x: ((i + (Math.random() - 0.5) * randRange + 0.5) * WIDTH) / NX - WIDTH * 0.5,
                        y: (k * HEIGHT) / NZ,
                        z: ((j + (Math.random() - 0.5) * randRange + 0.5) * HEIGHT) / NZ - HEIGHT * 0.5,
                    },
                    components: [{
                        __type__: 'MeshRenderer',
                        geometry: { __type__: 'SphereGeometry', radius: 0.1, segmentsW: 6, segmentsH: 6 },
                        material: {
                            __type__: 'ColorMaterial',
                            uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0.35, g: 0.6, b: 0.95, a: 1 } },
                        },
                    }, {
                        __type__: 'SPHParticle',
                        mass: MASS,
                        radius: 0.1,
                        // 原版没设阻尼 → 用 cannon-es 的默认值
                        linearDamping: 0.01,
                        materialName: FLUID_MATERIAL,
                    }],
                });
            }
        }
    }

    return [ground, sphHolder, ...walls, ...particles];
});
