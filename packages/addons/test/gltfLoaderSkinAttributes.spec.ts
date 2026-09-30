import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// 必须最先：feng3d barrel 会拉起 @feng3d/webgpu，先 stub 全局（与 gltfLoaderSkins.spec.ts 同模式）
import './browser-stub';

import { parseGLB, parseGLTF } from '../src/loaders/GLTFLoader';
import type { CustomGeometry } from 'feng3d';

/**
 * issue #337 第一步：glTF 加载器解析 `JOINTS_0` / `WEIGHTS_0` 顶点蒙皮属性。
 *
 * 上游数据链（#333 的 `SkeletonLogic.globalMatrices`、#335 的 `Skeleton.boneNames`/`boneInverses`）已通，
 * 但顶点上没有"哪根骨骼影响它、权重多少"，网格不会跟着骨头动。这里自造一份最小 skinned glTF
 * （与 gltfLoaderSkins.spec.ts 同一套构造方式：JSON + 内嵌 base64 buffer，节点名 `SkinRoot`/`Hips`/`Spine`）
 * 验证解析出的 `a_skinIndices` / `a_skinWeights` 与手写值逐项一致。
 *
 * 断言口径（也是最能抓"读错 accessor"的）：
 * 1. 属性存在且长度 = 顶点数 × 4；
 * 2. 索引逐项等于手写值（非零、非顺序）、且都落在 `[0, boneNames.length)`；
 * 3. 权重逐项等于手写值（含小数）、且**每顶点权重和 ≈ 1**（蒙皮硬约束，容差 1e-3）；
 * 4. 第二组 `JOINTS_1`/`WEIGHTS_1` → `a_skinIndices1`/`a_skinWeights1`；
 * 5. 没有蒙皮属性的 collision-world.glb 不回归（几何上不出现这些字段）。
 */

/** 每顶点 4 个分量的骨骼索引（3 个顶点，值非零、非顺序、且都 < 3） */
const SKIN_INDICES = [2, 0, 1, 0, 1, 2, 0, 0, 0, 1, 2, 0];

/**
 * 每顶点 4 个分量的骨骼权重。
 *
 * 刻意只用**二进制可精确表示**的小数（0.5 / 0.25 / 0.375 / 0.625 / 0.125），
 * 否则 float32 存储误差会让"逐项等于手写值"的断言假失败。每顶点权重和均为 1。
 */
const SKIN_WEIGHTS = [0.5, 0.25, 0.25, 0, 0.375, 0.625, 0, 0, 0.125, 0.25, 0.625, 0];

/** 第二组骨骼索引（JOINTS_1），权重全 0（第二组的典型形态） */
const SKIN_INDICES_1 = [1, 2, 0, 0, 2, 0, 1, 0, 1, 0, 2, 0];
const SKIN_WEIGHTS_1 = new Array(12).fill(0);

/** 逆绑定矩阵（列主序手写，与 gltfLoaderSkins.spec.ts 同口径） */
const HIPS_INVERSE = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    -10, -20, -30, 1,
];
const SPINE_INVERSE = [
    2, 0, 0, 0,
    0, 3, 0, 0,
    0, 0, 4, 0,
    0, 0, 0, 1,
];
const HEAD_INVERSE = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    5, 6, 7, 1,
];

const POSITIONS = [0, 0, 0, 1, 0, 0, 0, 1, 0];
const VERTEX_COUNT = POSITIONS.length / 3;
const BONE_NAMES = ['Hips', 'Spine', 'Head'];

/** `makeSkinnedGltf` 的参数 */
interface SkinnedGltfOptions
{
    /** `JOINTS_0` 的分量类型（默认 5121 = UNSIGNED_BYTE） */
    jointsComponentType?: 5121 | 5123;
    /** `WEIGHTS_0` 的分量类型（默认 5126 = FLOAT） */
    weightsComponentType?: 5126 | 5123;
    /** 权重是否为 normalized 整数（权重用 5123 时置 true） */
    weightsNormalized?: boolean;
    /** 是否附加第二组 `JOINTS_1`/`WEIGHTS_1` */
    withSecondGroup?: boolean;
}

/** 依次把字节段写入一个 buffer，返回 buffer 与各段起始偏移 */
function packSegments(segments: Uint8Array[]): { buffer: Uint8Array; offsets: number[] }
{
    const total = segments.reduce((sum, segment) => sum + segment.length, 0);
    const buffer = new Uint8Array(total);
    const offsets: number[] = [];
    let offset = 0;

    for (const segment of segments)
    {
        offsets.push(offset);
        buffer.set(segment, offset);
        offset += segment.length;
    }

    return { buffer, offsets };
}

/** 把权重量化成 normalized UNSIGNED_SHORT（0 → 0，1 → 65535） */
function toNormalizedUshort(weights: number[]): Uint16Array
{
    return new Uint16Array(weights.map((w) => Math.round(w * 65535)));
}

/**
 * 造一份最小带蒙皮顶点属性的 `.gltf`（内嵌 base64 buffer）。
 *
 * 节点树：`SkinRoot`（挂 mesh + skin，joints 是它的子孙）→ `Hips` → `Spine` → `Head`，共 3 根骨骼。
 */
function makeSkinnedGltf(options: SkinnedGltfOptions = {}): string
{
    const jointsComponentType = options.jointsComponentType ?? 5121;
    const weightsComponentType = options.weightsComponentType ?? 5126;

    const positions = new Float32Array(POSITIONS);
    const indices = new Uint16Array([0, 1, 2]);
    const joints = jointsComponentType === 5121 ? new Uint8Array(SKIN_INDICES) : new Uint16Array(SKIN_INDICES);
    const weights = weightsComponentType === 5126
        ? new Float32Array(SKIN_WEIGHTS)
        : toNormalizedUshort(SKIN_WEIGHTS);
    const joints1 = jointsComponentType === 5121 ? new Uint8Array(SKIN_INDICES_1) : new Uint16Array(SKIN_INDICES_1);
    const weights1 = weightsComponentType === 5126
        ? new Float32Array(SKIN_WEIGHTS_1)
        : toNormalizedUshort(SKIN_WEIGHTS_1);
    const matrices = new Float32Array([...HIPS_INVERSE, ...SPINE_INVERSE, ...HEAD_INVERSE]);

    const toBytes = (view: ArrayBufferView) => new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
    const segments = [toBytes(positions), toBytes(indices), toBytes(joints), toBytes(weights)];
    if (options.withSecondGroup) segments.push(toBytes(joints1), toBytes(weights1));
    segments.push(toBytes(matrices));

    const { buffer, offsets } = packSegments(segments);

    // accessor 下标：0 POSITION、1 indices、2 JOINTS_0、3 WEIGHTS_0、[4 JOINTS_1、5 WEIGHTS_1]、末尾逆绑定矩阵
    const bufferViews = segments.map((segment, i) => ({ buffer: 0, byteOffset: offsets[i], byteLength: segment.length }));
    const accessors: Record<string, unknown>[] = [
        { bufferView: 0, componentType: 5126, count: VERTEX_COUNT, type: 'VEC3' },
        { bufferView: 1, componentType: 5123, count: 3, type: 'SCALAR' },
        { bufferView: 2, componentType: jointsComponentType, count: VERTEX_COUNT, type: 'VEC4' },
        {
            bufferView: 3,
            componentType: weightsComponentType,
            count: VERTEX_COUNT,
            type: 'VEC4',
            ...(options.weightsNormalized === true && { normalized: true }),
        },
    ];
    const attributes: Record<string, number> = { POSITION: 0, JOINTS_0: 2, WEIGHTS_0: 3 };

    if (options.withSecondGroup)
    {
        attributes.JOINTS_1 = 4;
        attributes.WEIGHTS_1 = 5;
        accessors.push(
            { bufferView: 4, componentType: jointsComponentType, count: VERTEX_COUNT, type: 'VEC4' },
            {
                bufferView: 5,
                componentType: weightsComponentType,
                count: VERTEX_COUNT,
                type: 'VEC4',
                ...(options.weightsNormalized === true && { normalized: true }),
            },
        );
    }

    const inverseBindMatrices = accessors.length;
    accessors.push({ bufferView: segments.length - 1, componentType: 5126, count: BONE_NAMES.length, type: 'MAT4' });

    return JSON.stringify({
        asset: { version: '2.0' },
        buffers: [{ byteLength: buffer.length, uri: `data:application/octet-stream;base64,${Buffer.from(buffer).toString('base64')}` }],
        bufferViews,
        accessors,
        meshes: [{ primitives: [{ attributes, indices: 1 }] }],
        nodes: [
            { name: 'SkinRoot', mesh: 0, skin: 0, children: [1] },
            { name: 'Hips', children: [2] },
            { name: 'Spine', children: [3] },
            { name: 'Head' },
        ],
        skins: [{ name: 'TestSkin', joints: [1, 2, 3], inverseBindMatrices }],
        scenes: [{ nodes: [0] }],
    });
}

/** 取第一个 primitive 的几何 */
function firstGeometry(gltf: string): CustomGeometry
{
    return parseGLTF(gltf).primitives[0].geometry;
}

/** 每顶点权重和 */
function weightSums(weights: readonly number[]): number[]
{
    const sums: number[] = [];
    for (let i = 0; i < weights.length; i += 4)
    {
        sums.push(weights[i] + weights[i + 1] + weights[i + 2] + weights[i + 3]);
    }

    return sums;
}

describe('GLTFLoader 蒙皮顶点属性（JOINTS_0/WEIGHTS_0，issue #337 第一步）', () =>
{
    const result = parseGLTF(makeSkinnedGltf());
    const geometry = result.primitives[0].geometry;

    it('a_skinIndices / a_skinWeights 存在，长度 = 顶点数 × 4', () =>
    {
        expect(geometry.a_skinIndices).toBeDefined();
        expect(geometry.a_skinWeights).toBeDefined();
        expect(Array.from(geometry.a_skinIndices!)).toHaveLength(VERTEX_COUNT * 4);
        expect(Array.from(geometry.a_skinWeights!)).toHaveLength(VERTEX_COUNT * 4);

        // 第二组不存在时不应凭空产出字段
        expect(geometry.a_skinIndices1).toBeUndefined();
        expect(geometry.a_skinWeights1).toBeUndefined();
    });

    it('JOINTS_0 解出的索引逐项等于手写值', () =>
    {
        expect(Array.from(geometry.a_skinIndices!)).toEqual(SKIN_INDICES);
    });

    it('WEIGHTS_0 解出的权重逐项等于手写值（含小数）', () =>
    {
        expect(Array.from(geometry.a_skinWeights!)).toEqual(SKIN_WEIGHTS);
    });

    it('索引都落在 [0, boneNames.length)，且确实用到了多根骨骼', () =>
    {
        expect(result.skins[0].boneNames).toEqual(BONE_NAMES);
        const boneCount = result.skins[0].boneNames.length;

        for (const index of Array.from(geometry.a_skinIndices!))
        {
            expect(index).toBeGreaterThanOrEqual(0);
            expect(index).toBeLessThan(boneCount);
        }

        // 防止"全 0"也能通过范围断言
        expect(new Set(Array.from(geometry.a_skinIndices!)).size).toBeGreaterThan(1);
    });

    it('每顶点权重和 ≈ 1（容差 1e-3）', () =>
    {
        for (const sum of weightSums(Array.from(geometry.a_skinWeights!)))
        {
            expect(Math.abs(sum - 1)).toBeLessThan(1e-3);
        }
    });

    it('顶点数与权重和不变：蒙皮属性解析不影响既有几何路径', () =>
    {
        expect(Array.from(geometry.positions!)).toEqual(POSITIONS);
        expect(geometry.indices!.length).toBe(3);
    });

    it('affected-bone 索引与权重的对齐关系正确（权重非零处才允许索引非零）', () =>
    {
        const indices = Array.from(geometry.a_skinIndices!);
        const weights = Array.from(geometry.a_skinWeights!);

        // 顶点 0 只用骨骼 2 → 权重应集中在第 0 个分量
        expect(indices[0]).toBe(2);
        expect(weights[0]).toBe(0.5);
        expect(weights[1] + weights[2]).toBe(0.5);
    });
});

describe('GLTFLoader 蒙皮顶点属性：UNSIGNED_SHORT 索引与 normalized 权重', () =>
{
    const gltf = makeSkinnedGltf({ jointsComponentType: 5123, weightsComponentType: 5123, weightsNormalized: true });
    const geometry = firstGeometry(gltf);

    it('UNSIGNED_SHORT(5123) 的 JOINTS_0 按整数读出（不被当成归一化数据）', () =>
    {
        expect(Array.from(geometry.a_skinIndices!)).toEqual(SKIN_INDICES);
    });

    it('normalized UNSIGNED_SHORT 的 WEIGHTS_0 反归一化到 [0,1]（除数是 65535）', () =>
    {
        const weights = Array.from(geometry.a_skinWeights!);
        for (let i = 0; i < SKIN_WEIGHTS.length; i++)
        {
            expect(weights[i]).toBeCloseTo(SKIN_WEIGHTS[i], 3);
        }

        for (const sum of weightSums(weights))
        {
            expect(Math.abs(sum - 1)).toBeLessThan(1e-3);
        }
    });
});

describe('GLTFLoader 第二组蒙皮属性（JOINTS_1/WEIGHTS_1）', () =>
{
    const geometry = firstGeometry(makeSkinnedGltf({ withSecondGroup: true }));

    it('JOINTS_1/WEIGHTS_1 → a_skinIndices1/a_skinWeights1，逐项一致', () =>
    {
        expect(Array.from(geometry.a_skinIndices!)).toEqual(SKIN_INDICES);
        expect(Array.from(geometry.a_skinWeights!)).toEqual(SKIN_WEIGHTS);
        expect(Array.from(geometry.a_skinIndices1!)).toEqual(SKIN_INDICES_1);
        expect(Array.from(geometry.a_skinWeights1!)).toEqual(SKIN_WEIGHTS_1);
    });

    it('两组索引都在骨骼范围内（合计每顶点最多 8 根骨骼）', () =>
    {
        const boneCount = BONE_NAMES.length;
        for (const index of [...Array.from(geometry.a_skinIndices!), ...Array.from(geometry.a_skinIndices1!)])
        {
            expect(index).toBeGreaterThanOrEqual(0);
            expect(index).toBeLessThan(boneCount);
        }
    });
});

describe('GLTFLoader 蒙皮属性：JOINTS/WEIGHTS 必须成对出现', () =>
{
    it('只给 JOINTS_0 不给 WEIGHTS_0 时报错，而不是静默产出半套数据', () =>
    {
        const gltf = JSON.parse(makeSkinnedGltf());
        delete gltf.meshes[0].primitives[0].attributes.WEIGHTS_0;

        expect(() => parseGLTF(JSON.stringify(gltf))).toThrow(/JOINTS_0 与 WEIGHTS_0 必须成对出现/);
    });
});

describe('GLTFLoader 无蒙皮顶点属性的资源不回归', () =>
{
    it('collision-world.glb 仍正常解析，几何上没有蒙皮字段', () =>
    {
        const glbPath = new URL('../../../examples/resources/collision-world.glb', import.meta.url);
        const fileBuffer = readFileSync(glbPath);
        const result = parseGLB(fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength));
        const geometry = result.primitives[0].geometry;

        expect(result.primitives[0].geometry.indices!.length).toBe(5262);

        for (const primitive of result.primitives)
        {
            expect(primitive.geometry.a_skinIndices).toBeUndefined();
            expect(primitive.geometry.a_skinWeights).toBeUndefined();
            expect(primitive.geometry.a_skinIndices1).toBeUndefined();
            expect(primitive.geometry.a_skinWeights1).toBeUndefined();
        }

        // 既有几何数据本身不受影响
        expect(Array.from(geometry.positions!).every((v) => Number.isFinite(v))).toBe(true);
    });
});
