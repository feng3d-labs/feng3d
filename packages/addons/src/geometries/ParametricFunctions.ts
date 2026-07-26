import { Vector3 } from '@feng3d/math';

/**
 * 参数化曲面函数库（移植自 three.js examples/jsm/geometries/ParametricFunctions.js）。
 *
 * 每个函数签名约定为 feng3d 风格 `(u, v) => Vector3`（返回新向量），
 * 可直接作为 {@link ParametricGeometry} 的 `func` 字段传入。
 *
 * 与 three.js 差异：
 * - three.js 签名是 `(u, v, target) => void`（写入 target），feng3d 改为返回新向量
 * - three.js `klein` 第一个参数是 `v`、第二个是 `u`（参数名易混淆），
 *   feng3d 统一为 `(u, v)` 顺序，内部做对应转换保持曲面一致
 */

/**
 * 克莱因瓶（Klein bottle）。
 *
 * 注意：three.js 原函数签名是 `(v, u, target)`（v 在前），这里转换为 `(u, v)`。
 * 内部仍按 three.js 的 v/u 角度对应关系计算，保证曲面形状一致。
 *
 * @param u 参数 u ∈ [0,1]（three.js 中对应 v）
 * @param v 参数 v ∈ [0,1]（three.js 中对应 u）
 */
export function klein(u: number, v: number): Vector3
{
    // 按 three.js 原约定：第一个参数（u 形参）→ v 角度，第二个（v 形参）→ u 角度
    const uIn = v;
    const vIn = u;

    const uu = uIn * Math.PI;
    const vv = vIn * 2 * Math.PI;
    const uu2 = uu * 2;
    let x: number; let z: number;
    if (uu2 < Math.PI)
    {
        x = 3 * Math.cos(uu2) * (1 + Math.sin(uu2)) + (2 * (1 - Math.cos(uu2) / 2)) * Math.cos(uu2) * Math.cos(vv);
        z = -8 * Math.sin(uu2) - 2 * (1 - Math.cos(uu2) / 2) * Math.sin(uu2) * Math.cos(vv);
    }
    else
    {
        x = 3 * Math.cos(uu2) * (1 + Math.sin(uu2)) + (2 * (1 - Math.cos(uu2) / 2)) * Math.cos(vv + Math.PI);
        z = -8 * Math.sin(uu2);
    }
    const y = -2 * (1 - Math.cos(uu2) / 2) * Math.sin(vv);

    return new Vector3(x, y, z);
}

/**
 * 平面：x=u, y=0, z=v。
 *
 * @param u 参数 u ∈ [0,1]
 * @param v 参数 v ∈ [0,1]
 */
export function plane(u: number, v: number): Vector3
{
    return new Vector3(u, 0, v);
}

/**
 * 平面莫比乌斯带（flat Möbius strip）。
 *
 * @param u 参数 u ∈ [0,1]（宽度方向，居中到 ±0.5）
 * @param v 参数 v ∈ [0,1]（环绕方向，映射到 [0, 2π]）
 */
export function mobius(u: number, v: number): Vector3
{
    const uu = u - 0.5;
    const vv = 2 * Math.PI * v;
    const a = 2;
    const x = Math.cos(vv) * (a + uu * Math.cos(vv / 2));
    const y = Math.sin(vv) * (a + uu * Math.cos(vv / 2));
    const z = uu * Math.sin(vv / 2);

    return new Vector3(x, y, z);
}

/**
 * 体积莫比乌斯带（volumetric Möbius strip）。
 *
 * @param u 参数 u ∈ [0,1]
 * @param v 参数 v ∈ [0,1]
 */
export function mobius3d(u: number, v: number): Vector3
{
    const uu = u * Math.PI;
    const vv = v * 2 * Math.PI;

    const uu2 = uu * 2;
    const phi = uu2 / 2;
    const major = 2.25; const a = 0.125; const b = 0.65;

    let x = a * Math.cos(vv) * Math.cos(phi) - b * Math.sin(vv) * Math.sin(phi);
    const z = a * Math.cos(vv) * Math.sin(phi) + b * Math.sin(vv) * Math.cos(phi);
    const y = (major + x) * Math.sin(uu2);
    x = (major + x) * Math.cos(uu2);

    return new Vector3(x, y, z);
}
