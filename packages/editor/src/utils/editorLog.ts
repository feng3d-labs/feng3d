/**
 * 编辑器日志中心（浏览器端）。
 *
 * 背景：`ConsoleView.vue` 原本自己拦截 `console.*`，把日志存进**组件局部 `ref`**——
 * 于是日志只属于那个 Vue 组件：AI 桥接（`src/bridge/EditorBridge.ts`）读不到，
 * 而组件卸载时的 `restoreConsole()` 还会把拦截器整个摘掉，谁都收不到。
 *
 * 这里把「拦截 + 环形缓冲 + 订阅」抽成模块级服务：
 * - 捕获 `console.log/warn/error/info`、`window.onerror`、`unhandledrejection`
 * - 环形缓冲上限 {@link MAX_EDITOR_LOGS}，避免长时间运行无限增长
 * - `ConsoleView` 订阅它显示，桥接读同一份缓冲 —— 两边看到的日志完全一致
 *
 * 拦截**永久安装**（不提供卸载）：日志是给多个消费者共享的，任何一方退出都不该让其他人失明。
 * 记录过程本身绝不抛错、也绝不写 console（否则会递归）。
 */

/** 日志级别（与 `console` 对应） */
export type EditorLogType = 'log' | 'warn' | 'error' | 'info';

/** 一条日志 */
export interface EditorLogItem
{
    /** 单调递增序号：供 AI 增量读取（先读一次，之后只要更新的） */
    readonly seq: number;
    readonly type: EditorLogType;
    readonly message: string;
    /** 毫秒时间戳 */
    readonly timestamp: number;
    /** 错误堆栈（仅 `error` 级别通常有） */
    readonly stack?: string;
}

/** 环形缓冲上限 */
export const MAX_EDITOR_LOGS = 1000;

/** 日志缓冲（私有；对外只经 queryEditorLogs / getEditorLogs 读取） */
const logs: EditorLogItem[] = [];

/** 订阅者（用数组而非 Set：遵守「模块级不得 new Set()」的零副作用规范） */
const listeners: ((item: EditorLogItem) => void)[] = [];

let installed = false;
let nextSeq = 1;

/**
 * 安全序列化任意值为单行文本：处理 Error / 循环引用 / 函数，**绝不抛错**。
 *
 * @param value 任意值
 * @returns 可读文本
 */
export function stringifyLogValue(value: unknown): string
{
    if (value === null || value === undefined) return String(value);
    if (value instanceof Error)
    {
        return value.stack ? `${value.name}: ${value.message}\n${value.stack}` : `${value.name}: ${value.message}`;
    }
    if (typeof value !== 'object') return String(value);

    const seen = new WeakSet<object>();
    try
    {
        return JSON.stringify(value, (key, item) =>
        {
            if (typeof item === 'function') return '[Function]';
            if (item === undefined) return '[undefined]';
            if (typeof item === 'object' && item !== null)
            {
                if (seen.has(item)) return '[Circular]';
                seen.add(item);
            }

            return item;
        }, 2);
    }
    catch
    {
        try
        {
            return String(value);
        }
        catch
        {
            return '[Object]';
        }
    }
}

/**
 * 追加一条日志（唯一写入口）。
 *
 * @param type 级别
 * @param message 文本
 * @param stack 可选堆栈
 */
export function addEditorLog(type: EditorLogType, message: string, stack?: string): void
{
    const item: EditorLogItem = {
        seq: nextSeq++,
        type,
        message: String(message),
        timestamp: Date.now(),
        stack,
    };

    logs.push(item);
    // 环形：超出上限丢弃最旧的
    if (logs.length > MAX_EDITOR_LOGS) logs.splice(0, logs.length - MAX_EDITOR_LOGS);

    // 订阅者异常不能影响日志记录本身（更不能让调用方的 console 崩掉）
    for (const listener of listeners.slice())
    {
        try
        {
            listener(item);
        }
        catch
        {
            // 静默：订阅者自己的问题
        }
    }
}

/**
 * 安装 console / 全局错误拦截（幂等）。
 *
 * 保留安装时刻的 console 引用并向其转发，因此与其它拦截器（引擎、Vue DevTools 等）
 * 可以叠加共存，不破坏链路。
 */
export function installEditorLogCapture(): void
{
    if (installed || typeof window === 'undefined') return;
    installed = true;

    const previous = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info,
    };

    const capture = (type: EditorLogType, forward: (...args: unknown[]) => void) =>
        (...args: unknown[]): void =>
        {
            forward(...args);
            try
            {
                const error = args.find((arg) => arg instanceof Error) as Error | undefined;
                addEditorLog(type, args.map((arg) => (arg instanceof Error ? arg.message : stringifyLogValue(arg))).join(' '), error?.stack);
            }
            catch
            {
                // 记录失败不影响业务代码
            }
        };

    console.log = capture('log', previous.log);
    console.warn = capture('warn', previous.warn);
    console.error = capture('error', previous.error);
    console.info = capture('info', previous.info);

    // 未被 catch 的错误与 Promise 拒绝：AI 调试时最需要看到的两类
    window.addEventListener('error', (event) =>
    {
        const error = (event as ErrorEvent).error as Error | undefined;
        addEditorLog('error', error?.message ?? (event as ErrorEvent).message ?? '未知错误', error?.stack);
    });

    window.addEventListener('unhandledrejection', (event) =>
    {
        const reason = (event as PromiseRejectionEvent).reason as unknown;
        const error = reason instanceof Error ? reason : undefined;
        addEditorLog(
            'error',
            error ? error.message : `未处理的 Promise 拒绝：${stringifyLogValue(reason)}`,
            error?.stack,
        );
    });
}

/** 日志查询条件（全部可选） */
export interface EditorLogQuery
{
    /** 级别过滤，`all`（默认）不过滤 */
    readonly type?: EditorLogType | 'all';
    /** 返回最近多少条（默认 50，上限 {@link MAX_EDITOR_LOGS}） */
    readonly limit?: number;
    /** 只要 seq 大于该值的（增量读取） */
    readonly sinceSeq?: number;
    /** 只要时间戳不小于该值的 */
    readonly sinceTimestamp?: number;
    /** 关键字过滤（大小写不敏感，匹配 message） */
    readonly grep?: string;
    /** 是否返回堆栈（默认 true） */
    readonly includeStack?: boolean;
    /** 单条消息最大字符数，超出截断（默认 2000，避免上下文膨胀） */
    readonly maxMessageLength?: number;
}

/** 日志查询结果 */
export interface EditorLogResult
{
    /** 缓冲内满足过滤条件的总数 */
    readonly total: number;
    /** 实际返回条数 */
    readonly returned: number;
    /** 是否因 limit 截断 */
    readonly truncated: boolean;
    /** 缓冲内各级别数量（不受过滤影响） */
    readonly counts: Record<EditorLogType, number>;
    /** 缓冲内最新 seq（下次增量读取传它） */
    readonly lastSeq: number;
    /** 倒序无关：按时间正序 */
    readonly entries: readonly EditorLogItem[];
}

/** 统计各级别数量 */
function countByType(): Record<EditorLogType, number>
{
    const counts: Record<EditorLogType, number> = { log: 0, warn: 0, error: 0, info: 0 };
    for (const item of logs) counts[item.type]++;

    return counts;
}

/**
 * 查询日志。过滤后取**最近 limit 条**，按时间正序返回（便于直接阅读因果顺序）。
 *
 * @param query 查询条件
 * @returns 查询结果
 */
export function queryEditorLogs(query: EditorLogQuery = {}): EditorLogResult
{
    const type = query.type ?? 'all';
    const limit = Math.max(1, Math.min(query.limit ?? 50, MAX_EDITOR_LOGS));
    const grep = query.grep ? String(query.grep).toLowerCase() : undefined;
    const includeStack = query.includeStack !== false;
    const maxMessageLength = Math.max(100, query.maxMessageLength ?? 2000);

    const matched = logs.filter((item) =>
    {
        if (type !== 'all' && item.type !== type) return false;
        if (query.sinceSeq !== undefined && item.seq <= query.sinceSeq) return false;
        if (query.sinceTimestamp !== undefined && item.timestamp < query.sinceTimestamp) return false;
        if (grep && !item.message.toLowerCase().includes(grep)) return false;

        return true;
    });

    const tail = matched.slice(Math.max(0, matched.length - limit));
    const entries = tail.map((item) =>
    {
        const message = item.message.length > maxMessageLength
            ? `${item.message.slice(0, maxMessageLength)}…[截断，原长 ${item.message.length}]`
            : item.message;

        return {
            seq: item.seq,
            type: item.type,
            message,
            timestamp: item.timestamp,
            ...(includeStack && item.stack ? { stack: item.stack } : {}),
        };
    });

    return {
        total: matched.length,
        returned: entries.length,
        truncated: matched.length > entries.length,
        counts: countByType(),
        lastSeq: logs.length > 0 ? logs[logs.length - 1].seq : 0,
        entries,
    };
}

/** 全量日志副本（供 UI 初始填充；不暴露内部数组，避免被外部改写） */
export function getEditorLogs(): EditorLogItem[]
{
    return logs.slice();
}

/**
 * 清空日志。
 *
 * @returns 被清掉的条数
 */
export function clearEditorLogs(): number
{
    const count = logs.length;
    logs.length = 0;

    return count;
}

/**
 * 订阅新日志。
 *
 * @param listener 每追加一条调用一次
 * @returns 取消订阅
 */
export function subscribeEditorLog(listener: (item: EditorLogItem) => void): () => void
{
    listeners.push(listener);

    return () =>
    {
        const index = listeners.indexOf(listener);
        if (index >= 0) listeners.splice(index, 1);
    };
}
