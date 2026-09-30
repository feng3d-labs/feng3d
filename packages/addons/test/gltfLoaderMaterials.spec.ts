import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// 必须最先：feng3d barrel 会拉起 @feng3d/webgpu，先 stub 全局（与 gltfLoaderSkins.spec.ts 同模式）
import './browser-stub';

import { parseGLB, parseGLTF } from '../src/loaders/GLTFLoader';
import type { StandardMaterial } from 'feng3d';

/**
 * issue #96 第一步：glTF `materials` 的**因子**映射到 StandardMaterial（不做纹理）。
 *
 * 加载器此前完全不解析材质，所有 primitive 共用同一个 defaultMat 实例，`primitive.material`
 * 下标被解析出来又丢弃。这里用自造的最小 glTF（内嵌 base64 buffer，沿用
 * `gltfLoaderSkins.spec.ts` 的构造法）验证四条有明确依据的映射与回落路径：
 * 1. `pbrMetallicRoughness.baseColorFactor` → `u_diffuse`（Color4 纯数据字面量）；
 * 2. `doubleSided` → `cullFace`（true → 'none' / false、缺省 → 'back'）；
 * 3. `alphaMode` + `alphaCutoff` → `u_alphaThreshold`（仅 MASK 有效，缺省 0.5）；
 * 4. `name` → `Material.name`。
 *
 * 另验证：每个 primitive 各持独立材质实例（不同 material 下标不共享，回落默认也不共享）、
 * 下标缺失/越界回落默认而不抛错、没有 `materials` 的真实资源 collision-world.glb 不回归。
 */

/** 二进制布局：顶点 0..36（3×float32x3）、索引 36..42（3×uint16） */
const BUFFER_BYTES = 42;

/** 一个三角形的最小二进制 buffer */
function makeBin(): Uint8Array
{
    const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    const indices = new Uint16Array([0, 1, 2]);

    const bin = new Uint8Array(BUFFER_BYTES);
    bin.set(new Uint8Array(positions.buffer), 0);
    bin.set(new Uint8Array(indices.buffer), 36);

    return bin;
}

/**
 * 造一份含 4 个材质、6 个 primitive 的 `.gltf`。
 *
 * primitive → material 下标：0/1/2/3/缺失/99（最后两个走回落路径）；
 * 全部 primitive 共用同一份 POSITION/indices accessor（材质解析与几何无关）。
 */
function makeMaterialsGltf(): string
{
    const bin = makeBin();
    const uri = `data:application/octet-stream;base64,${Buffer.from(bin).toString('base64')}`;

    return JSON.stringify({
        asset: { version: '2.0' },
        buffers: [{ byteLength: BUFFER_BYTES, uri }],
        bufferViews: [
            { buffer: 0, byteOffset: 0, byteLength: 36 },
            { buffer: 0, byteOffset: 36, byteLength: 6 },
        ],
        accessors: [
            { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' },
            { bufferView: 1, componentType: 5123, count: 3, type: 'SCALAR' },
        ],
        materials: [
            // 0：非默认 baseColorFactor + 双面 + MASK(0.3)
            {
                name: 'NonDefault',
                pbrMetallicRoughness: { baseColorFactor: [0.25, 0.5, 0.75, 1] },
                doubleSided: true,
                alphaMode: 'MASK',
                alphaCutoff: 0.3,
            },
            // 1：doubleSided 显式 false + MASK 不带 alphaCutoff（规范缺省 0.5）
            {
                pbrMetallicRoughness: { baseColorFactor: [1, 0, 0, 0.5] },
                doubleSided: false,
                alphaMode: 'MASK',
            },
            // 2：无 pbrMetallicRoughness（缺省 [1,1,1,1]）+ 缺省 doubleSided + OPAQUE 带 alphaCutoff（应被忽略）
            { alphaMode: 'OPAQUE', alphaCutoff: 0.9 },
            // 3：BLEND（StandardMaterial 无混合开关，本步未做，只保证不产生 alpha 裁剪）
            { alphaMode: 'BLEND' },
        ],
        meshes: [
            {
                primitives: [
                    { attributes: { POSITION: 0 }, indices: 1, material: 0 },
                    { attributes: { POSITION: 0 }, indices: 1, material: 1 },
                    { attributes: { POSITION: 0 }, indices: 1, material: 2 },
                    { attributes: { POSITION: 0 }, indices: 1, material: 3 },
                    // 没有 material 下标 → 回落默认材质
                    { attributes: { POSITION: 0 }, indices: 1 },
                    // material 下标越界 → 回落默认材质
                    { attributes: { POSITION: 0 }, indices: 1, material: 99 },
                ],
            },
        ],
        nodes: [{ mesh: 0 }],
        scenes: [{ nodes: [0] }],
    });
}

/** 默认材质的 u_diffuse（回落路径的期望值，与此前 defaultMat 一致） */
const DEFAULT_DIFFUSE = { __type__: 'Color4', r: 0.8, g: 0.8, b: 0.8, a: 1 };

describe('GLTFLoader 材质因子（issue #96 第一步）', () =>
{
    const result = parseGLTF(makeMaterialsGltf());
    const materials: StandardMaterial[] = result.primitives.map((primitive) => primitive.material);

    it('baseColorFactor 逐分量映射到 u_diffuse，name 映射到 Material.name', () =>
    {
        // 非默认值（若映射被去掉或恒为 [1,1,1,1]，本断言即失败）
        expect(materials[0].uniforms?.u_diffuse).toEqual({ __type__: 'Color4', r: 0.25, g: 0.5, b: 0.75, a: 1 });
        expect(materials[0].uniforms?.u_diffuse?.r).toBe(0.25);
        expect(materials[0].uniforms?.u_diffuse?.g).toBe(0.5);
        expect(materials[0].uniforms?.u_diffuse?.b).toBe(0.75);
        expect(materials[0].uniforms?.u_diffuse?.a).toBe(1);

        // alpha 分量同样来自 baseColorFactor[3]
        expect(materials[1].uniforms?.u_diffuse).toEqual({ __type__: 'Color4', r: 1, g: 0, b: 0, a: 0.5 });

        // 缺省 baseColorFactor → [1,1,1,1]（不是默认材质的 0.8 灰）
        expect(materials[2].uniforms?.u_diffuse).toEqual({ __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 });

        expect(materials[0].name).toBe('NonDefault');
        expect(materials[0].__type__).toBe('StandardMaterial');
    });

    it('doubleSided → cullFace：true 为 none，false 与缺省为 back', () =>
    {
        expect(materials[0].cullFace).toBe('none');
        expect(materials[1].cullFace).toBe('back');
        // 未声明 doubleSided：glTF 缺省 false → 单面
        expect(materials[2].cullFace).toBe('back');
    });

    it('alphaMode/alphaCutoff → u_alphaThreshold：MASK 用 cutoff，缺省 0.5', () =>
    {
        expect(materials[0].uniforms?.u_alphaThreshold).toBe(0.3);
        expect(materials[1].uniforms?.u_alphaThreshold).toBe(0.5);
    });

    it('OPAQUE 不受 alphaCutoff 影响；BLEND 未做透明混合（阈值保持 0）', () =>
    {
        // material 2 写了 alphaCutoff: 0.9，但规范明确该字段只在 MASK 下有效
        expect(materials[2].uniforms?.u_alphaThreshold).toBe(0);
        // BLEND：StandardMaterial 无 blend 字段、logic 也未覆写 isTransparent，本步不做混合。
        // 这里只断言"不产生 alpha 裁剪"，不臆造任何透明开关。
        expect(materials[3].uniforms?.u_alphaThreshold).toBe(0);
        expect(materials[3].cullFace).toBe('back');
    });

    it('两个 primitive 用不同 material 时各自拿到不同材质数据，且互不共享实例', () =>
    {
        expect(materials[0]).not.toBe(materials[1]);
        expect(materials[0].uniforms?.u_diffuse).not.toEqual(materials[1].uniforms?.u_diffuse);
        // 6 个 primitive → 6 份互不相同的材质对象（含两个回落默认的）
        expect(new Set(result.primitives.map((primitive) => primitive.material)).size).toBe(6);
    });

    it('material 下标缺失/越界时回落默认材质且不抛错', () =>
    {
        expect(result.primitives).toHaveLength(6);

        expect(materials[4].uniforms?.u_diffuse).toEqual(DEFAULT_DIFFUSE);
        expect(materials[5].uniforms?.u_diffuse).toEqual(DEFAULT_DIFFUSE);
        expect(materials[4].cullFace).toBeUndefined();
        expect(materials[5].cullFace).toBeUndefined();

        // 两个回落也不共享同一实例
        expect(materials[4]).not.toBe(materials[5]);

        // 材质解析不影响几何路径
        expect(result.primitives[5].geometry.indices!.length).toBe(3);
    });

    it('MeshRenderer 组件里的材质与 primitives 列表里的同一份数据', () =>
    {
        const components = result.root.children![0].components!;
        expect(components).toHaveLength(6);
        components.forEach((component, index) =>
        {
            const material = (component as unknown as { material: StandardMaterial }).material;
            expect(material).toBe(result.primitives[index].material);
        });
    });
});

describe('GLTFLoader 真实资源 collision-world.glb（自带 1 个 material）', () =>
{
    const glbPath = new URL('../../../examples/resources/collision-world.glb', import.meta.url);
    const fileBuffer = readFileSync(glbPath);
    const result = parseGLB(fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength));

    it('该资源的 materials[0] 因子确实生效（缺省 baseColorFactor → 白 + doubleSided → none）', () =>
    {
        // 实测该 GLB 的 JSON chunk 里 materials 为：
        // [{ name: 'Material.001', doubleSided: true, emissiveFactor: [0,0,0],
        //    pbrMetallicRoughness: { baseColorTexture: { index: 0, texCoord: 0 },
        //                            metallicFactor: 0, roughnessFactor: 1 } }]
        // 没有 baseColorFactor → 按规范缺省 [1,1,1,1]（此前是加载器的 0.8 灰默认材质）
        expect(result.primitives.length).toBeGreaterThanOrEqual(1);
        for (const primitive of result.primitives)
        {
            expect(primitive.material.__type__).toBe('StandardMaterial');
            expect(primitive.material.name).toBe('Material.001');
            expect(primitive.material.uniforms?.u_diffuse).toEqual({ __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 });
            expect(primitive.material.cullFace).toBe('none');
        }
        // 每个 primitive 各持独立实例
        expect(new Set(result.primitives.map((primitive) => primitive.material)).size).toBe(result.primitives.length);
    });

    it('几何相关断言口径不变（材质解析不影响几何路径）', () =>
    {
        // 实测：该资源 indices accessor count = 5262（1754 个三角形 × 3）
        expect(result.primitives[0].geometry.indices!.length).toBe(5262);
        expect(Array.from(result.primitives[0].geometry.positions!).every((v) => Number.isFinite(v))).toBe(true);
    });
});
