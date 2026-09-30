import { describe, expect, it } from 'vitest';
import { parseGLTF } from '../src/loaders/GLTFLoader';

/**
 * glTF 动画的解析（issue #378）。
 *
 * 本文件只测**索引链与结构**（时长也从 input accessor 的 min/max 取得到），
 * 不测关键帧数据的读取——那不在本加载器的范围内（它解析结构、不接运行时播放）。
 *
 * 构造用例的要点：**让 channel → sampler 的指向"交叉"**（channel 0 指 sampler 1、
 * channel 1 指 sampler 0），这样"链走对了"才是可证的；如果两者恰好同序，
 * 就算实现里把 channel 下标当 sampler 下标用，测试也照样会过。
 */

/** 造一个带 animations 的最小 .gltf（buffer 用内嵌 base64，只为让 accessors 有据可依） */
function gltfWith(jsonExtras: Record<string, unknown>): string
{
    const base64 = Buffer.from(new Uint8Array(64)).toString('base64');

    return JSON.stringify({
        asset: { version: '2.0' },
        scene: 0,
        scenes: [{ nodes: [] }],
        buffers: [{ byteLength: 64, uri: `data:application/octet-stream;base64,${base64}` }],
        bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 64 }],
        accessors: [
            // 0：sampler 0 的时间（0 ~ 2 秒）
            { bufferView: 0, componentType: 5126, count: 2, type: 'SCALAR', min: [0], max: [2] },
            // 1：sampler 0 的值
            { bufferView: 0, componentType: 5126, count: 2, type: 'VEC3' },
            // 2：sampler 1 的时间（1 ~ 5 秒）
            { bufferView: 0, componentType: 5126, count: 2, type: 'SCALAR', min: [1], max: [5] },
            // 3：sampler 1 的值
            { bufferView: 0, componentType: 5126, count: 2, type: 'VEC3' },
        ],
        nodes: [{ name: 'Root' }, { name: 'Child' }],
        ...jsonExtras,
    });
}

describe('glTF 动画的解析（issue #378）', () =>
{
    it('没有 animations 的文档产出空数组（不影响既有行为）', () =>
    {
        const result = parseGLTF(gltfWith({}));

        expect(result.animations).toEqual([]);
    });

    it('索引链走对：channel 指向的 sampler 是交叉的，解析结果必须跟着走', () =>
    {
        const result = parseGLTF(gltfWith({
            animations: [{
                name: 'Spin',
                // channel 0 → sampler 1；channel 1 → sampler 0（**故意交叉**）
                channels: [
                    { sampler: 1, target: { node: 1, path: 'rotation' } },
                    { sampler: 0, target: { node: 0, path: 'translation' } },
                ],
                samplers: [
                    { input: 0, output: 1 },
                    { input: 2, output: 3, interpolation: 'STEP' },
                ],
            }],
        }));

        expect(result.animations).toHaveLength(1);
        const animation = result.animations[0];

        expect(animation.animationIndex).toBe(0);
        expect(animation.name).toBe('Spin');
        expect(animation.samplers).toHaveLength(2);
        expect(animation.channels).toHaveLength(2);

        // channel → sampler 的指向
        expect(animation.channels[0].samplerIndex).toBe(1);
        expect(animation.channels[1].samplerIndex).toBe(0);

        // channel 的目标
        expect(animation.channels[0].targetNode).toBe(1);
        expect(animation.channels[0].targetPath).toBe('rotation');
        expect(animation.channels[1].targetNode).toBe(0);
        expect(animation.channels[1].targetPath).toBe('translation');

        // sampler → accessor 的指向
        expect(animation.samplers[0].inputAccessor).toBe(0);
        expect(animation.samplers[0].outputAccessor).toBe(1);
        expect(animation.samplers[1].inputAccessor).toBe(2);
        expect(animation.samplers[1].outputAccessor).toBe(3);
    });

    it('时间范围取自 input accessor 的 min/max', () =>
    {
        const result = parseGLTF(gltfWith({
            animations: [{
                channels: [{ sampler: 0, target: { node: 0, path: 'scale' } }],
                samplers: [{ input: 0, output: 1 }],
            }],
        }));

        expect(result.animations[0].samplers[0].timeMin).toBe(0);
        expect(result.animations[0].samplers[0].timeMax).toBe(2);
    });

    it('整段动画的范围是各采样器范围的并集（不是第一个、也不是最后一个）', () =>
    {
        const result = parseGLTF(gltfWith({
            animations: [{
                channels: [
                    { sampler: 0, target: { node: 0, path: 'translation' } },
                    { sampler: 1, target: { node: 1, path: 'translation' } },
                ],
                // sampler 0: 0~2；sampler 1: 1~5 → 并集 0~5
                samplers: [{ input: 0, output: 1 }, { input: 2, output: 3 }],
            }],
        }));

        expect(result.animations[0].timeMin).toBe(0);
        expect(result.animations[0].timeMax).toBe(5);
    });

    it('interpolation 缺省是 LINEAR，非缺省值原样保留', () =>
    {
        const result = parseGLTF(gltfWith({
            animations: [{
                channels: [],
                samplers: [
                    { input: 0, output: 1 },                            // 缺省
                    { input: 2, output: 3, interpolation: 'CUBICSPLINE' },
                    { input: 0, output: 1, interpolation: 'STEP' },
                ],
            }],
        }));

        const samplers = result.animations[0].samplers;
        expect(samplers[0].interpolation).toBe('LINEAR');
        expect(samplers[1].interpolation).toBe('CUBICSPLINE');
        expect(samplers[2].interpolation).toBe('STEP');
    });

    it('下标越界或字段缺省时不抛错，如实保留', () =>
    {
        // target.node 指向不存在的节点；samplers 指向不存在的 accessor；target.path 缺省
        const result = parseGLTF(gltfWith({
            animations: [{
                channels: [
                    { sampler: 99, target: { node: 99 } },
                    { sampler: 0, target: {} },
                ],
                samplers: [{ input: 99, output: 98 }],
            }],
        }));

        const animation = result.animations[0];

        expect(animation.channels[0].samplerIndex).toBe(99);
        expect(animation.channels[0].targetNode).toBe(99);
        expect(animation.channels[0].targetPath).toBeUndefined();
        expect(animation.channels[1].targetNode).toBeUndefined();

        expect(animation.samplers[0].inputAccessor).toBe(99);
        expect(animation.samplers[0].outputAccessor).toBe(98);
        // 取不到 min/max 就是 undefined，不猜
        expect(animation.samplers[0].timeMin).toBeUndefined();
        expect(animation.samplers[0].timeMax).toBeUndefined();
        expect(animation.timeMin).toBeUndefined();
        expect(animation.timeMax).toBeUndefined();
    });

    it('多个 animation 各自独立解析', () =>
    {
        const result = parseGLTF(gltfWith({
            animations: [
                { name: 'A', channels: [{ sampler: 0, target: { node: 0, path: 'translation' } }], samplers: [{ input: 0, output: 1 }] },
                { channels: [{ sampler: 0, target: { node: 1, path: 'scale' } }], samplers: [{ input: 2, output: 3 }] },
            ],
        }));

        expect(result.animations).toHaveLength(2);
        expect(result.animations[0].name).toBe('A');
        expect(result.animations[0].animationIndex).toBe(0);
        expect(result.animations[0].timeMax).toBe(2);
        expect(result.animations[1].name).toBeUndefined();
        expect(result.animations[1].animationIndex).toBe(1);
        expect(result.animations[1].timeMax).toBe(5);
    });

    it('真实资源 collision-world.glb 仍能解析（其余字段不受影响）', async () =>
    {
        const { readFileSync } = await import('node:fs');
        const { parseGLB } = await import('../src/loaders/GLTFLoader');
        const buffer = readFileSync('examples/resources/collision-world.glb');
        const bytes = new Uint8Array(buffer);

        const result = parseGLB(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);

        // animations 至少是个数组（该资源可能没有动画，但字段必须存在且可迭代）
        expect(Array.isArray(result.animations)).toBe(true);
        // 既有产出不受影响
        expect(result.primitives.length).toBeGreaterThan(0);
    });
});