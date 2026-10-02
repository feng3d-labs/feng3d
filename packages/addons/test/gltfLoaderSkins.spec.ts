import { mat4GetPosition } from '@feng3d/math';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// 必须最先：feng3d barrel 会拉起 @feng3d/webgpu，先 stub 全局（与 gltfLoader.spec.ts 同模式）
import './browser-stub';

import { parseGLB, parseGLTF } from '../src/loaders/GLTFLoader';
import type { Object3D, Skeleton } from 'feng3d';

/**
 * issue #335：glTF 加载器支持 `skins`。
 *
 * 加载器此前完全不处理骨骼蒙皮，于是 `Skeleton.boneNames` / `boneInverses` 全仓无人填充
 * （`SkeletonLogic.globalMatrices` 的计算在 #333 补上了，输入数据却不存在）。
 *
 * 这里自造一份最小带 skin 的 glTF（内嵌 base64 buffer）验证：
 * 1. `joints`（node 下标）→ 真实节点名，且逐项一致（用非默认名 `Hips`/`Spine`，默认名证明不了映射生效）；
 * 2. `inverseBindMatrices` accessor → 手算期望的 `Matrix4x4`，数值逐项一致；
 * 3. 列主序：平移落在 `elements[12..14]`（行主序会在 `[3]/[7]/[11]`），且 `mat4GetPosition()` 语义正确；
 * 4. Skeleton 组件挂在带 `node.skin` 的节点上；
 * 5. 没有 `skins` 的真实资源 collision-world.glb 解析行为不回归。
 */

/** Hips 的逆绑定矩阵：平移 (-10, -20, -30)，**列主序手写**（每 4 个元素是一列） */
const HIPS_INVERSE = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    -10, -20, -30, 1,
];

/** Spine 的逆绑定矩阵：缩放 (2, 3, 4)，**列主序手写** */
const SPINE_INVERSE = [
    2, 0, 0, 0,
    0, 3, 0, 0,
    0, 0, 4, 0,
    0, 0, 0, 1,
];

/** 二进制布局：顶点 0..36、索引 36..42、填充 42..44、逆绑定矩阵 44..172 */
const MATRICES_BYTES = 128;
const BUFFER_BYTES = 172;

/**
 * 造一份最小带 skin 的 `.gltf`（内嵌 base64 buffer）。
 *
 * 节点树：`SkinRoot`（挂 mesh + skin，joints 是它的子孙）→ `Hips` → `Spine`。
 */
function makeSkinnedGltf(): string
{
    const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    const indices = new Uint16Array([0, 1, 2]);
    const matrices = new Float32Array([...HIPS_INVERSE, ...SPINE_INVERSE]);

    const bin = new Uint8Array(BUFFER_BYTES);
    bin.set(new Uint8Array(positions.buffer), 0);
    bin.set(new Uint8Array(indices.buffer), 36);
    bin.set(new Uint8Array(matrices.buffer), 44);

    return JSON.stringify({
        asset: { version: '2.0' },
        buffers: [{ byteLength: BUFFER_BYTES, uri: `data:application/octet-stream;base64,${Buffer.from(bin).toString('base64')}` }],
        bufferViews: [
            { buffer: 0, byteOffset: 0, byteLength: 36 },
            { buffer: 0, byteOffset: 36, byteLength: 6 },
            { buffer: 0, byteOffset: 44, byteLength: MATRICES_BYTES },
        ],
        accessors: [
            { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' },
            { bufferView: 1, componentType: 5123, count: 3, type: 'SCALAR' },
            { bufferView: 2, componentType: 5126, count: 2, type: 'MAT4' },
        ],
        meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }],
        nodes: [
            { name: 'SkinRoot', mesh: 0, skin: 0, children: [1] },
            { name: 'Hips', children: [2] },
            { name: 'Spine' },
        ],
        skins: [{ name: 'TestSkin', joints: [1, 2], inverseBindMatrices: 2 }],
        scenes: [{ nodes: [0] }],
    });
}

/** 深度优先按名字查找节点（与 `SkeletonLogic` 的查找口径一致） */
function findByName(node: Object3D, name: string): Object3D | undefined
{
    if (node.name === name) return node;

    for (const child of node.children ?? [])
    {
        const found = findByName(child, name);
        if (found) return found;
    }

    return undefined;
}

/** 取节点上的 Skeleton 组件数据 */
function findSkeleton(node: Object3D): Skeleton | undefined
{
    const component = (node.components ?? []).find((c) => (c as { __type__: string }).__type__ === 'Skeleton');

    return component as Skeleton | undefined;
}

describe('GLTFLoader 骨骼蒙皮（skins，issue #335）', () =>
{
    const result = parseGLTF(makeSkinnedGltf());
    const skinRoot = findByName(result.root, 'SkinRoot')!;
    const skeleton = findSkeleton(skinRoot)!;

    it('joints（node 下标）映射成真实节点名，逐项一致', () =>
    {
        // 节点 1/2 的名字是 Hips/Spine；若映射写成默认名会得到 node_1/node_2
        expect(skinRoot).toBeTruthy();
        expect(skeleton.boneNames).toEqual(['Hips', 'Spine']);
        expect(result.skins[0].boneNames).toEqual(['Hips', 'Spine']);
        // 树里确实存在这些名字的节点（SkeletonLogic 靠名字查骨骼）
        expect(findByName(result.root, skeleton.boneNames[0])).toBeTruthy();
        expect(findByName(result.root, skeleton.boneNames[1])).toBeTruthy();
    });

    it('boneInverses 与 accessor 里的数值逐项一致（手算期望值）', () =>
    {
        expect(skeleton.boneInverses).toHaveLength(2);
        expect(Array.from(skeleton.boneInverses[0].elements)).toEqual(HIPS_INVERSE);
        expect(Array.from(skeleton.boneInverses[1].elements)).toEqual(SPINE_INVERSE);
    });

    it('列主序：平移在 elements[12..14] 而不是 [3]/[7]/[11]，getPosition 语义正确', () =>
    {
        const hips = skeleton.boneInverses[0];
        const spine = skeleton.boneInverses[1];

        // 逆绑定矩阵按列主序解析：第 4 列的前 3 个数是平移
        expect([hips.elements[12], hips.elements[13], hips.elements[14]]).toEqual([-10, -20, -30]);
        expect([hips.elements[3], hips.elements[7], hips.elements[11]]).toEqual([0, 0, 0]);

        // 阶段 C-e：`Matrix4x4` 的 class 已删除，实例方法换成纯函数
        const position = mat4GetPosition(hips);
        expect([position.x, position.y, position.z]).toEqual([-10, -20, -30]);

        // 缩放矩阵：列主序下对角线仍是 elements[0]/[5]/[10]
        expect([spine.elements[0], spine.elements[5], spine.elements[10]]).toEqual([2, 3, 4]);
    });

    it('Skeleton 组件挂在带 node.skin 的节点上，骨骼节点上没有', () =>
    {
        expect(findSkeleton(skinRoot)).toBe(skeleton);
        expect(findSkeleton(findByName(result.root, 'Hips')!)).toBeUndefined();
        expect(findSkeleton(findByName(result.root, 'Spine')!)).toBeUndefined();
        expect(result.skins).toHaveLength(1);
        expect(result.skins[0].nodeIndex).toBe(0);
        expect(result.skins[0].name).toBe('TestSkin');
        expect(result.skins[0].skinIndex).toBe(0);
    });

    it('带 skin 的节点仍正常产出几何（skins 解析不影响既有几何路径）', () =>
    {
        expect(Array.from(result.primitives[0].geometry.positions!)).toEqual([0, 0, 0, 1, 0, 0, 0, 1, 0]);
        expect(result.primitives[0].geometry.indices!.length).toBe(3);
    });
});

describe('GLTFLoader 无 skins 的资源不回归', () =>
{
    it('collision-world.glb 仍正常解析，skins 为空数组', () =>
    {
        const glbPath = new URL('../../../examples/resources/collision-world.glb', import.meta.url);
        const fileBuffer = readFileSync(glbPath);
        const result = parseGLB(fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength));

        expect(result.skins).toEqual([]);
        expect(result.primitives.length).toBeGreaterThanOrEqual(1);
        expect(result.primitives[0].geometry.indices!.length).toBe(5262);
        expect(Array.from(result.primitives[0].geometry.positions!).every((v) => Number.isFinite(v))).toBe(true);
    });

    it('省略 inverseBindMatrices 时按单位矩阵处理', () =>
    {
        const gltf = JSON.stringify({
            asset: { version: '2.0' },
            buffers: [{ byteLength: BUFFER_BYTES, uri: `data:application/octet-stream;base64,${Buffer.from(new Uint8Array(BUFFER_BYTES)).toString('base64')}` }],
            bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 36 }],
            accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' }],
            meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
            nodes: [
                { name: 'Root', mesh: 0, skin: 0, children: [1] },
                { name: 'Bone' },
            ],
            skins: [{ joints: [1] }],
            scenes: [{ nodes: [0] }],
        });

        const result = parseGLTF(gltf);
        const skeleton = findSkeleton(findByName(result.root, 'Root')!)!;

        expect(skeleton.boneNames).toEqual(['Bone']);
        expect(Array.from(skeleton.boneInverses[0].elements)).toEqual([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]);
    });
});
