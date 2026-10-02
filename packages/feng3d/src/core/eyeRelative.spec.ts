import {
    mat4Append,
    mat4Copy,
    mat4Equals,
    mat4FromPosition,
    mat4FromTRS,
    mat4Invert,
    mat4SetPerspectiveFromFOV,
    Matrix4x4Like,
    Vector3,
} from '@feng3d/math';
import { describe, expect, it } from 'vitest';
import { eyeRelativeTranslationError, float32Spacing, makeCameraAtOrigin, makeEyeRelative } from './eyeRelative';

/**
 * 眼相对变换的量化证据与恒等性（issue #99）。
 *
 * 这里验证的都是**纯数值**、不依赖 GPU 的部分：f32 精度上限、两个矩阵相乘的恒等性、
 * 相机在原点时的退化。至于"远处物体抖动是否真的消失"，只能在有 GPU 的真机上验收
 * （CI 无 GPU），本文件的职责是把"为什么这么改、改了以后精度变成多少"变成可复核的数字。
 *
 * 阶段 C-e：`Matrix4x4` 的 class 已删除，`new Matrix4x4().xxx()` 的链式写法
 * 全部换成「纯数据字面量 + 纯函数」。本文件只需要只读矩阵形状，所以用 `*Like` 即可。
 */

/** `X = copy(src); append(X, lhs)` ⇒ `X = lhs × src` */
function multiplied(src: Matrix4x4Like, lhs: Matrix4x4Like): Matrix4x4Like
{
    const out = mat4Copy(src);

    mat4Append(out, lhs, out);

    return out;
}
describe('眼相对变换（issue #99）', () =>
{
    /** 相对容差比较（大数上绝对容差会失真） */
    function expectMatrixClose(actual: Matrix4x4Like, expected: Matrix4x4Like, tolerance = 1e-6)
    {
        for (let i = 0; i < 16; i++)
        {
            const a = actual.elements[i];
            const b = expected.elements[i];
            const scale = Math.max(1, Math.abs(a), Math.abs(b));

            expect(Math.abs(a - b) / scale, `elements[${i}]：${a} vs ${b}`).toBeLessThan(tolerance);
        }
    }

    it('f32 间隔随量级翻倍：1e3 ≈ 6e-5、1e6 ≈ 6e-2、1e7 = 1', () =>
    {
        expect(float32Spacing(1e3)).toBeCloseTo(6.1035e-5, 8);
        expect(float32Spacing(1e6)).toBeCloseTo(6.25e-2, 6);
        // 1e7 落在 [2^23, 2^24) 区间，间隔正好是 2^0 = 1（比"半米"还大）
        expect(float32Spacing(1e7)).toBeCloseTo(1, 6);

        // 间隔的定义性质：加一个间隔必定跳到下一个 f32，加四分之一间隔则不会
        for (const value of [1e3, 1e6, 1e7])
        {
            const spacing = float32Spacing(value);

            expect(Math.fround(value + spacing), `${value} 加一个间隔应进位`).not.toBe(Math.fround(value));
            expect(Math.fround(value + spacing / 4), `${value} 加四分之一间隔不应进位`).toBe(Math.fround(value));
        }

        expect(float32Spacing(0)).toBe(0);
    });

    it('相机在原点时两个函数都是恒等（退化路径不能悄悄改矩阵）', () =>
    {
        const model = mat4FromTRS({ x: 1, y: 2, z: 3 }, { x: 0.1, y: 0.2, z: 0.3 }, { x: 1, y: 1, z: 1 });
        const origin = new Vector3(0, 0, 0);

        expect(mat4Equals(makeEyeRelative(model, origin), model)).toBe(true);
        expect(mat4Equals(makeCameraAtOrigin(model, origin), model)).toBe(true);
    });

    it('眼相对后上传的平移量是"物体到相机的距离"，而不是世界坐标', () =>
    {
        const cameraWorld = new Vector3(1e6, 0, 0);
        const model = mat4FromPosition(1e6 + 10, 0, 0);

        const relative = makeEyeRelative(model, cameraWorld);

        // 平移列被降到 ~10：参与 f32 运算的量级从 1e6 掉到 10
        expect(Math.abs(relative.elements[12])).toBeCloseTo(10, 6);
        expect(model.elements[12]).toBeCloseTo(1e6 + 10, 6);
    });

    it('两个矩阵相乘结果与原式恒等：VP′ × M′ == VP × M', () =>
    {
        const cameraWorld = new Vector3(1.234e6, -5.678e5, 9.1e5);
        const model = mat4FromTRS(
            { x: 1.234e6 + 12.5, y: -5.678e5 + 3.25, z: 9.1e5 - 7.75 },
            { x: 0.3, y: -0.4, z: 0.5 },
            { x: 2, y: 2, z: 2 },
        );
        const view = mat4Invert(mat4FromTRS(cameraWorld, { x: -0.2, y: 0.1, z: 0.3 }, { x: 1, y: 1, z: 1 }));
        const viewProjection = mat4Append(mat4SetPerspectiveFromFOV(60, 1.5, 0.1, 1e6), view);

        // append 是左乘：X.copy(M).append(VP) ⇒ X = VP × M
        const original = multiplied(model, viewProjection);
        const eyeRelative = makeEyeRelative(model, cameraWorld);
        const cameraAtOrigin = makeCameraAtOrigin(viewProjection, cameraWorld);
        const combined = multiplied(eyeRelative, cameraAtOrigin);

        expectMatrixClose(combined, original, 1e-6);
    });

    it('精度收益可量化：世界坐标 1e6、距相机 10 时提升约 4 个数量级', () =>
    {
        const cameraWorld = new Vector3(1e6, 0, 0);
        const worldPosition = new Vector3(1e6 + 10, 0, 0);
        const { absoluteSpacing, relativeSpacing, ratio } = eyeRelativeTranslationError(worldPosition, cameraWorld);

        expect(absoluteSpacing).toBeCloseTo(6.25e-2, 6);
        expect(relativeSpacing).toBeCloseTo(9.5367e-7, 10);
        expect(ratio).toBeGreaterThan(1e4);
    });

    it('相机就在物体上时相对间隔为 0（此时误差不来自平移精度）', () =>
    {
        const at = new Vector3(1e6, 1e6, 1e6);
        const { relativeSpacing } = eyeRelativeTranslationError(at, at);

        expect(relativeSpacing).toBe(0);
    });
});
