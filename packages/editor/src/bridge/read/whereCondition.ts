/**
 * `scene.find` 的 `where` 条件求值（纯函数，不依赖编辑器状态，因此可单测）。
 *
 * 单独成文的原因：这里正是"AI 传错参数"最容易被**静默吞掉**的地方——
 * `{ op: "lt", value: "0" }`（value 写成字符串）原先会走"类型不符 → 不匹配"这条路径，
 * 于是返回 0 命中且没有任何提示，看起来像"场景里没有对象满足条件"（issue #197，从 #139 拆出）。
 */

/** 支持的条件运算符 */
export const WHERE_OPS = ['eq', 'ne', 'lt', 'lte', 'gt', 'gte', 'exists', 'in'] as const;

/** 需要"两边都是数字"的运算符 */
const ORDER_OPS = ['lt', 'lte', 'gt', 'gte'];

/**
 * 校验一个 `where` 条件的**值类型**（在遍历场景前一次性做，报错要能照着改）。
 *
 * 判据为什么这么定：
 * - `lt/lte/gt/gte` 是**数值**比较：`value` 不是有限数字时，JS 的隐式转换会给出不可预期的结果
 *   （`0 < "0"` 与 `0 < 0` 恰好同值，但 `10 < "9"` 就是 false 了），所以直接拒绝；
 * - `eq/ne` 走 `===`：对象/数组永远不等（引用比较），`null` 又该用 `exists` 表达，所以明确拒绝
 *   这三类，避免"看起来在比较、其实恒 false"；
 * - `in` 必须给数组（调用方另有同义校验，这里一起管）；
 * - `exists` 不看 `value`。
 *
 * @param op 运算符
 * @param value 条件里的 value
 * @throws 类型不符时抛出可直接照改的错误
 */
export function assertWhereConditionValue(op: string, value: unknown): void
{
    if (op === 'exists') return;

    if (ORDER_OPS.includes(op))
    {
        if (typeof value !== 'number' || !Number.isFinite(value))
        {
            throw new Error(`where.op=${op} 是数值比较，value 需要有限数字，收到：${JSON.stringify(value)}（`
                + `字符串 "${String(value)}" 会被 JS 隐式转换，结果不可预期；要比较字符串请用 eq / ne）`);
        }

        return;
    }

    if (op === 'in')
    {
        if (!Array.isArray(value))
        {
            throw new Error('where.op=in 时 value 需要是数组，如 { path: "name", op: "in", value: ["A", "B"] }');
        }

        return;
    }

    // eq / ne
    if (value !== null && typeof value === 'object')
    {
        throw new Error(`where.op=${op} 用 === 比较，对象/数组永远是"不等"（引用比较），`
            + `收到：${JSON.stringify(value)}——要判断"有值"请用 exists，要按字段比较请把 path 指到具体字段`);
    }
    if (value === null)
    {
        throw new Error(`where.op=${op} 不支持 value: null（与"字段不存在"分不开）——要判断"有值"请用 exists`);
    }
}

/**
 * 按条件比较字段值。
 *
 * 数值比较仅对数字生效：字段值不是数字时视为**不匹配**（而不是抛错）——同一条件要跑过场景里的每个对象，
 * 而"部分对象没有这个字段"是常态（例如按 `material.uniforms.u_glossiness` 筛）。
 * `value` 自身的类型问题在 {@link assertWhereConditionValue} 里一次性拦住。
 *
 * @param actual 字段当前值（字段不存在时为 `undefined`）
 * @param op 运算符
 * @param expected 条件里的 value
 */
export function compareField(actual: unknown, op: string, expected: unknown): boolean
{
    switch (op)
    {
        case 'exists': return actual !== undefined && actual !== null;
        case 'eq': return actual === expected;
        case 'ne': return actual !== expected;
        // "名字是这几个之一"：value 传数组（调用方已校验它确实是数组）
        case 'in': return Array.isArray(expected) && expected.includes(actual);
        default: break;
    }

    if (typeof actual !== 'number' || typeof expected !== 'number') return false;
    switch (op)
    {
        case 'lt': return actual < expected;
        case 'lte': return actual <= expected;
        case 'gt': return actual > expected;
        case 'gte': return actual >= expected;
        default:
            throw new Error(`未知的比较符 ${op}（可用 ${WHERE_OPS.join(' / ')}）`);
    }
}
