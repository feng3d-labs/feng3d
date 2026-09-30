import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// 必须最先：feng3d barrel 会拉起 @feng3d/webgpu，先 stub 全局（与 feng3d 自家 spec 同模式）
import './browser-stub';

import { logic, type GeometryLogic } from 'feng3d';
import { parseGLB, parseGLTF, loadGltfFromUrl } from '../src/loaders/GLTFLoader';

/**
 * GLTFLoader 回归测试。
 *
 * 覆盖三件事：
 * 1. 真实资源（collision-world.glb，1754 个三角形）能解析出有限、非空的几何；
 * 2. 一个 mesh 的**多个 primitive** 全部产出（自造双 primitive 最小 GLB）；
 * 3. 节点 TRS 被正确烘焙（自造 translate / scale / 嵌套父子 / 四元数旋转的最小 GLB）。
 */

/** 把 number 数组补齐到 4 字节边界 */
function pad4(bytes: Uint8Array, padding: number): Uint8Array
{
    const remainder = bytes.length % 4;
    if (remainder === 0) return bytes;

    const out = new Uint8Array(bytes.length + (4 - remainder));
    out.set(bytes);
    out.fill(padding, bytes.length);

    return out;
}

/** 拼接两个 Uint8Array */
function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array
{
    const out = new Uint8Array(a.length + b.length);
    out.set(a, 0);
    out.set(b, a.length);

    return out;
}

/**
 * 手写最小 GLB 二进制容器：header(12) + JSON chunk + BIN chunk。
 *
 * @param json glTF JSON 文档
 * @param bin 二进制 buffer（BIN chunk 内容）
 */
function makeGLB(json: Record<string, unknown>, bin: Uint8Array): ArrayBuffer
{
    const jsonBytes = pad4(new TextEncoder().encode(JSON.stringify(json)), 0x20);
    const binBytes = pad4(bin, 0x00);
    const totalLength = 12 + 8 + jsonBytes.length + 8 + binBytes.length;

    const out = new Uint8Array(totalLength);
    const view = new DataView(out.buffer);

    // header
    view.setUint32(0, 0x46546c67, true); // 'glTF'
    view.setUint32(4, 2, true);
    view.setUint32(8, totalLength, true);

    // JSON chunk
    view.setUint32(12, jsonBytes.length, true);
    view.setUint32(16, 0x4e4f534a, true); // 'JSON'
    out.set(jsonBytes, 20);

    // BIN chunk
    const binChunkStart = 20 + jsonBytes.length;
    view.setUint32(binChunkStart, binBytes.length, true);
    view.setUint32(binChunkStart + 4, 0x004e4942, true); // 'BIN\0'
    out.set(binBytes, binChunkStart + 8);

    return out.buffer;
}

/**
 * 两个三角形、**两个 primitive** 的最小二进制。
 *
 * 布局（共 84 字节，每个 primitive 的索引各自从 0 起）：
 * `0..36` prim0 顶点（3×float32x3）、`36..42` prim0 索引（3×uint16）、
 * `42..48` 填充、`48..84` prim1 顶点、`84..90` prim1 索引。
 */
function makeTwoPrimitiveBin(): Uint8Array
{
    const prim0Positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    // 沿 X 偏移 100，便于区分是哪一个 primitive 被产出
    const prim1Positions = new Float32Array([100, 0, 0, 101, 0, 0, 100, 1, 0]);
    const indices = new Uint16Array([0, 1, 2]);

    const out = new Uint8Array(90);
    out.set(new Uint8Array(prim0Positions.buffer), 0);
    out.set(new Uint8Array(indices.buffer), 36);
    out.set(new Uint8Array(prim1Positions.buffer), 48);
    out.set(new Uint8Array(indices.buffer), 84);

    return out;
}

/** 生成只有一个 mesh、该 mesh 含两个 primitive 的 glTF JSON */
function makeTwoPrimitiveJson(nodeExtra: Record<string, unknown>): Record<string, unknown>
{
    return {
        asset: { version: '2.0' },
        buffers: [{ byteLength: 90 }],
        bufferViews: [
            { buffer: 0, byteOffset: 0, byteLength: 36 },
            { buffer: 0, byteOffset: 36, byteLength: 6 },
            { buffer: 0, byteOffset: 48, byteLength: 36 },
            { buffer: 0, byteOffset: 84, byteLength: 6 },
        ],
        accessors: [
            { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' },
            { bufferView: 1, componentType: 5123, count: 3, type: 'SCALAR' },
            { bufferView: 2, componentType: 5126, count: 3, type: 'VEC3' },
            { bufferView: 3, componentType: 5123, count: 3, type: 'SCALAR' },
        ],
        meshes: [
            {
                name: 'TwoPrims',
                primitives: [
                    { attributes: { POSITION: 0 }, indices: 1 },
                    { attributes: { POSITION: 2 }, indices: 3 },
                ],
            },
        ],
        nodes: [{ mesh: 0, name: 'TwoPrimsNode', ...nodeExtra }],
        scenes: [{ nodes: [0] }],
    };
}

/** 单三角形最小 GLB（3 顶点 + 3 索引），节点变换由 nodeExtra 指定 */
function makeSingleTriangleGLB(nodeExtra: Record<string, unknown>): ArrayBuffer
{
    const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    const indices = new Uint16Array([0, 1, 2]);
    const bin = new Uint8Array(concatBytes(new Uint8Array(positions.buffer), new Uint8Array(indices.buffer)));

    return makeGLB({
        asset: { version: '2.0' },
        buffers: [{ byteLength: 42 }],
        bufferViews: [
            { buffer: 0, byteOffset: 0, byteLength: 36 },
            { buffer: 0, byteOffset: 36, byteLength: 6 },
        ],
        accessors: [
            { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' },
            { bufferView: 1, componentType: 5123, count: 3, type: 'SCALAR' },
        ],
        meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }],
        nodes: [{ mesh: 0, ...nodeExtra }],
        scenes: [{ nodes: [0] }],
    }, bin);
}

/** 取第一个 primitive 的顶点坐标（number[]） */
function firstPrimitivePositions(result: ReturnType<typeof parseGLB>): number[]
{
    const positions = result.primitives[0]?.geometry.positions;

    return positions ? Array.from(positions) : [];
}

describe('GLTFLoader', () =>
{
    describe('真实资源 collision-world.glb', () =>
    {
        const glbPath = new URL('../../../examples/resources/collision-world.glb', import.meta.url);
        const fileBuffer = readFileSync(glbPath);
        const result = parseGLB(fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength));

        it('解析出非空几何，索引数量与 1754 个三角形一致', () =>
        {
            expect(result.primitives.length).toBeGreaterThanOrEqual(1);
            const primitive = result.primitives[0];
            const indices = primitive.geometry.indices;
            expect(indices).toBeTruthy();
            expect(indices!.length).toBeGreaterThan(0);
            // 实测：该资源 indices accessor count = 5262 == 1754 个三角形 × 3
            expect(indices!.length).toBe(5262);
            expect(indices!.length / 3).toBe(1754);
        });

        it('顶点坐标全部有限，且顶点数与索引引用范围自洽', () =>
        {
            const positions = firstPrimitivePositions(result);
            expect(positions.length).toBeGreaterThan(0);
            expect(positions.length % 3).toBe(0);

            for (const value of positions) expect(Number.isFinite(value)).toBe(true);

            const vertexCount = positions.length / 3;
            const indices = result.primitives[0].geometry.indices!;
            for (const index of indices)
            {
                expect(Number.isInteger(index)).toBe(true);
                expect(index).toBeGreaterThanOrEqual(0);
                expect(index).toBeLessThan(vertexCount);
            }
        });

        it('节点变换（该资源为 scale 0.5 + translation）被烘焙进顶点，坐标不再是局部坐标', () =>
        {
            // 原始 accessor 的 POSITION.min.x = -45.766，节点 scale = 0.5 且 translation.x = 7.679
            // 烘焙后 min.x 应变为 -45.766 * 0.5 + 7.679 ≈ -15.20（局部坐标下仍是 -45.766）
            const positions = firstPrimitivePositions(result);
            let minX = Infinity;
            for (let i = 0; i < positions.length; i += 3) minX = Math.min(minX, positions[i]);

            expect(minX).toBeCloseTo(-45.76599884033203 * 0.5 + 7.67926025390625, 3);
        });

        it('产出的几何能被引擎 logic 消费：顶点属性就绪且顶点数一致', () =>
        {
            const geometryLogic = logic(result.primitives[0].geometry) as GeometryLogic;
            const positionAttr = geometryLogic.vertices.a_position;

            expect(positionAttr).toBeTruthy();
            expect(positionAttr!.data.length).toBe(result.primitives[0].vertexCount * 3);
            expect(geometryLogic.vertexIndices.length).toBe(5262);

            for (const value of positionAttr!.data) expect(Number.isFinite(value)).toBe(true);

            const normalAttr = geometryLogic.vertices.a_normal;
            expect(normalAttr).toBeTruthy();
            expect(normalAttr!.data.length).toBe(result.primitives[0].vertexCount * 3);
        });
    });

    describe('一个 mesh 的多个 primitive 全部产出', () =>
    {
        const result = parseGLB(makeGLB(makeTwoPrimitiveJson({}), makeTwoPrimitiveBin()));

        it('两个 primitive 都产出（数量 == 2，而不是只取第一个）', () =>
        {
            expect(result.meshes.length).toBe(1);
            expect(result.meshes[0].primitives.length).toBe(2);
            expect(result.primitives.length).toBe(2);
            expect(result.meshes[0].primitives.map((p) => p.primitiveIndex)).toEqual([0, 1]);
        });

        it('两个 primitive 各自产出独立几何，顶点数据分别对应各自的 accessor', () =>
        {
            const positions0 = Array.from(result.primitives[0].geometry.positions!);
            const positions1 = Array.from(result.primitives[1].geometry.positions!);

            expect(positions0).toEqual([0, 0, 0, 1, 0, 0, 0, 1, 0]);
            expect(positions1).toEqual([100, 0, 0, 101, 0, 0, 100, 1, 0]);
            expect(result.primitives[0].geometry.indices!.length).toBe(3);
            expect(result.primitives[1].geometry.indices!.length).toBe(3);
        });

        it('两个 primitive 的 MeshRenderer 组件都挂在同一个节点下', () =>
        {
            const components = result.root.children![0].components!;
            expect(components.length).toBe(2);
            for (const component of components) expect(component.__type__).toBe('MeshRenderer');
        });
    });

    describe('节点变换烘焙到顶点', () =>
    {
        it('translation [10,0,0] 把顶点平移', () =>
        {
            const result = parseGLB(makeSingleTriangleGLB({ translation: [10, 0, 0] }));
            expect(firstPrimitivePositions(result)).toEqual([10, 0, 0, 11, 0, 0, 10, 1, 0]);
        });

        it('scale [2,2,2] 把顶点缩放', () =>
        {
            const result = parseGLB(makeSingleTriangleGLB({ scale: [2, 2, 2] }));
            expect(firstPrimitivePositions(result)).toEqual([0, 0, 0, 2, 0, 0, 0, 2, 0]);
        });

        it('T × R × S 组合顺序正确：translation + rotation(180° 绕 Z) + scale', () =>
        {
            // 绕 Z 轴 180°：(x,y) → (-x,-y)；再缩放 2 倍、最后平移 [10,0,0]
            const result = parseGLB(makeSingleTriangleGLB({
                translation: [10, 0, 0],
                rotation: [0, 0, 1, 0],
                scale: [2, 2, 2],
            }));
            const positions = firstPrimitivePositions(result);

            expect(positions[0]).toBeCloseTo(10, 6);
            expect(positions[1]).toBeCloseTo(0, 6);
            expect(positions[2]).toBeCloseTo(0, 6);
            expect(positions[3]).toBeCloseTo(8, 6);
            expect(positions[4]).toBeCloseTo(0, 6);
            expect(positions[5]).toBeCloseTo(0, 6);
            expect(positions[6]).toBeCloseTo(10, 6);
            expect(positions[7]).toBeCloseTo(-2, 6);
            expect(positions[8]).toBeCloseTo(0, 6);
        });

        it('父子节点变换累乘：父 translation [5,0,0] × 子 translation [10,0,0] = [15,0,0]', () =>
        {
            const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
            const indices = new Uint16Array([0, 1, 2]);
            const bin = new Uint8Array(concatBytes(new Uint8Array(positions.buffer), new Uint8Array(indices.buffer)));

            const result = parseGLB(makeGLB({
                asset: { version: '2.0' },
                buffers: [{ byteLength: 42 }],
                bufferViews: [
                    { buffer: 0, byteOffset: 0, byteLength: 36 },
                    { buffer: 0, byteOffset: 36, byteLength: 6 },
                ],
                accessors: [
                    { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' },
                    { bufferView: 1, componentType: 5123, count: 3, type: 'SCALAR' },
                ],
                meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }],
                // 父节点不挂 mesh，子节点挂 mesh
                nodes: [
                    { name: 'Parent', translation: [5, 0, 0], children: [1] },
                    { mesh: 0, name: 'Child', translation: [10, 0, 0] },
                ],
                scenes: [{ nodes: [0] }],
            }, bin));

            // 父变换必须累乘到子节点的几何上（局部坐标只会是 10）
            expect(firstPrimitivePositions(result)).toEqual([15, 0, 0, 16, 0, 0, 15, 1, 0]);
            // 层级保留：父 → 子
            expect(result.root.children!.length).toBe(1);
            expect(result.root.children![0].name).toBe('Parent');
            expect(result.root.children![0].children![0].name).toBe('Child');
            expect(result.primitives[0].nodeIndex).toBe(1);
        });
    });

    describe('.gltf + 内嵌 base64 buffer', () =>
    {
        it('data: URI 内嵌的 base64 buffer 能被解码并用于几何', () =>
        {
            const positions = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            const indices = new Uint16Array([0, 1, 2]);
            const bin = new Uint8Array(concatBytes(new Uint8Array(positions.buffer), new Uint8Array(indices.buffer)));
            const base64 = Buffer.from(bin).toString('base64');

            const gltf = JSON.stringify({
                asset: { version: '2.0' },
                buffers: [{ byteLength: bin.length, uri: `data:application/octet-stream;base64,${base64}` }],
                bufferViews: [
                    { buffer: 0, byteOffset: 0, byteLength: 36 },
                    { buffer: 0, byteOffset: 36, byteLength: 6 },
                ],
                accessors: [
                    { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' },
                    { bufferView: 1, componentType: 5123, count: 3, type: 'SCALAR' },
                ],
                meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }],
                nodes: [{ mesh: 0 }],
                scenes: [{ nodes: [0] }],
            });

            const result = parseGLTF(gltf);
            expect(firstPrimitivePositions(result)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            expect(result.primitives[0].geometry.indices!.length).toBe(3);
        });

        it('外部文件 URI 显式报错而不是静默产出空几何', () =>
        {
            const gltf = JSON.stringify({
                asset: { version: '2.0' },
                buffers: [{ byteLength: 36, uri: 'buffer.bin' }],
                bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 36 }],
                accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' }],
                meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
                nodes: [{ mesh: 0 }],
                scenes: [{ nodes: [0] }],
            });

            expect(() => parseGLTF(gltf)).toThrow(/外部 URI/);
        });
    });

    describe('loadGltfFromUrl 按内容魔数分发', () =>
    {
        const encoder = new TextEncoder();

        /** 用给定字节冒充 fetch 的响应体，跑完回调后恢复原 fetch */
        async function withFetchBody(body: Uint8Array, run: () => Promise<void>): Promise<void>
        {
            const originalFetch = globalThis.fetch;
            globalThis.fetch = (async () => new Response(body)) as unknown as typeof globalThis.fetch;
            try
            {
                await run();
            }
            finally
            {
                globalThis.fetch = originalFetch;
            }
        }

        it('响应体是 GLB 时走二进制解析', async () =>
        {
            const glb = makeSingleTriangleGLB({ translation: [10, 0, 0] });

            await withFetchBody(new Uint8Array(glb), async () =>
            {
                const result = await loadGltfFromUrl('model.glb');
                expect(firstPrimitivePositions(result)).toEqual([10, 0, 0, 11, 0, 0, 10, 1, 0]);
            });
        });

        it('响应体是 JSON 文档时走 .gltf 解析（后缀无关）', async () =>
        {
            const positions = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            const indices = new Uint16Array([0, 1, 2]);
            const bin = new Uint8Array(concatBytes(new Uint8Array(positions.buffer), new Uint8Array(indices.buffer)));
            const gltf = JSON.stringify({
                asset: { version: '2.0' },
                buffers: [{ byteLength: bin.length, uri: `data:application/octet-stream;base64,${Buffer.from(bin).toString('base64')}` }],
                bufferViews: [
                    { buffer: 0, byteOffset: 0, byteLength: 36 },
                    { buffer: 0, byteOffset: 36, byteLength: 6 },
                ],
                accessors: [
                    { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' },
                    { bufferView: 1, componentType: 5123, count: 3, type: 'SCALAR' },
                ],
                meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }],
                nodes: [{ mesh: 0 }],
                scenes: [{ nodes: [0] }],
            });

            // 故意用没有 .gltf 后缀的 URL：分发靠内容而不是后缀
            await withFetchBody(encoder.encode(gltf), async () =>
            {
                const result = await loadGltfFromUrl('https://example.com/model');
                expect(firstPrimitivePositions(result)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            });
        });
    });
});
