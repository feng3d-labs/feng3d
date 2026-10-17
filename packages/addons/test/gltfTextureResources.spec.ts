import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// 必须最先：feng3d barrel 会拉起 @feng3d/webgpu，先 stub 全局（与 gltfLoaderMaterials.spec.ts 同模式）
import './browser-stub';

import { parseGLB, parseGLTF } from '../src/loaders/GLTFLoader';
import type { StandardMaterial, TextureResource } from 'feng3d';

/**
 * issue #96：glTF 纹理 → 声明式纹理引用（`{ __type__: 'Texture', url }`）。
 *
 * 覆盖三条来源转 url 的规则（data: 原样 / 普通 uri 原样 / bufferView 转 data URL）、
 * 两个有语义对应字段的槽位（baseColorTexture → s_diffuse、normalTexture → s_normal），
 * 以及"没有对应字段的槽位不硬塞"。
 */

/** 二进制布局：顶点 0..36、索引 36..42、图片字节 42..50 */
const GEOMETRY_BYTES = 42;
const IMAGE_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const BUFFER_BYTES = GEOMETRY_BYTES + IMAGE_BYTES.length;

function makeBin(): Uint8Array
{
    const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    const indices = new Uint16Array([0, 1, 2]);

    const bin = new Uint8Array(BUFFER_BYTES);
    bin.set(new Uint8Array(positions.buffer), 0);
    bin.set(new Uint8Array(indices.buffer), 36);
    bin.set(IMAGE_BYTES, GEOMETRY_BYTES);

    return bin;
}

/**
 * 造一份最小 glTF：4 个材质，分别覆盖三种图片来源与「不映射的槽位」。
 */
function makeTextureGltf(): string
{
    const uri = `data:application/octet-stream;base64,${Buffer.from(makeBin()).toString('base64')}`;

    return JSON.stringify({
        asset: { version: '2.0' },
        buffers: [{ byteLength: BUFFER_BYTES, uri }],
        bufferViews: [
            { buffer: 0, byteOffset: 0, byteLength: 36 },
            { buffer: 0, byteOffset: 36, byteLength: 6 },
            { buffer: 0, byteOffset: GEOMETRY_BYTES, byteLength: IMAGE_BYTES.length },
        ],
        accessors: [
            { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' },
            { bufferView: 1, componentType: 5123, count: 3, type: 'SCALAR' },
        ],
        images: [
            { uri: 'albedo.png' },
            { uri: 'data:image/png;base64,iVBORw0KGgo=' },
            { bufferView: 2, mimeType: 'image/png', name: 'embedded' },
        ],
        textures: [{ source: 0 }, { source: 1 }, { source: 2 }],
        materials: [
            // 0：外部相对路径图片 → s_diffuse
            { pbrMetallicRoughness: { baseColorTexture: { index: 0 } } },
            // 1：data: URI 图片 → 原样
            { pbrMetallicRoughness: { baseColorTexture: { index: 1 } } },
            // 2：bufferView 内嵌图片 → data URL
            { pbrMetallicRoughness: { baseColorTexture: { index: 2 } } },
            // 3：五个槽位都写，但只有 normalTexture 有对应字段
            {
                pbrMetallicRoughness: {
                    baseColorTexture: { index: 0 },
                    metallicRoughnessTexture: { index: 0 },
                },
                normalTexture: { index: 0 },
                occlusionTexture: { index: 0 },
                emissiveTexture: { index: 0 },
            },
            // 4：没有纹理
            { pbrMetallicRoughness: {} },
            // 5：只有 metallicRoughness / occlusion / emissive（都不映射）
            {
                pbrMetallicRoughness: { metallicRoughnessTexture: { index: 0 } },
                occlusionTexture: { index: 0 },
                emissiveTexture: { index: 0 },
            },
        ],
        meshes: [
            {
                primitives: [
                    { attributes: { POSITION: 0 }, indices: 1, material: 0 },
                    { attributes: { POSITION: 0 }, indices: 1, material: 1 },
                    { attributes: { POSITION: 0 }, indices: 1, material: 2 },
                    { attributes: { POSITION: 0 }, indices: 1, material: 3 },
                    { attributes: { POSITION: 0 }, indices: 1, material: 4 },
                    { attributes: { POSITION: 0 }, indices: 1, material: 5 },
                ],
            },
        ],
        nodes: [{ mesh: 0 }],
        scenes: [{ nodes: [0] }],
    });
}

/** 断言字段是声明式纹理引用并返回它 */
function asResource(field: StandardMaterial['s_diffuse']): TextureResource
{
    expect(field).toBeDefined();
    expect((field as TextureResource).__type__).toBe('Texture');

    return field as TextureResource;
}

describe('GLTFLoader 纹理映射（issue #96）', () =>
{
    const result = parseGLTF(makeTextureGltf());
    const materials: StandardMaterial[] = result.primitives.map((primitive) => primitive.material);

    it('普通 uri 原样作为 url（相对路径的基准由调用方决定）', () =>
    {
        expect(asResource(materials[0].s_diffuse).url).toBe('albedo.png');
        expect(materials[0].s_normal).toBeUndefined();
    });

    it('data: URI 原样作为 url（不解码、不重编码）', () =>
    {
        expect(asResource(materials[1].s_diffuse).url).toBe('data:image/png;base64,iVBORw0KGgo=');
    });

    it('bufferView 图片转成 data URL（base64 与像素字节一致）', () =>
    {
        const url = asResource(materials[2].s_diffuse).url;
        const expected = `data:image/png;base64,${Buffer.from(IMAGE_BYTES).toString('base64')}`;

        expect(url).toBe(expected);
    });

    it('normalTexture → s_normal；其余无对应字段的槽位不映射', () =>
    {
        // 材质 3：baseColorTexture 与 normalTexture 都映射
        expect(asResource(materials[3].s_diffuse).url).toBe('albedo.png');
        expect(asResource(materials[3].s_normal).url).toBe('albedo.png');
        // 三个没有对应字段的槽位：不产生任何材质字段（只有 s_diffuse / s_normal 两个写入点）
        expect(Object.keys(materials[3]).filter((key) => key.startsWith('s_'))).toEqual(['s_diffuse', 's_normal']);
    });

    it('没有纹理的材质不产生 s_ 字段', () =>
    {
        expect(materials[4].s_diffuse).toBeUndefined();
        expect(materials[4].s_normal).toBeUndefined();
    });

    it('只有 metallicRoughness / occlusion / emissive 时仍然不产生 s_ 字段', () =>
    {
        expect(materials[5].s_diffuse).toBeUndefined();
        expect(materials[5].s_normal).toBeUndefined();
        expect(Object.keys(materials[5]).filter((key) => key.startsWith('s_'))).toEqual([]);
    });

    it('索引链仍然独立可用（textures 列表不受映射影响）', () =>
    {
        expect(result.textures).toHaveLength(3);
        expect(result.primitives[0].textures).toHaveLength(1);
        expect(result.primitives[0].textures[0].slot).toBe('baseColorTexture');
    });
});

describe('GLTFLoader 纹理映射：真实资源 collision-world.glb', () =>
{
    const glbPath = new URL('../../../examples/resources/collision-world.glb', import.meta.url);
    const fileBuffer = readFileSync(glbPath);
    const result = parseGLB(fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength));

    it('baseColorTexture（bufferView + image/png）映射为 data URL 的 s_diffuse', () =>
    {
        const texture = asResource(result.primitives[0].material.s_diffuse);

        // 图片在 bufferView 里：转成 data URL 才能被引擎直接加载
        expect(texture.url.startsWith('data:image/png;base64,')).toBe(true);
        // 真实图片有实际字节（不是空串）
        expect(texture.url.length).toBeGreaterThan(1000);
        // 每个 primitive 都拿到同一张图的声明（该资源只有一个材质）
        for (const primitive of result.primitives)
        {
            expect(asResource(primitive.material.s_diffuse).url).toBe(texture.url);
        }
    });

    it('几何与既有因子断言口径不变', () =>
    {
        expect(result.primitives[0].material.__type__).toBe('StandardMaterial');
        expect(result.primitives[0].material.name).toBe('Material.001');
        expect(result.primitives[0].geometry.indices!.length).toBe(5262);
    });
});


describe('GLTFLoader 纹理 baseUri 解析（issue #96）', () =>
{
    const BASE = 'https://example.com/models/x.gltf';

    it('传 baseUri 时相对 uri 解析为绝对地址', () =>
    {
        const result = parseGLTF(makeTextureGltf(), undefined, BASE);
        const material = result.primitives[0].material as StandardMaterial;

        expect(asResource(material.s_diffuse).url).toBe('https://example.com/models/albedo.png');
    });

    it('data: URI 不受 baseUri 影响（内嵌数据与基准无关）', () =>
    {
        const result = parseGLTF(makeTextureGltf(), undefined, BASE);
        const material = result.primitives[1].material as StandardMaterial;

        expect(asResource(material.s_diffuse).url).toBe('data:image/png;base64,iVBORw0KGgo=');
    });

    it('绝对 uri 不受 baseUri 影响', () =>
    {
        const json = JSON.parse(makeTextureGltf());

        json.images[0].uri = 'https://cdn.example.com/a.png';

        const result = parseGLTF(JSON.stringify(json), undefined, BASE);
        const material = result.primitives[0].material as StandardMaterial;

        expect(asResource(material.s_diffuse).url).toBe('https://cdn.example.com/a.png');
    });

    it('baseUri 本身是相对地址时原样降级（不猜基准）', () =>
    {
        const result = parseGLTF(makeTextureGltf(), undefined, 'models/x.gltf');
        const material = result.primitives[0].material as StandardMaterial;

        expect(asResource(material.s_diffuse).url).toBe('albedo.png');
    });

    it('不传 baseUri 时保持原有语义（uri 原样）', () =>
    {
        const result = parseGLTF(makeTextureGltf());
        const material = result.primitives[0].material as StandardMaterial;

        expect(asResource(material.s_diffuse).url).toBe('albedo.png');
    });
});
