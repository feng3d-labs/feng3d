import { reactive } from 'feng3d';
import type { Object3D } from 'feng3d';
import { createPhysicsDemo } from './PhysicsDemo';

const demo = createPhysicsDemo(document.getElementById('webgpu') as HTMLCanvasElement);

/** 原版 heightfield.html 的尺寸 */
const SIZE_X = 15;
const SIZE_Z = 15;
const ELEMENT_SIZE = 1;

/**
 * 高度矩阵：**边界一圈高度为 3**（围成"碗沿"），内部按
 * `cos(i/sizeX · 2π) · cos(j/sizeZ · 2π) + 2` 起伏。
 */
const MATRIX: number[][] = [];
for (let i = 0; i < SIZE_X; i++)
{
    const row: number[] = [];
    for (let j = 0; j < SIZE_Z; j++)
    {
        if (i === 0 || i === SIZE_X - 1 || j === 0 || j === SIZE_Z - 1)
        {
            row.push(3);
            continue;
        }
        row.push(Math.cos((i / SIZE_X) * Math.PI * 2) * Math.cos((j / SIZE_Z) * Math.PI * 2) + 2);
    }
    MATRIX.push(row);
}

/** 地形本体位置（原版公式）：把网格居中，并整体下沉 4 */
const TERRAIN_POSITION = {
    x: -((SIZE_X - 1) * ELEMENT_SIZE) / 2,
    y: -4,
    z: ((SIZE_Z - 1) * ELEMENT_SIZE) / 2,
};

/**
 * 按**同一份**高度数据生成地形视觉网格。
 *
 * cannon-es 的 Heightfield 把高度放在**局部 Z 轴**上（地形在局部 X-Y 平面展开），
 * 所以顶点写 `(i·elementSize, j·elementSize, height)`，再靠外层绕 X 轴 -90° 把 Z 转成世界的上方向——
 * 与碰撞体用的是同一份矩阵、同一个旋转，**视觉与碰撞严格一致**。
 *
 * @returns 地形 Object3D
 */
function createTerrainMesh(): Object3D
{
    const positions: number[] = [];
    for (let i = 0; i < SIZE_X; i++)
    {
        for (let j = 0; j < SIZE_Z; j++) positions.push(i * ELEMENT_SIZE, j * ELEMENT_SIZE, MATRIX[i][j]);
    }

    const indices: number[] = [];
    for (let i = 0; i < SIZE_X - 1; i++)
    {
        for (let j = 0; j < SIZE_Z - 1; j++)
        {
            const a = i * SIZE_Z + j;
            const b = (i + 1) * SIZE_Z + j;
            const c = i * SIZE_Z + j + 1;
            const d = (i + 1) * SIZE_Z + j + 1;
            indices.push(a, b, c, b, d, c);
        }
    }

    return {
        __type__: 'Object3D',
        name: 'Terrain',
        position: TERRAIN_POSITION,
        // 绕 X 轴 -90°：把高度场的"局部 Z 朝上"对到世界的 Y 朝上
        rotation: { x: -Math.PI / 2, y: 0, z: 0 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'CustomGeometry', positions, indices },
            material: {
                __type__: 'ColorMaterial',
                uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0.42, g: 0.46, b: 0.38, a: 1 } },
            },
        }, {
            __type__: 'HeightfieldCollider',
            heights: MATRIX,
            elementSize: ELEMENT_SIZE,
        }, {
            __type__: 'Rigidbody',
            mass: 0,
        }],
    };
}

/**
 * 高度场示例 —— 1:1 对应 cannon-es 的 `heightfield.html`（一幕 `Heightfield`）。
 *
 * 原版场景（重力 -10）：
 * - **15×15** 的高度场矩阵，每格边长 **1**；四周一圈高 3 当"碗沿"，内部是 `cos·cos+2` 的缓坡
 * - 地形整体放在 `(-7, -4, 7)` 并绕 X 转 -90°（所以地形表面大约在 y = -2 … -1）
 * - 撒**一大片小珠子**（r=0.1、质量 1）——注意原版的循环范围：**跳过最外两圈**
 *   （`i === 0 || i >= sizeX - 2 || j === 0 || j >= sizeZ - 2`），所以落点只有内圈的 12×12 = **144 个**
 *
 * 珠子出生高度 y = -1（正好贴着碗沿的高度），然后顺着缓坡滚进低处——这就是高度场想演示的
 * "用一张高度表代替三角网格来做起伏地形"。
 */
demo.addScene('Heightfield', (world) =>
{
    reactive(world).gravity = { x: 0, y: -10, z: 0 };

    const balls: Object3D[] = [];
    const mass = 1;
    for (let i = 0; i < SIZE_X - 1; i++)
    {
        for (let j = 0; j < SIZE_Z - 1; j++)
        {
            // 原版有意跳过外圈：只在内圈撒珠子
            if (i === 0 || i >= SIZE_X - 2 || j === 0 || j >= SIZE_Z - 2) continue;

            balls.push({
                __type__: 'Object3D',
                name: 'Ball-' + i + '-' + j,
                // 原版：position.set(i + 0.25, 3, -j + 0.25) 再叠加地形本体的位置
                position: {
                    x: i + 0.25 + TERRAIN_POSITION.x,
                    y: 3 + TERRAIN_POSITION.y,
                    z: -j + 0.25 + TERRAIN_POSITION.z,
                },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'SphereGeometry', radius: 0.1, segmentsW: 6, segmentsH: 6 },
                    material: {
                        __type__: 'ColorMaterial',
                        uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0.9, g: 0.65, b: 0.35, a: 1 } },
                    },
                }, {
                    __type__: 'SphereCollider',
                    radius: 0.1,
                }, {
                    __type__: 'Rigidbody',
                    mass,
                }],
            });
        }
    }

    return [createTerrainMesh(), ...balls];
});
