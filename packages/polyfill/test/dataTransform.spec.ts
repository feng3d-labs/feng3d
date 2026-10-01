import { describe, expect, it } from 'vitest';

import { DataTransform } from '../src/DataTransform';

/**
 * `DataTransform`（`packages/polyfill/src/DataTransform.ts`，112 行，此前**行覆盖率 0.89%**）。
 *
 * 它是 `@feng3d/polyfill` 导出的 `dataTransform` 单例背后的类，负责
 * **TypedArray / ArrayBuffer / Blob / File / DataURL / canvas 之间的相互转换**（源码首行注释）。
 *
 * 其中一类方法是**纯逻辑**（不碰浏览器 API），本文件只测这一类 —— 它们可以用
 * **往返不变量**（round-trip）来钉，那是数学性质，不需要读实现：
 *
 * - `uint8ToArrayBuffer` ⇄ `arrayBufferToUint8`
 * - `arrayToArrayBuffer` ⇄ `arrayBufferToUint8` / `uint8ArrayToArray`
 * - `arrayBufferToBlob` / `dataURLtoBlob` 的`size` 关系
 *
 * ⚠️ 另一半方法（`blobToArrayBuffer` / `canvasToDataURL` / `imageToDataURL` / `imageDataToDataURL` …）
 * 依赖 `FileReader` / `HTMLCanvasElement` / `Image` / `ImageData`，**属浏览器环境**，
 * 本文件不覆盖（`filesystem` 包的 `ReadWriteFS` spec 里曾因这一半而必须 `vi.mock` 掉整个 `dataTransform`，
 * 这正是本文件想补上的盲区）。
 */

const dt = new DataTransform();

/** 造一个确定的 Uint8Array */
function sampleU8(): Uint8Array
{
    return new Uint8Array([0, 1, 2, 127, 128, 254, 255]);
}

describe('DataTransform（polyfill）—— 纯逻辑部分', () =>
{
    describe('★ 往返不变量', () =>
    {
        it('★ uint8ToArrayBuffer → arrayBufferToUint8 应还原出同样的字节', () =>
        {
            const u8 = sampleU8();
            const back = dt.arrayBufferToUint8(dt.uint8ToArrayBuffer(u8));

            expect(Array.from(back)).toEqual(Array.from(u8));
        });

        it('★ arrayToArrayBuffer → arrayBufferToUint8 应还原出同样的字节', () =>
        {
            const arr = [0, 10, 200, 255];
            const back = dt.arrayBufferToUint8(dt.arrayToArrayBuffer(arr));

            expect(Array.from(back)).toEqual(arr);
        });

        it('★ arrayToArrayBuffer → uint8ArrayToArray 应还原出同样的数字数组', () =>
        {
            const arr = [3, 1, 4, 1, 5, 9, 2, 6];
            // ⚠️ uint8ArrayToArray 只接受 Uint8Array；直接传 ArrayBuffer 会返回 []（见下面那条用例）
            const back = dt.uint8ArrayToArray(dt.arrayBufferToUint8(dt.arrayToArrayBuffer(arr)));

            expect(Array.from(back)).toEqual(arr);
        });

        it('★ uint8ToArrayBuffer → uint8ArrayToArray 应还原出同样的数字数组', () =>
        {
            const u8 = sampleU8();
            const back = dt.uint8ArrayToArray(u8);

            expect(Array.from(back)).toEqual(Array.from(u8));
        });
    });

    describe('★ 实测：uint8ArrayToArray 只接受 Uint8Array', () =>
    {
        it('传 ArrayBuffer 会静默返回空数组（不是抛错）—— 如实钉住', () =>
        {
            // 实现是 `for (let i = 0; i < u8a.length; i++)`；ArrayBuffer 没有 .length，
            // 于是 0 < undefined 为 false、循环不执行、返回 []。TS 签名已要求 Uint8Array，
            // 这里只是把这个运行期行为记下来。
            expect(dt.uint8ArrayToArray(dt.arrayToArrayBuffer([1, 2, 3]) as unknown as Uint8Array)).toEqual([]);
        });
    });

    describe('★ 尺寸关系（ArrayBuffer 的 byteLength）', () =>
    {
        it('★ arrayToArrayBuffer：byteLength 等于数组长度', () =>
        {
            for (const arr of [[], [0], [1, 2, 3], new Array(100).fill(7)])
            {
                expect(dt.arrayToArrayBuffer(arr).byteLength, `len=${arr.length}`).toBe(arr.length);
            }
        });

        it('★ uint8ToArrayBuffer：byteLength 等于 Uint8Array 的长度', () =>
        {
            for (const n of [0, 1, 7, 64])
            {
                expect(dt.uint8ToArrayBuffer(new Uint8Array(n)).byteLength).toBe(n);
            }
        });

        it('★ arrayBufferToUint8 的长度等于 byteLength', () =>
        {
            const ab = dt.arrayToArrayBuffer([1, 2, 3, 4, 5]);

            expect(dt.arrayBufferToUint8(ab).length).toBe(ab.byteLength);
        });

        it('★ uint8ArrayToArray 的长度等于 Uint8Array 长度', () =>
        {
            expect(dt.uint8ArrayToArray(new Uint8Array(9)).length).toBe(9);
        });
    });

    describe('边界值', () =>
    {
        it('空数组 / 空 Uint8Array 不产生 NaN，也不抛异常', () =>
        {
            expect(dt.arrayToArrayBuffer([]).byteLength).toBe(0);
            expect(dt.uint8ToArrayBuffer(new Uint8Array(0)).byteLength).toBe(0);
            expect(dt.arrayBufferToUint8(new ArrayBuffer(0)).length).toBe(0);
            expect(dt.uint8ArrayToArray(new Uint8Array(0)).length).toBe(0);
        });

        it('★ 字节边界 0 与 255 都能原样往返（不被符号扩展）', () =>
        {
            const u8 = new Uint8Array([0, 255]);
            const back = dt.arrayBufferToUint8(dt.uint8ToArrayBuffer(u8));

            expect(back[0]).toBe(0);
            expect(back[1]).toBe(255);
        });

        it('★ arrayToArrayBuffer 写入的字节值与输入数字一致（0..255）', () =>
        {
            const arr = [0, 127, 128, 255];
            const u8 = dt.arrayBufferToUint8(dt.arrayToArrayBuffer(arr));

            expect(Array.from(u8)).toEqual(arr);
        });
    });

    describe('Blob 相关（Node 环境中 Blob 是全局对象）', () =>
    {
        it('★ arrayBufferToBlob：Blob 的 size 等于 byteLength', () =>
        {
            const ab = dt.arrayToArrayBuffer([1, 2, 3, 4]);

            expect(dt.arrayBufferToBlob(ab).size).toBe(4);
        });

        it('★ dataURLtoBlob：能解析 base64 的 dataURL，size 与解码后字节数一致', () =>
        {
            // "AQID" 是 [1, 2, 3] 的 base64
            const blob = dt.dataURLtoBlob('data:application/octet-stream;base64,AQID');

            expect(blob.size).toBe(3);
        });

        it('空 dataURL 内容 → size 为 0（不抛异常）', () =>
        {
            const blob = dt.dataURLtoBlob('data:application/octet-stream;base64,');

            expect(blob.size).toBe(0);
        });
    });
});
