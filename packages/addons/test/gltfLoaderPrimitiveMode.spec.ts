import { describe, expect, it } from 'vitest';

// 必须最先：feng3d barrel 会拉起 @feng3d/webgpu，先 stub 全局（与 gltfLoaderMaterials.spec.ts 同模式）
import './browser-stub';

import { parseGLTF } from '../src/loaders/GLTFLoader';

/**
 * issue #345：glTF 非三角形 `mode` 未分流——`TRIANGLE_STRIP(5)`/`TRIANGLE_FAN(6)` 此前被当成
 * 三角形列表渲染，索引串错位（几何错乱且不报错）。
 *
 * 加载器现在在 **primitive 一级**把索引展开成独立三角形列表（一个 glTF 材质可被多个 `mode` 不同的
 * primitive 共用，挂在材质拓扑上无法同时表达），展开后 `mode` 记为 `4`。
 *
 * 本 spec 用一份紧凑的 `.gltf`（内嵌 base64 buffer，沿用 `gltfLoaderMaterials.spec.ts` 的构造法）
 * 覆盖：
 * 1. `TRIANGLE_STRIP` 的展开索引逐个等于手算值（含奇数三角形的**绕序交换**）；
 * 2. `TRIANGLE_FAN` 的展开索引逐个等于手算值（第 0 个顶点当扇心）；
 * 3. 两者三角形个数 = 顶点数 - 2，展开后 `mode === 4`；
 * 4. `TRIANGLES(4)` 与缺省 mode 的索引**一字不改**（防回归）；
 * 5. 非三角形 mode（POINTS/LINES/LINE_LOOP/LINE_STRIP）与未知 mode **显式抛错**且信息带 `mode` 值。
 */

/** 5 个顶点 × VEC3 float32 = 60 字节（偏移 0） */
const POSITION_BYTES = 60;
/** 5 个 uint16 索引 = 10 字节（偏移 60） */
const INDICES5_OFFSET = 60;
/** 4 个 uint16 索引 = 8 字节（偏移 70） */
const INDICES4_OFFSET = 70;
/** buffer 总长 */
const BUFFER_BYTES = 78;

/** 造二进制 buffer：5 个顶点 + 两组索引（5 个、4 个） */
function makeBin(): Uint8Array
{
    const positions = new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0.5, 0.5, 0.5]);
    const indices5 = new Uint16Array([0, 1, 2, 3, 4]);
    const indices4 = new Uint16Array([0, 1, 2, 3]);

    const bin = new Uint8Array(BUFFER_BYTES);
    bin.set(new Uint8Array(positions.buffer), 0);
    bin.set(new Uint8Array(indices5.buffer), INDICES5_OFFSET);
    bin.set(new Uint8Array(indices4.buffer), INDICES4_OFFSET);

    return bin;
}

/** 内嵌 base64 buffer 的 uri */
function makeBufferUri(): string
{
    return `data:application/octet-stream;base64,${Buffer.from(makeBin()).toString('base64')}`;
}

/** 两个文档共用的 buffers/bufferViews/accessors 段 */
function makeBufferSection(): Record<string, unknown>
{
    return {
        buffers: [{ byteLength: BUFFER_BYTES, uri: makeBufferUri() }],
        bufferViews: [
            { buffer: 0, byteOffset: 0, byteLength: POSITION_BYTES },
            { buffer: 0, byteOffset: INDICES5_OFFSET, byteLength: 10 },
            { buffer: 0, byteOffset: INDICES4_OFFSET, byteLength: 8 },
        ],
        accessors: [
            { bufferView: 0, componentType: 5126, count: 5, type: 'VEC3' },
            { bufferView: 1, componentType: 5123, count: 5, type: 'SCALAR' },
            { bufferView: 2, componentType: 5123, count: 4, type: 'SCALAR' },
        ],
    };
}

/**
 * 造一份含 6 个 primitive 的 `.gltf`：
 * 0. `mode: 5` + 5 个索引；1. `mode: 6` + 5 个索引；2. `mode: 4`；3. 缺省 mode；
 * 4. `mode: 5` + 4 个索引（issue 里的示例 `[0,1,2,3]`）；5. `mode: 5` 且**无 indices**（顶点顺序）。
 */
function makeModeGltf(): string
{
    return JSON.stringify({
        asset: { version: '2.0' },
        ...makeBufferSection(),
        meshes: [
            {
                primitives: [
                    { attributes: { POSITION: 0 }, indices: 1, mode: 5 },
                    { attributes: { POSITION: 0 }, indices: 1, mode: 6 },
                    { attributes: { POSITION: 0 }, indices: 1, mode: 4 },
                    { attributes: { POSITION: 0 }, indices: 1 },
                    { attributes: { POSITION: 0 }, indices: 2, mode: 5 },
                    { attributes: { POSITION: 0 }, mode: 5 },
                ],
            },
        ],
        nodes: [{ mesh: 0 }],
        scenes: [{ nodes: [0] }],
    });
}

/** 造一份只含单个指定 `mode` 的 `.gltf`（用于不支持 mode 的抛错断言） */
function makeSingleModeGltf(mode: number): string
{
    return JSON.stringify({
        asset: { version: '2.0' },
        ...makeBufferSection(),
        meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1, mode }] }],
        nodes: [{ mesh: 0 }],
        scenes: [{ nodes: [0] }],
    });
}

/** 手算的 5 顶点 strip 展开结果（索引 [0,1,2,3,4]，第 1、3 组为奇数 → 交换后两个顶点） */
const STRIP5_EXPECTED = [0, 1, 2, 2, 1, 3, 2, 3, 4];
/** 手算的 5 顶点 fan 展开结果（第 0 个顶点当扇心） */
const FAN5_EXPECTED = [0, 1, 2, 0, 2, 3, 0, 3, 4];
/** 手算的 4 顶点 strip 展开结果（issue 正文的示例，[0,1,2,3] → [0,1,2, 2,1,3]） */
const STRIP4_EXPECTED = [0, 1, 2, 2, 1, 3];
/** TRIANGLES 与缺省 mode 必须原样保留的索引 */
const RAW_INDICES = [0, 1, 2, 3, 4];

/** 逐索引断言，失败信息带上"第几组三角形的第几个顶点"，便于看出是绕序问题 */
function expectIndicesOneByOne(actual: readonly number[], expected: readonly number[]): void
{
    expect(actual.length).toBe(expected.length);
    for (let i = 0; i < expected.length; i++)
    {
        expect(actual[i], `第 ${i} 个索引（三角形组 ${Math.floor(i / 3)} 的第 ${i % 3} 个顶点）`).toBe(expected[i]);
    }
}

describe('GLTFLoader primitive mode 分流（issue #345）', () =>
{
    const result = parseGLTF(makeModeGltf());
    const indexList = result.primitives.map((primitive) => primitive.geometry.indices as number[]);

    it('TRIANGLE_STRIP 的展开索引逐个等于手算值（奇数三角形交换后两个顶点）', () =>
    {
        // [0,1,2,3,4] → [0,1,2,  2,1,3,  2,3,4]（注意第二组是 2,1,3 而不是 1,2,3）
        // 先逐索引比对：失败信息会指出"第几个索引（第几组三角形的第几个顶点）"，绕序问题一眼可见
        expectIndicesOneByOne(indexList[0], STRIP5_EXPECTED);
        expect(indexList[0]).toEqual(STRIP5_EXPECTED);

        // 4 顶点（issue 正文示例）：[0,1,2,3] → [0,1,2,  2,1,3]
        expectIndicesOneByOne(indexList[4], STRIP4_EXPECTED);
        expect(indexList[4]).toEqual(STRIP4_EXPECTED);

        // 无 indices 的 strip 走"顶点顺序即索引"，展开规则一致
        expect(indexList[5]).toEqual(STRIP5_EXPECTED);
    });

    it('TRIANGLE_FAN 的展开索引逐个等于手算值（固定第 0 个顶点当扇心）', () =>
    {
        expect(indexList[1]).toEqual(FAN5_EXPECTED);
        expectIndicesOneByOne(indexList[1], FAN5_EXPECTED);
        // 扇心恒为第 0 个顶点
        for (let i = 0; i < FAN5_EXPECTED.length; i += 3)
        {
            expect(FAN5_EXPECTED[i]).toBe(0);
        }
    });

    it('strip/fan 展开后三角形个数 = 顶点数 - 2，且 mode 归一化为 4', () =>
    {
        const strip = result.primitives[0];
        const fan = result.primitives[1];

        expect(strip.vertexCount).toBe(5);
        expect(fan.vertexCount).toBe(5);

        expect(indexList[0].length / 3).toBe(strip.vertexCount - 2);
        expect(indexList[1].length / 3).toBe(fan.vertexCount - 2);
        expect(indexList[0].length).toBe(3 * (strip.vertexCount - 2));

        expect(strip.mode).toBe(4);
        expect(fan.mode).toBe(4);
        // 未做转换的 primitive 也报 4（不变量：结果里的几何一律是三角形列表）
        expect(result.primitives.map((primitive) => primitive.mode)).toEqual([4, 4, 4, 4, 4, 4]);
    });

    it('TRIANGLES(4) 与缺省 mode 的索引一字不改（防回归）', () =>
    {
        expect(result.primitives[2].mode).toBe(4);
        expect(result.primitives[3].mode).toBe(4);

        expect(indexList[2]).toEqual(RAW_INDICES);
        expect(indexList[3]).toEqual(RAW_INDICES);
        // 长度也没变（没有被"顺手"展开）
        expect(indexList[2].length).toBe(5);
        expect(indexList[3].length).toBe(5);
    });

    it('展开不影响顶点数据（POSITION 数量与索引重排无关）', () =>
    {
        for (const primitive of result.primitives)
        {
            expect(primitive.geometry.positions?.length).toBe(15);
            expect(primitive.vertexCount).toBe(5);
        }
    });

    it('POINTS/LINES/LINE_LOOP/LINE_STRIP 显式抛错而非静默按三角形画', () =>
    {
        for (const mode of [0, 1, 2, 3])
        {
            // 错误信息必须带上 mode 值，否则调用方无法判断是哪种图元
            expect(() => parseGLTF(makeSingleModeGltf(mode))).toThrow(new RegExp(`mode ${mode} 不受支持`));
        }
    });

    it('未知 mode 同样显式抛错', () =>
    {
        expect(() => parseGLTF(makeSingleModeGltf(99))).toThrow(/mode 99 不受支持/);
    });
});
