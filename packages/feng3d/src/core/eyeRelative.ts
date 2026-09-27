import { Matrix4x4, Vector3 } from '@feng3d/math';

/**
 * 眼相对（eye-relative / camera-relative）变换：大坐标场景的精度方案（issue #99）。
 *
 * ## 问题（可量化，不依赖 GPU）
 *
 * `TransformUniforms.u_modelMatrix` 的 WGSL 类型是 `mat4x4<f32>`（见 `Object3D.ts` 的
 * `TransformUniforms` 片段），而它现在直接上传**世界矩阵**（`Object3D.ts:428`）。
 * f32 只有 24 位有效位，世界坐标越大，能表示的最小间隔越大：
 *
 * | 世界坐标量级 | f32 间隔 | 视觉后果 |
 * |---|---|---|
 * | 1e3 | ≈ 6.1e-5 | 无感 |
 * | 1e6 | ≈ 6.1e-2 | **顶点抖动**（数字孪生 / GIS 尺度） |
 * | 1e7 | ≈ 1 | 明显跳动（1e7 = 10^7 落在 [2^23, 2^24)，间隔是 2^0 = 1） |
 *
 * 顶点位置精度被世界坐标量级吞掉——这就是"远处物体抖动"的机制。
 *
 * ## 方案
 *
 * 上传**相对相机的坐标**，并把相机视作在原点：
 *
 * ```
 * modelMatrix'       = T(-camPos) × modelMatrix          // 眼相对
 * viewProjection'    = viewProjection × T(camPos)        // 相机移到原点
 * ```
 *
 * 两者相乘**结果恒等**：
 *
 * ```
 * viewProjection' × modelMatrix' = VP × T(camPos) × T(-camPos) × M = VP × M
 * ```
 *
 * 但参与 f32 运算的平移量从"世界坐标"变成"物体到相机的距离"（通常 ≪ 世界坐标），
 * 量化误差随之骤降——近处物体的间隔回到 1e-5 量级。
 *
 * ## 落地边界（本文件只做"可离线验证"的部分）
 *
 * 接进渲染链还需要在 `CameraLogic.uniforms`/`View` 的 submit 链上按开关切换，
 * 并且**抖动是否真的消失只能在有 GPU 的真机上验收**（本仓库的 CI 无 GPU）。
 * 因此这里先提供纯函数与量化证据，接入路径与验收方式记在
 * `docs/ARCHITECTURE_V2.md` 的 §1.4.4 ①。
 */

/**
 * f32 在给定量级上的可表示间隔（相邻两个 f32 的差）。
 *
 * 取 `2^(floor(log2|x|) - 23)`：f32 尾数 23 位，量级每翻一倍间隔翻一倍。
 * 用它可以直接把"世界坐标多大 → 精度多少"算成一个数，而不必靠感觉判断抖动。
 *
 * @param value 待考察的量级（0 与非法值返回 0）
 */
export function float32Spacing(value: number): number
{
    const abs = Math.abs(value);

    if (!Number.isFinite(abs) || abs === 0) return 0;

    return 2 ** (Math.floor(Math.log2(abs)) - 23);
}

/**
 * 把一个世界矩阵变成**眼相对**矩阵：平移分量减去相机世界位置。
 *
 * `Matrix4x4.appendTranslation` 是左乘（`this = T(x) × this`），正是这里需要的方向。
 *
 * @param model 世界矩阵（`local2world`）
 * @param cameraWorldPosition 相机世界位置
 * @param out 输出矩阵（省略则新建）
 */
export function makeEyeRelative(model: Matrix4x4, cameraWorldPosition: Vector3, out = new Matrix4x4()): Matrix4x4
{
    out.copy(model);

    return out.appendTranslation(-cameraWorldPosition.x, -cameraWorldPosition.y, -cameraWorldPosition.z);
}

/**
 * 把视图投影矩阵的相机平移抵掉：`VP' = VP × T(camPos)`（相机视作在原点）。
 *
 * 与 {@link makeEyeRelative} 配对使用，二者相乘的结果与原式**恒等**。
 *
 * `Matrix4x4.appendTranslation` 是**左乘**，方向不对，所以这里显式做右乘平移：
 * 列主序下新平移列 = 原第 0/1/2 列按 `camPos` 加权后加到原第 3 列。
 *
 * @param viewProjection 原视图投影矩阵
 * @param cameraWorldPosition 相机世界位置
 * @param out 输出矩阵（省略则新建）
 */
export function makeCameraAtOrigin(viewProjection: Matrix4x4, cameraWorldPosition: Vector3, out = new Matrix4x4()): Matrix4x4
{
    out.copy(viewProjection);

    const e = out.elements;
    const { x: tx, y: ty, z: tz } = cameraWorldPosition;

    for (let row = 0; row < 4; row++)
    {
        e[12 + row] += e[row] * tx + e[4 + row] * ty + e[8 + row] * tz;
    }

    return out;
}

/**
 * 眼相对方案把"参与 f32 运算的平移量"降到多少——用于量化对比与文档取证。
 *
 * @param worldPosition 物体世界位置
 * @param cameraWorldPosition 相机世界位置
 */
export function eyeRelativeTranslationError(worldPosition: Vector3, cameraWorldPosition: Vector3)
{
    const absolute = Math.max(Math.abs(worldPosition.x), Math.abs(worldPosition.y), Math.abs(worldPosition.z));
    const relative = new Vector3(
        worldPosition.x - cameraWorldPosition.x,
        worldPosition.y - cameraWorldPosition.y,
        worldPosition.z - cameraWorldPosition.z,
    );
    const relativeMax = Math.max(Math.abs(relative.x), Math.abs(relative.y), Math.abs(relative.z));

    return {
        /** 直接上传世界坐标时的 f32 间隔 */
        absoluteSpacing: float32Spacing(absolute),
        /** 眼相对上传时的 f32 间隔 */
        relativeSpacing: float32Spacing(relativeMax),
        /** 精度提升倍数（相对量级越小倍数越大） */
        ratio: float32Spacing(relativeMax) === 0 ? Infinity : float32Spacing(absolute) / float32Spacing(relativeMax),
    };
}
