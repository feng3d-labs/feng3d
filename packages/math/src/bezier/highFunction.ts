/**
 * 高次函数（原 `HighFunction` class 的纯数据 + 纯函数形态）
 *
 * ## 为什么这个类型不是「纯 static 容器」，却仍在同一批改造
 *
 * 原 `HighFunction` 与其他 5 个工具容器不同：它有**实例状态**（`private as: number[]`）
 * 和**一个实例方法**（`getValue(x)`）。但它的状态是**只读的系数数组**、方法**不读任何全局状态**，
 * 所以纯数据形态非常好落：`interface HighFunction { readonly as }` + `highFunctionGetValue`。
 * 它恰好与 `ShapeUtils` / `Interpolations` / `EquationSolving` 同属「去 class 化后没有
 * tagged union / 多态分发需求」的一档，因此并进本批，不必拖到含继承树的批 E。
 *
 * ## 接口名的选择
 *
 * 保留 `HighFunction` 作为**接口名**（不叫 `HighFunctionLike`）：
 *
 * - 它**不带** `__type__`——高次函数不参与序列化、不参与「按判别字段选控件 / 分发」，
 *   所以没有 `Gradient`（`Gradient` + `GradientLike` 两件套）那种需要；
 * - 这样消费方的 `import { HighFunction }` 一字不改，只是从 class 变成 interface
 *   （值导入要改成 `import type`，因为 interface 没有运行时绑定）。
 *
 * n 次函数定义
 * f(x) = a0 * pow(x, n) + a1 * pow(x, n - 1) +.....+ an_1 * pow(x, 1) + an
 *
 * 0次 f(x) = a0;
 * 1次 f(x) = a0 * x + a1;
 * 2次 f(x) = a0 * x * x + a1 * x + a2;
 * ......
 *
 * @author feng / http://feng3d.com 05/06/2018
 */

/**
 * 高次函数（纯数据：只有系数，没有方法）
 */
export interface HighFunction
{
    /** 函数系数 a0-an 数组 */
    readonly as: readonly number[];
}

/**
 * 获取函数 f(x) 的值
 *
 * 求值用 Horner 法则（`v = v * x + as[i]`），与原 class 方法逐字一致——
 * 所以 `as` 为空数组时返回 `0`。
 *
 * @param f 高次函数（系数容器）
 * @param x x坐标
 */
export function highFunctionGetValue(f: HighFunction, x: number)
{
    let v = 0;
    const as = f.as;
    for (let i = 0, n = as.length; i < n; i++)
    {
        v = v * x + as[i];
    }

    return v;
}
