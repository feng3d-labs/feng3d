/**
 * `override` 的值：
 * - 直接给值（`number` / `string` / `boolean`）→ 生成 `override x = value;`；
 * - 给 `{ type }` → 生成 `override x: type;`（**只声明类型**，值必须由 pipeline constants 提供）；
 * - 给 `{ type, value }` → 生成 `override x: type = value;`。
 *
 * 注意 f32 常量要传**字符串**（`'1024.0'`）——JS 的 `1024.0` 就是 `1024`，
 * 生成 `override x = 1024;` 会与 f32 类型不符。
 */
export type OverrideValue = number | string | boolean | { type: string; value?: number | string | boolean };

/** 一组 override 声明 */
export type Overrides = Record<string, OverrideValue>;

/**
 * 生成 override 声明行（vertex / fragment / compute 三个入口共用）。
 *
 * 抽成一份是为了避免「只在一个入口里加了新形态、另一个漏掉」——
 * 这类问题在本仓出现过多次（elementStructDef / samplers / return_ 挂载）。
 *
 * @param overrides override 表
 * @returns 声明行
 */
export function buildOverrideLines(overrides?: Overrides): string[]
{
    const lines: string[] = [];
    for (const [name, value] of Object.entries(overrides ?? {}))
    {
        if (typeof value === 'object' && value !== null)
        {
            lines.push(value.value === undefined
                ? `override ${name}: ${value.type};`
                : `override ${name}: ${value.type} = ${value.value};`);

            continue;
        }
        lines.push(`override ${name} = ${value};`);
    }

    return lines;
}
