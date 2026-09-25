/**
 * JSON 侧数据校验（框架设计文档 8.2）。
 *
 * 校验发生在 Logic 构造的默认值填充阶段（规范 11.5 的工厂补默认值处），
 * 不引入独立校验层。双模式：dev 警告（期望类型 / 实际值），prod 静默。
 *
 * 起步只覆盖基础类型字段（number/string/boolean）——对象结构（Color3 等）
 * 的校验等 devtools（第 9 章计算图可视化）需求明确后再扩展。
 */

/** 基础类型字段规格：字段名 → 期望 typeof */
export type FieldTypesSpec = Record<string, 'number' | 'string' | 'boolean'>;

function isProduction(): boolean
{
    return (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV === 'production';
}

/**
 * 校验数据对象的基础类型字段（设计 8.2「字段类型不匹配」行）。
 *
 * - 缺省字段（undefined）跳过——由工厂补默认值，不属于校验错误
 * - 类型不匹配：dev 打印警告（上下文名 + 字段 + 期望/实际），prod 静默
 *
 * @param data 数据对象（构造期的 raw 字面量）
 * @param spec 字段规格
 * @param context 上下文名（用于警告定位，如 'CubeGeometry' / 'root.children[0].components[0]'）
 */
export function validateFieldTypes(data: object, spec: FieldTypesSpec, context: string): void
{
    if (isProduction()) return;

    const source = data as Record<string, unknown>;
    for (const key in spec)
    {
        const value = source[key];
        if (value === undefined) continue;

        const expected = spec[key];
        if (typeof value !== expected)
        {
            console.warn(`[validate] ${context}.${key} 期望 ${expected}，实际 ${typeof value}（${safePreview(value)}）`);
        }
    }
}

/** 值预览（截断，防大对象刷屏） */
function safePreview(value: unknown): string
{
    try
    {
        const text = JSON.stringify(value) ?? String(value);

        return text.length > 60 ? `${text.slice(0, 60)}…` : text;
    }
    catch
    {
        return String(value);
    }
}
