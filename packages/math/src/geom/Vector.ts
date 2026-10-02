/**
 * 曲线点的最小形状：`Vector2Like`（`{ x, y }`）与 `Vector3Like`（`{ x, y, z }`）都满足。
 *
 * 阶段 C-f：原 `Vector` 接口（要求 `add` / `sub` / `copy` / `distance` / `normalize` 等
 * **实例方法**）随 `Vector2` / `Vector3` 的 class 一起退场——math 里的数值类型不再有方法。
 * 曲线算法（`Curve` / `CurvePath`）改为：数据形状用本接口约束，运算走
 * `./vector2Ops` / `./vector3Ops` 的纯函数，并按 `z` 是否存在分派到二维 / 三维版本。
 */
export interface VectorLike
{
    readonly x: number;
    readonly y: number;
    readonly z?: number;
}
