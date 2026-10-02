import type { BridgeRequest } from './EditorBridge';

/**
 * 桥接的 **WebSocket 客户端**（浏览器侧，#273 第三阶段）。
 *
 * ## 它负责什么
 *
 * 让编辑器页面**被推送**任务，而不是每 100ms 问一次"有没有活儿"：
 *
 * ```
 * 服务端 ──task──▶ 本模块 ──▶ EditorBridge 执行 ──HTTP POST /result──▶ 服务端
 * ```
 *
 * 结果仍走 HTTP 回传：那条路径与通道无关、永远可用，把"收任务的通道"和"回结果的通道"
 * 解耦之后，WS 这条链路的失败面小得多（而且 `POST /result` 本来就是一次性请求）。
 *
 * ## 三条纪律
 *
 * 1. **连不上/断开就退回轮询**：`EditorBridge` 的轮询循环照旧在跑，只是 WS 在线时**跳过**
 *    拉取——所以 WS 挂了不会"没人干活"，最坏情况就是回到今天的行为；
 * 2. **重连带退避**：1s → 2s → 4s → 8s 封顶 10s，避免服务端没起来时把页面变成轰炸机；
 * 3. **不信任收到的帧**：形状不对就丢掉（服务端与页面版本可能不同步），一条坏帧不该让页面崩。
 */

/** 客户端选项 */
export interface BridgeSocketOptions
{
    /** 服务端地址（`ws://…` 或 `wss://…`） */
    readonly url: string;

    /** 本页面自报的名字（与 HTTP `?bridgeClient=` 同一个值） */
    readonly clientId: string;

    /** 收到任务（可能一次多条：连上时服务端会把积压的交给它） */
    readonly onRequest: (request: BridgeRequest) => Promise<void>;

    /** 在线状态变化（诊断用） */
    readonly onOnlineChange?: (online: boolean) => void;
}

/** 退避序列（毫秒），到顶后保持最后一个 */
const RECONNECT_DELAYS_MS = [1000, 2000, 4000, 8000, 10000];

/** 服务端事件的处理函数 */
export type BridgeEventHandler = (payload: unknown) => void;

/**
 * 服务端事件的订阅表（**lazy-init**：模块级 `new Map()` 是 R2 明令禁止的）。
 */
let eventListeners: Map<string, Set<BridgeEventHandler>> | null = null;

/**
 * 订阅**服务端事件**（`{type:'event'}`，由宿主服务广播）。
 *
 * 与"任务"的区别：任务是"要页面干活"（会从队列取走），事件是"告诉页面外面发生了什么"
 * （项目文件变了、插件装了/卸了、长任务进度……）——所以它可以广播给所有页面。
 *
 * @param name 事件名（如 `workspace/changed`）
 * @param handler 处理函数
 * @returns 退订
 */
export function subscribeBridgeEvent(name: string, handler: BridgeEventHandler): () => void
{
    eventListeners ??= new Map();

    const handlers = eventListeners.get(name) ?? new Set<BridgeEventHandler>();

    handlers.add(handler);
    eventListeners.set(name, handlers);

    return () =>
    {
        handlers.delete(handler);

        if (handlers.size === 0) eventListeners?.delete(name);
    };
}

/**
 * 分发一条服务端事件（订阅者抛错只记录，不影响别的订阅者）。
 *
 * @param name 事件名
 * @param payload 载荷
 */
function dispatchBridgeEvent(name: string, payload: unknown): void
{
    const handlers = eventListeners?.get(name);

    if (!handlers) return;

    for (const handler of handlers)
    {
        try
        {
            handler(payload);
        }
        catch (error)
        {
            console.error(`[bridge] 事件订阅者抛错（已忽略）：${String(error)}`);
        }
    }
}

/**
 * 当前是否有一条活着的 WebSocket。
 *
 * `EditorBridge` 的轮询循环读它决定"这一轮要不要去拉任务"——在线时不必拉（任务会被推来）。
 */
let online = false;

/**
 * WebSocket 是否在线。
 *
 * @returns 在线为 `true`
 */
export function isBridgeSocketOnline(): boolean
{
    return online;
}

/**
 * 启动 WebSocket 客户端（幂等由调用方保证：它只被 `startBridge()` 调一次）。
 *
 * @param options 选项
 * @returns 停止函数（关闭连接并取消重连）
 */
export function startBridgeSocket(options: BridgeSocketOptions): () => void
{
    let socket: WebSocket | null = null;
    let stopped = false;
    let attempt = 0;
    let reconnectTimer = 0;

    /**
     * 更新在线状态并通知。
     *
     * @param value 新状态
     */
    function setOnline(value: boolean): void
    {
        if (online === value) return;

        online = value;
        options.onOnlineChange?.(value);
    }

    /**
     * 处理一个任务载荷（形状不对就丢）。
     *
     * @param payload 任务
     */
    function handleTask(payload: unknown): void
    {
        const task = payload as Partial<BridgeRequest>;

        if (typeof task?.id !== 'string' || typeof task?.method !== 'string') return;

        void options.onRequest(task as BridgeRequest);
    }

    /**
     * 排下一次重连（退避）。
     */
    function scheduleReconnect(): void
    {
        if (stopped || reconnectTimer) return;

        const delay = RECONNECT_DELAYS_MS[Math.min(attempt, RECONNECT_DELAYS_MS.length - 1)];

        attempt++;
        reconnectTimer = window.setTimeout(() =>
        {
            reconnectTimer = 0;
            connect();
        }, delay);
    }

    /**
     * 建立连接。
     */
    function connect(): void
    {
        if (stopped) return;

        try
        {
            socket = new WebSocket(options.url);
        }
        catch
        {
            // 地址不合法（例如页面不在 http(s) 下）：静默退回轮询，不再重试
            stopped = true;

            return;
        }

        socket.onopen = () =>
        {
            attempt = 0;
            socket?.send(JSON.stringify({ type: 'hello', clientId: options.clientId }));
            setOnline(true);
        };

        socket.onmessage = (event) =>
        {
            let message: { type?: string; task?: unknown; tasks?: unknown[]; name?: unknown; payload?: unknown };

            try
            {
                message = JSON.parse(String(event.data));
            }
            catch
            {
                return;
            }

            if (message.type === 'task') handleTask(message.task);
            // 连上时服务端会把积压的任务一次交过来
            else if (message.type === 'tasks' && Array.isArray(message.tasks))
            {
                for (const task of message.tasks) handleTask(task);
            }
            // 服务端事件（#272 P2 第二阶段）：宿主服务广播"外面发生了什么"。
            // 与任务不同，它不消耗队列、可以广播给所有页面
            else if (message.type === 'event' && typeof message.name === 'string')
            {
                dispatchBridgeEvent(message.name, message.payload);
            }
        };

        socket.onclose = () =>
        {
            setOnline(false);
            scheduleReconnect();
        };

        socket.onerror = () =>
        {
            // onclose 紧随其后，重连在那儿排——这里只标记离线，免得重复排
            setOnline(false);
        };
    }

    connect();

    return () =>
    {
        stopped = true;
        setOnline(false);

        if (reconnectTimer) window.clearTimeout(reconnectTimer);

        reconnectTimer = 0;
        socket?.close();
        socket = null;
    };
}
