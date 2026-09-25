#!/usr/bin/env node
/**
 * 编辑器只读桥接的 MCP server（P1）。
 *
 * 把 `/__editor-bridge` 的只读方法包装成 MCP tools，供 DSH 等 MCP 客户端通过 **stdio** 调用。
 * 传输层按 MCP 规范：stdin/stdout 上**每行一个 JSON-RPC 2.0 消息**（不是 LSP 的 Content-Length 分帧）。
 *
 * 环境变量：
 * - `EDITOR_BRIDGE_URL`：dev server 地址；省略时自动探测 3000→3003（Vite 端口会漂，见 editor-bridge-base.mjs）
 * - `EDITOR_BRIDGE_TIMEOUT_MS`：单次调用超时，默认 30000
 *
 * 前提：dev server 在跑，**且编辑器页面已在浏览器中打开**（桥接前端跑在页面里）。
 * 细节见 docs/EDITOR_AI_BRIDGE.md。
 */
import { createInterface } from 'node:readline';
import { resolveBridgeBase } from './editor-bridge-base.mjs';

const PREFIX = '/__editor-bridge';
const PROTOCOL_VERSION = '2024-11-05';
const TIMEOUT_MS = Number(process.env.EDITOR_BRIDGE_TIMEOUT_MS ?? 30000);

/** 调用桥接：先投递任务，再长轮询取结果 */
async function callBridge(method, params = {})
{
    const base = await resolveBridgeBase();
    const callResponse = await fetch(`${base}${PREFIX}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, params }),
    });
    if (!callResponse.ok)
    {
        throw new Error(`桥接调用失败 HTTP ${callResponse.status}：${await callResponse.text()}`);
    }

    const { id } = await callResponse.json();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try
    {
        const resultResponse = await fetch(`${base}${PREFIX}/result?id=${encodeURIComponent(id)}`, {
            signal: controller.signal,
        });
        const payload = await resultResponse.json();
        if (payload.ok === false) throw new Error(payload.error ?? '桥接执行失败');

        return payload.result;
    }
    finally
    {
        clearTimeout(timer);
    }
}

/** MCP tools 定义（全部只读） */
const TOOLS = [
    {
        name: 'editor_info',
        description: '编辑器与桥接通道概览：是否有场景、场景名、选中对象数、当前工具类型、可用方法。',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
    {
        name: 'scene_summary',
        description: '场景层级摘要：对象数、组件数、最大深度、一级子对象（含 id 与组件类型）。不含几何数据，适合先建立整体印象。',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
    {
        name: 'scene_list',
        description: '分层展开场景树。返回每个节点的 id、名称、组件类型、子对象数；depth 控制展开层数以避免上下文膨胀。',
        inputSchema: {
            type: 'object',
            properties: {
                path: { type: 'string', description: '起始节点的路径式 id，如 /Untitled；省略则从场景根开始' },
                depth: { type: 'number', description: '展开层数，默认 2' },
            },
            additionalProperties: false,
        },
    },
    {
        name: 'scene_get',
        description: '单个对象详情：变换（position/rotation/scale）、父与子对象、组件及其参数摘要（已剔除顶点数组等大字段）。',
        inputSchema: {
            type: 'object',
            properties: { objectId: { type: 'string', description: '路径式 id，如 /Untitled/Plane' } },
            required: ['objectId'],
            additionalProperties: false,
        },
    },
    {
        name: 'scene_find',
        description: '按名称 / 组件类型 / tag 检索对象，返回匹配的 id 列表。至少提供一个条件。',
        inputSchema: {
            type: 'object',
            properties: {
                name: { type: 'string', description: '对象名精确匹配' },
                type: { type: 'string', description: '组件类型，如 MeshRenderer / PerspectiveCamera' },
                tag: { type: 'string', description: '对象 tag' },
                limit: { type: 'number', description: '返回上限，默认 50' },
            },
            additionalProperties: false,
        },
    },
    {
        name: 'scene_bounds',
        description: '对象的世界包围盒（min/max）。用于计算中心点等空间推理，例如"在平面中心添加立方体"。',
        inputSchema: {
            type: 'object',
            properties: { objectId: { type: 'string', description: '路径式 id' } },
            required: ['objectId'],
            additionalProperties: false,
        },
    },
    {
        name: 'selection_get',
        description: '当前在编辑器中选中的对象列表（id 与名称）。',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
    {
        name: 'selection_set',
        description: '选中（高亮）指定对象，让用户看见 AI 指的是哪个对象，也为随后的 view_screenshot 提供视觉焦点。'
            + '只改编辑器 UI 选中状态、不改场景数据，因此不需要写通道。传空数组清空选中。',
        inputSchema: {
            type: 'object',
            properties: {
                objectIds: { type: 'array', items: { type: 'string' }, description: '路径式 id 数组；空数组表示清空选中' },
            },
            additionalProperties: false,
        },
    },
    {
        name: 'camera_focus',
        description: '把编辑器相机对准指定对象（框住它看特写）。保留相机当前朝向，只调整距离与裁剪面。'
            + '只移动编辑器相机、不改场景数据，因此不需要写通道。常与 view_screenshot 搭配。',
        inputSchema: {
            type: 'object',
            properties: { objectId: { type: 'string', description: '目标对象路径式 id' } },
            required: ['objectId'],
            additionalProperties: false,
        },
    },
    {
        name: 'view_screenshot',
        description: '抓取编辑器场景视图的当前画面（所见即所得，含 gizmo 与网格线），返回 PNG 图片。'
            + '改完场景后用它确认"画面到底变成什么样"。默认缩放到 800px 宽以避免上下文膨胀。',
        inputSchema: {
            type: 'object',
            properties: {
                width: { type: 'number', description: '目标宽度（像素），默认 800；传 0 表示保持原尺寸不缩放' },
            },
            additionalProperties: false,
        },
    },
    {
        name: 'log_tail',
        description: '读取编辑器控制台日志（与用户在控制台面板看到的是同一份缓冲）。'
            + '改完场景后用它确认有没有报错——桥接调用成功不代表渲染没出问题。'
            + '支持 type/limit/grep 过滤，以及 sinceSeq 增量读取（先读一次拿 lastSeq，之后只取新增）。',
        inputSchema: {
            type: 'object',
            properties: {
                type: { type: 'string', description: 'all（默认）/ log / warn / error / info' },
                limit: { type: 'number', description: '返回最近多少条，默认 50，上限 1000' },
                grep: { type: 'string', description: '关键字过滤（大小写不敏感，匹配 message）' },
                sinceSeq: { type: 'number', description: '只要 seq 大于该值的（增量读取）' },
                sinceTimestamp: { type: 'number', description: '只要时间戳不早于该值的（毫秒）' },
                includeStack: { type: 'boolean', description: '是否包含堆栈，默认 true' },
                maxMessageLength: { type: 'number', description: '单条消息最大字符数，默认 2000' },
            },
            additionalProperties: false,
        },
    },
    {
        name: 'scene_set',
        description: '写入对象字段（可撤销）。path 支持 position.y、components[0].material.uniforms.u_diffuse.r 这类形式。'
            + '需要写通道已启用：编辑器 URL 加 ?bridge=write。',
        inputSchema: {
            type: 'object',
            properties: {
                objectId: { type: 'string', description: '路径式 id，如 /Untitled/Plane' },
                path: { type: 'string', description: '字段路径，如 position.y' },
                value: { description: '新值（任意 JSON 可表达的值）' },
            },
            required: ['objectId', 'path'],
            additionalProperties: false,
        },
    },
    {
        name: 'history_status',
        description: '撤销栈状态：写通道是否启用、可撤销/可重做数量与操作标签。',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
    {
        name: 'scene_add',
        description: '新增对象（可撤销），返回新对象的路径式 id。parentId 省略时挂到场景根；'
            + 'components 传纯数据字面量数组，例如 [{ __type__: "MeshRenderer", geometry: { __type__: "CubeGeometry" } }]。'
            + '需要写通道已启用（编辑器 URL 加 ?bridge=write）。',
        inputSchema: {
            type: 'object',
            properties: {
                parentId: { type: 'string', description: '父对象路径式 id，省略则挂到场景根' },
                name: { type: 'string', description: '对象名，默认 Object3D' },
                position: { description: '{ x, y, z }' },
                rotation: { description: '{ x, y, z }（弧度）' },
                scale: { description: '{ x, y, z }' },
                components: { description: '组件字面量数组' },
            },
            additionalProperties: false,
        },
    },
    {
        name: 'scene_remove',
        description: '删除对象及其子树（可撤销：撤销时插回原父级原位置）。不能删除场景根。',
        inputSchema: {
            type: 'object',
            properties: { objectId: { type: 'string', description: '要删除的对象路径式 id' } },
            required: ['objectId'],
            additionalProperties: false,
        },
    },
    {
        name: 'scene_reparent',
        description: '把对象移动到另一个父级（可撤销），可选 index 指定插入位置。拒绝把对象挂到自己的子孙下（防环）。',
        inputSchema: {
            type: 'object',
            properties: {
                objectId: { type: 'string', description: '要移动的对象路径式 id' },
                parentId: { type: 'string', description: '新父级路径式 id' },
                index: { type: 'number', description: '插入位置，省略则追加到末尾' },
            },
            required: ['objectId', 'parentId'],
            additionalProperties: false,
        },
    },
    {
        name: 'scene_save',
        description: '把当前场景写回存储，使改动在刷新页面后仍然存在。注意：浏览器环境下写入 indexedDB'
            + '（nativeFS 才落磁盘），所以不会出现在项目文件里，但 readScene 能从同一处读回。需要写通道已启用。',
        inputSchema: {
            type: 'object',
            properties: { path: { type: 'string', description: '存储路径，默认 default.scene.json' } },
            additionalProperties: false,
        },
    },
    {
        name: 'history_undo',
        description: '撤销一步写操作。',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
    {
        name: 'history_redo',
        description: '重做一步写操作。',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
    {
        name: 'log_clear',
        description: '清空编辑器控制台日志。复现问题前先清空、再复现，这样 log_tail 读到的只有本次日志。需要写通道已启用。',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
];

/** 执行 tool 调用，返回 MCP 的 CallToolResult */
async function handleTool(name, args)
{
    const map = {
        editor_info: 'editor.info',
        scene_summary: 'scene.summary',
        scene_list: 'scene.list',
        scene_get: 'scene.get',
        scene_find: 'scene.find',
        scene_bounds: 'scene.bounds',
        selection_get: 'selection.get',
        selection_set: 'selection.set',
        camera_focus: 'camera.focus',
        view_screenshot: 'view.screenshot',
        log_tail: 'log.tail',
        scene_set: 'scene.set',
        scene_add: 'scene.add',
        scene_remove: 'scene.remove',
        scene_reparent: 'scene.reparent',
        scene_save: 'scene.save',
        history_status: 'history.status',
        history_undo: 'history.undo',
        history_redo: 'history.redo',
        log_clear: 'log.clear',
    };
    const method = map[name];
    if (!method) throw new Error(`未知 tool：${name}`);

    const result = await callBridge(method, args ?? {});

    if (name === 'view_screenshot' && result?.base64)
    {
        return {
            content: [
                { type: 'image', data: result.base64, mimeType: result.mimeType ?? 'image/png' },
                { type: 'text', text: `画布 ${result.width}x${result.height}` },
            ],
        };
    }

    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
}

function send(message)
{
    process.stdout.write(`${JSON.stringify(message)}\n`);
}

const rl = createInterface({ input: process.stdin });

/**
 * 串行处理：readline 的 `line` 事件不会等待上一个 handler 结束，
 * 并发处理会让 `tools/call` 的响应乱序，因此用 Promise 队列串起来。
 */
let queue = Promise.resolve();

// 管道模式（如 `echo ... | node server`）下 stdin 会立刻关闭；必须等队列处理完再退出，
// 否则响应还没写出去进程就结束了。
rl.on('close', () => { void queue.finally(() => process.exit(0)); });

rl.on('line', (line) =>
{
    queue = queue.then(() => handleLine(line)).catch(() => undefined);
});

async function handleLine(line)
{
    const text = line.trim();
    if (!text) return;

    let message;
    try
    {
        message = JSON.parse(text);
    }
    catch
    {
        return; // 非 JSON 行（如日志串入 stdout）直接忽略
    }

    const { id, method, params } = message;
    try
    {
        if (method === 'initialize')
        {
            return send({
                jsonrpc: '2.0',
                id,
                result: {
                    protocolVersion: PROTOCOL_VERSION,
                    capabilities: { tools: {} },
                    serverInfo: { name: 'feng3d-editor-bridge', version: '0.1.0' },
                },
            });
        }
        if (method === 'notifications/initialized') return;
        if (method === 'tools/list') return send({ jsonrpc: '2.0', id, result: { tools: TOOLS } });
        if (method === 'tools/call')
        {
            const result = await handleTool(params?.name, params?.arguments);

            return send({ jsonrpc: '2.0', id, result });
        }
        if (id !== undefined)
        {
            send({ jsonrpc: '2.0', id, error: { code: -32601, message: `未知方法 ${method}` } });
        }
    }
    catch (e)
    {
        if (id !== undefined)
        {
            send({ jsonrpc: '2.0', id, error: { code: -32603, message: String(e?.message ?? e) } });
        }
    }
}
