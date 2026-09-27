/**
 * 编码错误（Coded Errors，issue #94）：prod 只携带错误码，dev 按需解码出完整上下文。
 *
 * 为什么不用 `process.env.NODE_ENV` 判 dev/prod：**浏览器里没有 `process`**，
 * 这种判断恒为假 → 永远走 dev 分支，包体与可调试性的取舍完全失控。
 * 这里改成**显式开关**：引擎默认关闭解码（prod 语义），编辑器 / examples 在启动时
 * 调 `enableErrorDecoding()` 打开。
 *
 * 三类产出：
 * - `ErrorCode`：稳定编号，日志与工单里只出现这个数字；
 * - `decodeError()`：把错误（含上下文）还原成可读文本，dev 用；
 * - `getDegradationCounts()`：各错误码的降级次数快照，供 devtools / 测试观测。
 */

/** 错误码：一旦发布不再改号（工单与日志都引用它） */
export enum ErrorCode
{
    /** `logic()` 遇到未注册的 `__type__` */
    LogicNotRegistered = 1001,
    /** `$ref` 指向未注册的共享对象 */
    RefNotRegistered = 1002,
    /** `prefabId` 未注册 */
    PrefabNotRegistered = 1003,
    /** submit computed 求值抛异常 */
    SubmitComputeFailed = 1004,
    /** submit 求值失败（降级保持上一帧） */
    SubmitEvaluateFailed = 1005,
    /** 纹理加载失败（退回占位纹理） */
    TextureLoadFailed = 1006,
}

/** 错误码 → 人类可读说明（只有解码时才用得到） */
const ERROR_MESSAGES: Record<number, string> = {
    [ErrorCode.LogicNotRegistered]: '未注册的 __type__，logic() 无法分发',
    [ErrorCode.RefNotRegistered]: '未注册的 $ref，共享对象未在 defs 中声明',
    [ErrorCode.PrefabNotRegistered]: '未注册的 prefabId，模板未注册',
    [ErrorCode.SubmitComputeFailed]: 'submit computed 求值异常',
    [ErrorCode.SubmitEvaluateFailed]: 'submit 求值失败，已降级保持上一次有效提交',
    [ErrorCode.TextureLoadFailed]: '纹理加载失败，已降级使用占位纹理',
};

/**
 * 引擎错误：`code` 是稳定的机器可读标识，`context` 只在 dev 解码时输出。
 */
export class Feng3dError extends Error
{
    readonly code: ErrorCode;

    /** 定位上下文（canvas / root / url 等）；prod 下不打印但仍然保留在对象上 */
    readonly context: Readonly<Record<string, unknown>> | undefined;

    constructor(code: ErrorCode, context?: Record<string, unknown>)
    {
        super(formatErrorCode(code));
        this.name = 'Feng3dError';
        this.code = code;
        this.context = context;
    }
}

/** 错误码 → `[F3D-1004]` 形式的短标签 */
export function formatErrorCode(code: ErrorCode): string
{
    return `[F3D-${code}]`;
}

let decodingEnabled = false;

/**
 * 开关错误解码（默认关闭）。dev 环境（编辑器 / examples）启动时打开：
 * 打开后 `reportDegradation` 会把完整上下文打到控制台，关闭则只累加计数。
 */
export function enableErrorDecoding(enable = true): void
{
    decodingEnabled = enable;
}

/** 当前是否开启解码 */
export function isErrorDecodingEnabled(): boolean
{
    return decodingEnabled;
}

let counts: Record<number, number> | null = null;

/** 取降级计数表（首次使用时创建；模块顶层不建缓存，R2） */
function getCounts(): Record<number, number>
{
    if (!counts)
    {
        counts = {};
    }

    return counts;
}

/** 各错误码的降级次数快照（返回副本，改它不影响内部状态） */
export function getDegradationCounts(): Readonly<Record<number, number>>
{
    return { ...getCounts() };
}

/** 清空降级计数（测试与 devtools 重置用） */
export function resetDegradationCounts(): void
{
    counts = {};
}

/**
 * 记录一次降级：计数 +1，并返回带错误码（与上下文）的 {@link Feng3dError}。
 *
 * 解码开启时才打印——prod 的调用方可以只在需要时 `decodeError(err)` 取详情。
 *
 * @param code 错误码
 * @param context 定位上下文（键值会被解码输出成多行）
 * @returns 带 code 与 context 的错误对象
 */
export function reportDegradation(code: ErrorCode, context?: Record<string, unknown>): Feng3dError
{
    const counter = getCounts();

    counter[code] = (counter[code] ?? 0) + 1;

    const error = new Feng3dError(code, context);

    if (decodingEnabled)
    {
        console.error(decodeError(error));
    }

    return error;
}

/**
 * 把错误解码成可读文本（dev 用）：错误码 + 说明 + 上下文逐行展开。
 *
 * 传入非 {@link Feng3dError} 时退化为 `Error.message` / `String(value)`——
 * 保证调用方不必先判类型。
 *
 * @param error 任意错误值
 * @returns 可读文本
 */
export function decodeError(error: unknown): string
{
    if (error instanceof Feng3dError)
    {
        const lines = [`${formatErrorCode(error.code)} ${ERROR_MESSAGES[error.code] ?? '未知错误码'}`];

        if (error.context)
        {
            for (const [key, value] of Object.entries(error.context))
            {
                lines.push(`  ${key}: ${formatContextValue(value)}`);
            }
        }

        return lines.join('\n');
    }
    if (error instanceof Error) return error.message;

    return String(error);
}

/** 上下文值 → 单行文本（Error 取 message，对象取 JSON） */
function formatContextValue(value: unknown): string
{
    if (value instanceof Error) return `${value.name}: ${value.message}`;
    if (value === null || value === undefined) return String(value);
    if (typeof value === 'object') return JSON.stringify(value);

    return String(value);
}
