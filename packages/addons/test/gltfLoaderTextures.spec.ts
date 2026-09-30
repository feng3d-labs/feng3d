import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// 必须最先：feng3d barrel 会拉起 @feng3d/webgpu，先 stub 全局（与 gltfLoaderMaterials.spec.ts 同模式）
import './browser-stub';

import { parseGLB, parseGLTF } from '../src/loaders/GLTFLoader';

/**
 * issue #96：glTF **纹理的索引链与来源**（不加载图片）。
 *
 * 加载器此前完全不解析 `textures` / `images` / `samplers`，材质上的
 * `pbrMetallicRoughness.baseColorTexture` 被读出来也丢弃。本步解出这条索引链：
 * `material.<槽位>.index` → `textures[i].source` → `images[j].uri`（或 `bufferView` + `mimeType`），
 * 并把 `samplers` 的四个数字枚举原样保留。
 *
 * **图片一律不加载**（口径同 issue #12 的 `MTLMaterialRecord.textureFiles`）：解析是同步的，
 * 图片加载是异步且依赖运行环境的，`StandardMaterial` 的 `s_diffuse` 等槽位需要真正的
 * `Texture` 实例，因此这里只给出"该去哪加载"。
 *
 * 关键设计：用**两个不同的 image + 两个材质交叉引用**（材质 0 用的是 image 0、材质 1 用的是
 * image 1，且 `textures[0]`/`textures[1]` 的 `source` 故意与 `textures` 下标错开）——
 * 只有这样"链走对了"才可证：任何跳过 `textures[]` 这一层、直接把材质下标当 `images` 下标的实现
 * 都会取到另一张图的 uri（见本文件末尾的破坏实验记录）。
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

/** 内嵌 base64 buffer 的 uri */
function makeBufferUri(): string
{
    return `data:application/octet-stream;base64,${Buffer.from(makeBin()).toString('base64')}`;
}

/** 一张内嵌 PNG 的 `data:` URI（只当字符串用，本加载器不解码它） */
const EMBEDDED_PNG_DATA_URI = 'data:image/png;base64,'
    + 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8AAAwAB/AGtE0GJAAAAAElFTkSuQmCC';

/**
 * 造一份含纹理索引链的 `.gltf`：**2 个纹理 → 2 个不同的 image**，两个材质分别引用它们。
 *
 * 故意让 `textures[i].source` 与 `i` 错开（`textures[0].source = 1`、`textures[1].source = 0`），
 * 这样"跳过 textures 层直接用材质下标查 images"的实现必然取到另一张图。
 *
 * | materials 下标 | 槽位 | textureInfo.index | textures 下标 | source | images 下标 | 来源 |
 * |---|---|---|---|---|---|---|
 * | 0 | baseColorTexture | 0 | 0 | 1 | 1 | `albedo-texture.png`（uri） |
 * | 1 | baseColorTexture | 1 | 1 | 0 | 0 | `bufferView: 2` + `mimeType: image/jpeg` |
 * | 1 | normalTexture | 0 | 0 | 1 | 1 | 同上（同一张图被两个槽位引用） |
 * | 2 | （无） | — | — | — | — | 无贴图，应当为空数组 |
 */
function makeTexturesGltf(): string
{
    return JSON.stringify({
        asset: { version: '2.0' },
        buffers: [{ byteLength: BUFFER_BYTES, uri: makeBufferUri() }],
        bufferViews: [
            { buffer: 0, byteOffset: 0, byteLength: 36 },
            { buffer: 0, byteOffset: 36, byteLength: 6 },
            // images[0] 的像素数据（内容不重要，本加载器不读它）
            { buffer: 0, byteOffset: 0, byteLength: 6 },
        ],
        accessors: [
            { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' },
            { bufferView: 1, componentType: 5123, count: 3, type: 'SCALAR' },
        ],
        samplers: [
            // 0：REPEAT + MIRRORED_REPEAT + LINEAR + LINEAR_MIPMAP_LINEAR
            { wrapS: 10497, wrapT: 33648, magFilter: 9729, minFilter: 9987, name: 'repeatSampler' },
            // 1：CLAMP_TO_EDGE + NEAREST + NEAREST（不写 name）
            { wrapS: 33071, wrapT: 33071, magFilter: 9728, minFilter: 9728 },
        ],
        images: [
            // 0：bufferView 形式（没有 uri，靠 mimeType 说明格式）
            { bufferView: 2, mimeType: 'image/jpeg', name: 'embedded-jpeg' },
            // 1：uri 形式（相对路径）
            { uri: 'albedo-texture.png', mimeType: 'image/png', name: 'albedo' },
            // 2：内嵌 data URI（原样保留，不解码、不截断）
            { uri: EMBEDDED_PNG_DATA_URI, name: 'inline-png' },
        ],
        textures: [
            // source 故意与下标错开：textures[0] 用 images[1]
            { source: 1, sampler: 0, name: 'albedoTex' },
            // textures[1] 用 images[0]，不给 sampler（不填充缺省采样器）
            { source: 0, name: 'jpegTex' },
            // textures[2] 用内嵌 data URI 那张图，采样器给 1
            { source: 2, sampler: 1 },
        ],
        materials: [
            // 0：引用 textures[0] → images[1]（albedo-texture.png），texCoord 显式写 1
            {
                name: 'MatA',
                pbrMetallicRoughness: { baseColorTexture: { index: 0, texCoord: 1 } },
            },
            // 1：baseColorTexture 引用 textures[1] → images[0]（bufferView 形式）；
            //    再挂一个 normalTexture 复用 textures[0] → images[1]
            {
                name: 'MatB',
                pbrMetallicRoughness: { baseColorTexture: { index: 1 } },
                normalTexture: { index: 0, scale: 0.5 },
            },
            // 2：完全没有贴图
            { name: 'MatC', pbrMetallicRoughness: { baseColorFactor: [1, 0, 0, 1] } },
        ],
        meshes: [
            {
                primitives: [
                    { attributes: { POSITION: 0 }, indices: 1, material: 0 },
                    { attributes: { POSITION: 0 }, indices: 1, material: 1 },
                    { attributes: { POSITION: 0 }, indices: 1, material: 2 },
                ],
            },
        ],
        nodes: [{ mesh: 0 }],
        scenes: [{ nodes: [0] }],
    });
}

describe('GLTFLoader 纹理索引链（issue #96：只解析来源，不加载图片）', () =>
{
    const result = parseGLTF(makeTexturesGltf());
    const [primA, primB, primC] = result.primitives;

    it('两个材质交叉引用两个 image：索引链走到各自 images[] 那一条（textures 层不可跳过）', () =>
    {
        // 材质 0 → textures[0]（source 1）→ images[1].uri
        expect(primA.textures).toHaveLength(1);
        expect(primA.textures[0].slot).toBe('baseColorTexture');
        expect(primA.textures[0].textureIndex).toBe(0);
        expect(primA.textures[0].texCoord).toBe(1);
        expect(primA.textures[0].texture.uri).toBe('albedo-texture.png');
        expect(primA.textures[0].texture.sourceIndex).toBe(1);
        expect(primA.textures[0].texture.imageIndex).toBe(1);

        // 材质 1 → textures[1]（source 0）→ images[0]（bufferView 形式，没有 uri）
        expect(primB.textures[0].texture.uri).toBeUndefined();
        expect(primB.textures[0].texture.sourceIndex).toBe(0);
        expect(primB.textures[0].texture.bufferView).toBe(2);
        expect(primB.textures[0].texture.imageName).toBe('embedded-jpeg');

        // 两张图的 uri 必然不同：若实现把材质下标当 images 下标，两者会互换而失败
        expect(primA.textures[0].texture.uri).not.toBe(primB.textures[0].texture.uri);
        expect(primA.textures[0].texture.textureIndex).not.toBe(primB.textures[0].texture.textureIndex);

        // 与 GLTFResult.textures 是同一份数据（按 textures 下标对齐）
        expect(result.textures).toHaveLength(3);
        expect(result.textures[0]).toBe(primA.textures[0].texture);
        expect(result.textures[1]).toBe(primB.textures[0].texture);
    });

    it('image 用 bufferView + mimeType 形式时 mimeType 被保留（没有 uri）', () =>
    {
        const info = result.textures[1];
        expect(info.uri).toBeUndefined();
        expect(info.mimeType).toBe('image/jpeg');
        expect(info.bufferView).toBe(2);
        expect(info.sourceIndex).toBe(0);
        // textures[1] 没写 sampler：不填充 glTF 缺省采样器的值，也没有 samplerIndex
        expect(info.samplerIndex).toBeUndefined();
        expect(info.wrapS).toBeUndefined();
        expect(info.magFilter).toBeUndefined();
    });

    it('内嵌 data: URI 原样保留（不解码、不截断）', () =>
    {
        const info = result.textures[2];
        expect(info.uri).toBe(EMBEDDED_PNG_DATA_URI);
        expect(info.uri!.startsWith('data:image/png;base64,')).toBe(true);
        // 长度与原文一致（既没被解码成二进制，也没被截断到逗号前）
        expect(info.uri!.length).toBe(EMBEDDED_PNG_DATA_URI.length);
        expect(info.imageName).toBe('inline-png');
    });

    it('samplers 的 wrapS/wrapT/magFilter/minFilter 按数字枚举原样保留', () =>
    {
        // textures[0].sampler = 0
        const info = result.textures[0];
        expect(info.samplerIndex).toBe(0);
        expect(info.wrapS).toBe(10497);
        expect(info.wrapT).toBe(33648);
        expect(info.magFilter).toBe(9729);
        expect(info.minFilter).toBe(9987);

        // textures[2].sampler = 1（另一组值，证明取的是该纹理自己的采样器）
        expect(result.textures[2].samplerIndex).toBe(1);
        expect(result.textures[2].wrapS).toBe(33071);
        expect(result.textures[2].wrapT).toBe(33071);
        expect(result.textures[2].magFilter).toBe(9728);
        expect(result.textures[2].minFilter).toBe(9728);
    });

    it('同一材质可引用多张贴图（槽位按固定顺序列出），无贴图的材质为空数组', () =>
    {
        // 材质 1：baseColorTexture + normalTexture，顺序固定为 baseColor 在前
        expect(primB.textures.map((usage) => usage.slot)).toEqual(['baseColorTexture', 'normalTexture']);
        // normalTexture 复用 textures[0]（同一张图被两个槽位引用）
        expect(primB.textures[1].texture).toBe(result.textures[0]);
        expect(primB.textures[1].texCoord).toBe(0);

        // 材质 2 没有贴图 → 空数组；其因子映射不受影响
        expect(primC.textures).toEqual([]);
        expect(primC.material.uniforms?.u_diffuse).toEqual({ __type__: 'Color4', r: 1, g: 0, b: 0, a: 1 });

        // 因子与索引链是两条独立产物：材质 0 的因子仍是缺省白
        expect(primA.material.uniforms?.u_diffuse).toEqual({ __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 });
        expect(primA.material.name).toBe('MatA');
    });

    it('没有 textures/images/samplers 的文档不受影响（三个数组都为空）', () =>
    {
        const plain = parseGLTF(JSON.stringify({
            asset: { version: '2.0' },
            buffers: [{ byteLength: BUFFER_BYTES, uri: makeBufferUri() }],
            bufferViews: [
                { buffer: 0, byteOffset: 0, byteLength: 36 },
                { buffer: 0, byteOffset: 36, byteLength: 6 },
            ],
            accessors: [
                { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' },
                { bufferView: 1, componentType: 5123, count: 3, type: 'SCALAR' },
            ],
            materials: [{ name: 'NoTex', pbrMetallicRoughness: { baseColorFactor: [0.5, 0.5, 0.5, 1] } }],
            meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1, material: 0 }] }],
            nodes: [{ mesh: 0 }],
            scenes: [{ nodes: [0] }],
        }));

        expect(plain.textures).toEqual([]);
        expect(plain.primitives).toHaveLength(1);
        expect(plain.primitives[0].textures).toEqual([]);
        // 几何与因子的既有行为完全不变
        expect(plain.primitives[0].geometry.indices!.length).toBe(3);
        expect(plain.primitives[0].material.uniforms?.u_diffuse).toEqual({ __type__: 'Color4', r: 0.5, g: 0.5, b: 0.5, a: 1 });
    });
});

describe('GLTFLoader 真实资源 collision-world.glb（自带 1 个 texture，无 samplers）', () =>
{
    const glbPath = new URL('../../../examples/resources/collision-world.glb', import.meta.url);
    const fileBuffer = readFileSync(glbPath);
    const result = parseGLB(fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength));

    it('textures[0].source → images[0]（bufferView + image/png），材质按 baseColorTexture 引用它', () =>
    {
        // 实测该 GLB 的 JSON chunk 里为：
        // textures: [{ source: 0 }]
        // images:   [{ bufferView: 4, mimeType: 'image/png', name: 'bluegrid3' }]
        // samplers: 不存在
        // materials[0].pbrMetallicRoughness.baseColorTexture: { index: 0, texCoord: 0 }
        expect(result.textures).toHaveLength(1);
        expect(result.textures[0].textureIndex).toBe(0);
        expect(result.textures[0].sourceIndex).toBe(0);
        expect(result.textures[0].imageIndex).toBe(0);
        expect(result.textures[0].imageName).toBe('bluegrid3');
        expect(result.textures[0].mimeType).toBe('image/png');
        expect(result.textures[0].bufferView).toBe(4);
        // 没有 uri（像素在 buffer 里），也没有 sampler（文档里没有 samplers 数组）
        expect(result.textures[0].uri).toBeUndefined();
        expect(result.textures[0].samplerIndex).toBeUndefined();

        // 每个 primitive 的材质都引用了这张图（该资源只有一个材质）
        expect(result.primitives.length).toBeGreaterThanOrEqual(1);
        for (const primitive of result.primitives)
        {
            expect(primitive.textures).toHaveLength(1);
            expect(primitive.textures[0].slot).toBe('baseColorTexture');
            expect(primitive.textures[0].texture).toBe(result.textures[0]);
        }
    });

    it('几何与材质因子断言口径不变（纹理解析不改变既有产物）', () =>
    {
        expect(result.primitives[0].material.__type__).toBe('StandardMaterial');
        expect(result.primitives[0].material.name).toBe('Material.001');
        expect(result.primitives[0].geometry.indices!.length).toBe(5262);
    });
});
