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
        description: '场景层级摘要：对象数、组件数、最大深度、一级子对象（含 id 与组件类型），以及可渲染对象里'
            + '可见 / 不可见的数量。不含几何数据，适合先建立整体印象——"我刚加的东西几个看得见"也在这里。',
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
        description: '对象详情：变换（position/rotation/scale）、父与子对象、组件及其参数摘要（已剔除顶点数组等大字段）。'
            + '支持一次取多个（objectIds），便于对比几个对象。',
        inputSchema: {
            type: 'object',
            properties: {
                objectId: { type: 'string', description: '路径式 id，如 /Untitled/Plane' },
                objectIds: { type: 'array', items: { type: 'string' }, description: '一次取多个对象的 id' },
                includeScreen: {
                    type: 'boolean',
                    description: '是否附带 view（NDC 与是否在相机视野内），默认 false——与 scene_find 的 includeScreen 一致',
                },
            },
            additionalProperties: false,
        },
    },
    {
        name: 'scene_find',
        description: '按名称 / 组件类型 / tag 检索对象。名称支持精确（name）、子串（nameContains，大小写不敏感）、'
            + '正则（namePattern）三种写法，覆盖记不准名字的情形。至少提供一个条件。',
        inputSchema: {
            type: 'object',
            properties: {
                name: { type: 'string', description: '对象名精确匹配' },
                nameContains: { type: 'string', description: '名称包含该子串（大小写不敏感），如 sphere' },
                namePattern: { type: 'string', description: '名称匹配该正则，如 ^AISphere\\d$' },
                type: { type: 'string', description: '组件类型，如 MeshRenderer / PerspectiveCamera' },
                tag: { type: 'string', description: '对象 tag' },
                limit: { type: 'number', description: '返回上限，默认 50' },
                includeTransform: { type: 'boolean', description: '是否附带 position，默认 false' },
                includeScreen: {
                    type: 'boolean',
                    description: '是否附带 view（NDC 与是否在相机视野内），默认 false——'
                        + '用来回答"找到的这些东西看得见吗、在画面哪个方位"',
                },
                includeBounds: {
                    type: 'boolean',
                    description: '是否附带各自的包围盒（min/max），默认 false——省掉对每个结果再调一次 scene_bounds',
                },
                where: {
                    description: '按字段值过滤，如 { path: "position.y", op: "lt", value: 0 } 可找出掉到平面下的对象；'
                        + 'op 可用 eq / ne / lt / lte / gt / gte / exists。传**数组**表示全部满足（AND），'
                        + '如 [{ path: "position.y", op: "gt", value: 0 }, { path: "activeSelf", op: "eq", value: true }]',
                },
            },
            additionalProperties: false,
        },
    },
    {
        name: 'scene_bounds',
        description: '世界包围盒（min/max）。用于计算中心点等空间推理，例如"在平面中心添加立方体"。'
            + '传 objectIds 可一次拿多个对象**合并后**的包围盒——回答"这一堆整体占多大、中心在哪"，'
            + '不必逐个取回来自己合并。',
        inputSchema: {
            type: 'object',
            properties: {
                objectId: { type: 'string', description: '单个对象的路径式 id' },
                objectIds: { type: 'array', items: { type: 'string' }, description: '多个对象（最多 200 个），返回合并后的包围盒' },
            },
            additionalProperties: false,
        },
    },
    {
        name: 'selection_get',
        description: '当前在编辑器中选中的对象列表：id、名称、组件类型，以及它是否在相机视野内。'
            + '用户说"就这个"时，用它确认 AI 与用户指的是不是同一个东西。',
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
            + '只移动编辑器相机、不改场景数据，因此不需要写通道。常与 view_probe / view_screenshot 搭配。',
        inputSchema: {
            type: 'object',
            properties: {
                objectId: { type: 'string', description: '目标对象路径式 id' },
                distance: {
                    type: 'number',
                    description: '相机到目标的距离，省略则自动取景刚好框住它；给更大的值即"退远点看整体"',
                },
            },
            required: ['objectId'],
            additionalProperties: false,
        },
    },
    {
        name: 'camera_set_view',
        description: '从预设方向观察对象：front / back / left / right / top / bottom / iso。'
            + 'camera_focus 只框住对象、保留当前朝向，所以"从上方看"这类意图要用它。'
            + '只移动编辑器相机、不改场景数据，不需要写通道。常与 view_screenshot 搭配。',
        inputSchema: {
            type: 'object',
            properties: {
                preset: {
                    type: 'string',
                    enum: ['front', 'back', 'left', 'right', 'top', 'bottom', 'iso'],
                    description: '视角方向，默认 iso（等距）',
                },
                objectId: { type: 'string', description: '取景目标；省略则只设置朝向、不改变距离' },
                distance: { type: 'number', description: '取景距离（配合 objectId），省略则自动框住目标' },
            },
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
        name: 'view_probe',
        description: '取场景视图的像素统计（不返回图片，只有几百字节）。用于判断"画面上到底有没有东西"：'
            + 'uniqueColors 为 1 且亮度无范围 = 纯色画面（空白/冻结）；maxLuminance 为 0 = 全黑（材质或渲染出错）；'
            + 'dominantColors 看背景与物体各占多少；grid 是灰度缩略网格，能看出构图轮廓。'
            + '写操作前后各调一次比较，比截图省几十倍上下文；确实要看画面细节时再用 view_screenshot。'
            + '传 project（对象 id 数组）还能同时拿到这些对象在画面上的像素坐标与是否可见——'
            + '"我加的东西看得见吗、在画面哪儿"由此有了判据。',
        inputSchema: {
            type: 'object',
            properties: {
                grid: { type: 'number', description: '灰度缩略网格边长，默认 8；传 0 不返回网格，上限 32' },
                colors: { type: 'number', description: '返回的主色数量，默认 5，上限 16' },
                project: {
                    type: 'array',
                    description: '要投影到画面坐标的对象 id（最多 20 个），返回各自的 NDC、screen 像素与 visible',
                    items: { type: 'string' },
                },
                region: {
                    type: 'object',
                    description: '只统计画布上的一块区域 { x, y, width, height }（像素坐标，会被裁到画布内）——'
                        + '配合 project 给出的坐标，可精确检查"我关心的那一块渲染出来了吗"',
                },
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
        name: 'scene_validate',
        description: '场景健康检查：没有相机/光源、MeshRenderer 缺几何、变换含 NaN、scale 为 0、同级重名等。'
            + '改完场景后用它排查"画面不对但看不出原因"。issues 的 level：error=基本渲染不出来，warn=很可能不是你要的效果。',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
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
        name: 'scene_set_many',
        description: '对多个对象写入同一字段（一次撤销）。适合"这些球都变蓝"这类批量修改：'
            + '先全部校验再统一落笔，要么全改、要么一个都不改，撤销只需一步。需要写通道已启用。',
        inputSchema: {
            type: 'object',
            properties: {
                objectIds: { type: 'array', items: { type: 'string' }, description: '目标对象路径式 id 数组，最多 200' },
                path: { type: 'string', description: '字段路径，如 components[0].material.uniforms.u_diffuse' },
                value: { description: '新值' },
                create: { type: 'boolean', description: '字段不存在时是否新建，默认 false' },
            },
            required: ['objectIds', 'path'],
            additionalProperties: false,
        },
    },
    {
        name: 'scene_set_fields',
        description: '一次给**同一个对象**写多个字段（原子、只占一个撤销步）。与 scene_set_many 互补：'
            + '那边是"多个对象、同一字段"，这边是"同一个对象、多个字段"。摆一个对象常要同时定位置、'
            + '旋转、缩放，分三次调用既慢又可能只成功一半。字段不存在或类型不符会直接报错。需要写通道已启用。',
        inputSchema: {
            type: 'object',
            properties: {
                objectId: { type: 'string', description: '目标对象路径式 id' },
                fields: {
                    type: 'object',
                    description: '形如 { "position.y": 1, "scale.x": 2 }，最多 50 个；'
                        + '同一容器与其内部字段（position 与 position.y）同时写时以书写顺序为准',
                },
            },
            required: ['objectId', 'fields'],
            additionalProperties: false,
        },
    },
    {
        name: 'scene_set_environment',
        description: '设置场景背景色与环境光（可撤销）。不必先查 Scene 组件在 components[N] 里的位置。需要写通道已启用。',
        inputSchema: {
            type: 'object',
            properties: {
                background: { description: '背景色 { r, g, b, a? }（0~1）' },
                ambientColor: { description: '环境光颜色 { r, g, b, a? }（0~1）' },
            },
            additionalProperties: false,
        },
    },
    {
        name: 'scene_set_material',
        description: '设置材质外观（可撤销、可批量）：color 漫反射色、specular 高光色、ambient 环境色'
            + '（均为 { r, g, b, a? }）、glossiness 光泽度、reflectivity 反射强度、alphaThreshold 透明裁剪。'
            + '比直接写 components[N].material.uniforms.u_glossiness 这类路径可靠。仅支持 StandardMaterial。',
        inputSchema: {
            type: 'object',
            properties: {
                objectId: { type: 'string', description: '目标对象路径式 id' },
                objectIds: { type: 'array', items: { type: 'string' }, description: '批量目标（最多 200）' },
                color: { description: '漫反射色 { r, g, b, a? }（0~1）' },
                specular: { description: '高光色 { r, g, b, a? }' },
                ambient: { description: '环境色 { r, g, b, a? }' },
                glossiness: { type: 'number', description: '光泽度（越大越集中）' },
                reflectivity: { type: 'number', description: '反射强度' },
                alphaThreshold: { type: 'number', description: '透明裁剪阈值' },
            },
            additionalProperties: false,
        },
    },
    {
        name: 'scene_arrange',
        description: '排列一组对象：沿某轴等间距排开（line）、中心对齐（align）或围成一圈（circle），一次撤销。'
            + '用世界包围盒计算，因此尺寸不同的对象也不会叠在一起。需要写通道已启用。',
        inputSchema: {
            type: 'object',
            properties: {
                objectIds: { type: 'array', items: { type: 'string' }, description: '至少 2 个对象的路径式 id' },
                axis: { type: 'string', enum: ['x', 'y', 'z'], description: 'line/align 沿哪个轴（默认 x）；circle 表示圆的法线方向（默认 y，即水平圆）' },
                mode: { type: 'string', enum: ['line', 'align', 'circle', 'grid'], description: 'line=等间距排开（默认）；align=中心对齐（默认到平均值，可用 value 指定坐标）；circle=围成一圈；grid=铺成网格' },
                spacing: { type: 'number', description: '仅 line 模式：间距，默认取这批对象在该轴的最大尺寸 × 1.2' },
                radius: { type: 'number', description: '仅 circle 模式：半径，默认取最大尺寸 × 1.5' },
                value: {
                    type: 'number',
                    description: '仅 align 模式：要对齐到的坐标（省略则取这批对象中心的平均值）。'
                        + '对齐的是包围盒中心，「贴到地面」要传 高度 / 2',
                },
                columns: { type: 'number', description: '仅 grid 模式：列数，默认取 ceil(√对象数)' },
                centerObjectId: { type: 'string', description: '仅 circle 模式：以该对象为中心摆一圈（省略则以这批对象自身重心为圆心）' },
                center: { description: '仅 circle 模式：显式圆心 { x, y, z }，与 centerObjectId 二选一' },
            },
            required: ['objectIds'],
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
        description: '新增对象（可撤销），返回新对象的路径式 id。推荐用 shape 简写（自动配好网格与可选材质），'
            + '需要精细控制时才用 components 直传字面量。需要写通道已启用（编辑器 URL 加 ?bridge=write）。',
        inputSchema: {
            type: 'object',
            properties: {
                parentId: { type: 'string', description: '父对象路径式 id，省略则挂到场景根' },
                name: { type: 'string', description: '对象名，默认 Object3D' },
                tag: { type: 'string', description: '对象标签，之后可用 scene_find 的 tag 一次找回来' },
                shape: {
                    type: 'string',
                    enum: ['cube', 'sphere', 'plane', 'cylinder', 'cone', 'capsule', 'torus', 'quad'],
                    description: '形状简写：自动组装 MeshRenderer + 几何',
                },
                color: { description: '{ r, g, b, a? }（0~1），配合 shape 生成 StandardMaterial' },
                specular: { description: '{ r, g, b, a? }（0~1），高光色；与 scene_set_material 同一套字段' },
                glossiness: { type: 'number', description: '光泽度（越大越集中）' },
                reflectivity: { type: 'number', description: '反射强度' },
                alphaThreshold: { type: 'number', description: '透明裁剪阈值' },
                geometryParams: {
                    description: '几何构造参数，如 { radius: 0.5 }；参数名必须是该形状支持的'
                        + '（sphere: radius/segmentsW/segmentsH；cylinder 与 cone: topRadius/bottomRadius/height；'
                        + 'torus: radius/tubeRadius/segmentsR/segmentsT；cube: width/height/depth；plane: width/height），'
                        + '写错名字会直接报错而不是被静默忽略',
                },
                position: { description: '{ x, y, z }' },
                rotation: { description: '{ x, y, z }（弧度）' },
                scale: { description: '{ x, y, z }' },
                components: { description: '组件字面量数组（与 shape 互斥）' },
            },
            additionalProperties: false,
        },
    },
    {
        name: 'scene_duplicate',
        description: '复制对象（含子树与组件），可撤销。适合"再来几个一样的"——不必手写 components 字面量。'
            + '默认沿 X 轴依次排开，避免与原对象完全重叠而看不出变化。需要写通道已启用。',
        inputSchema: {
            type: 'object',
            properties: {
                objectId: { type: 'string', description: '要复制的对象路径式 id' },
                parentId: { type: 'string', description: '新对象的父级，默认与原对象同父级' },
                name: { type: 'string', description: '新对象名，默认 原名Copy；复制多份时自动追加序号' },
                position: { description: '{ x, y, z }，默认按包围盒宽度沿 X 轴错开' },
                offset: {
                    description: '{ x, y, z }，相对源对象的位移：第 i 个副本偏 (i+1) 份——'
                        + '"在旁边再放两个"用它比算绝对坐标自然。与 position 同时给时以 position 为准',
                },
                count: { type: 'number', description: '复制份数，默认 1，上限 50' },
            },
            required: ['objectId'],
            additionalProperties: false,
        },
    },
    {
        name: 'scene_group',
        description: '把一组对象归到一个新建的组下（可撤销），只占一个撤销步。适合整理散落的部件——'
            + '自己建空对象再逐个 reparent 要 N+1 次调用。需要写通道已启用。',
        inputSchema: {
            type: 'object',
            properties: {
                objectIds: { type: 'array', items: { type: 'string' }, description: '要归组的对象路径式 id，至少 1 个' },
                name: { type: 'string', description: '组名，默认 Group' },
                parentId: { type: 'string', description: '组的父级，默认与第一个成员同父级' },
            },
            required: ['objectIds'],
            additionalProperties: false,
        },
    },
    {
        name: 'scene_remove',
        description: '删除对象及其子树（可撤销：撤销时插回原父级原位置）。支持一次删多个（objectIds），'
            + '先全部校验再统一删除，不会删一半。不能删除场景根，需要写通道已启用。',
        inputSchema: {
            type: 'object',
            properties: {
                objectId: { type: 'string', description: '要删除的对象路径式 id（单个）' },
                objectIds: { type: 'array', items: { type: 'string' }, description: '要删除的多个对象 id（最多 200），与 objectId 二选一' },
            },
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
        description: '撤销一步写操作（一次一步，按撤销栈顺序）。要一次退回多处改动，用 scene_rollback 配合 scene_mark，'
            + '别靠连按 undo 数步数——数错会退过头，把用户之前的操作也撤掉。需要写通道已启用。',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
    {
        name: 'history_redo',
        description: '重做一步刚被撤销的写操作（仅对刚撤销、且其后没有新写入的那些操作有效）。需要写通道已启用。',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
    {
        name: 'scene_mark',
        description: '在撤销栈上打个标记（配合 scene_rollback）。要"先试试看"时先打标记，不满意一次退回，'
            + '不必自己数做了几步——数错就会退过头、把用户之前的操作也撤掉。需要写通道已启用。',
        inputSchema: {
            type: 'object',
            properties: { name: { type: 'string', description: '标记名，默认 default' } },
            additionalProperties: false,
        },
    },
    {
        name: 'scene_rollback',
        description: '回滚到 scene_mark 打的标记处：把该标记之后的写操作全部撤销（并消费掉这个标记）。需要写通道已启用。',
        inputSchema: {
            type: 'object',
            properties: { name: { type: 'string', description: '标记名，默认 default' } },
            additionalProperties: false,
        },
    },
    {
        name: 'scene_batch',
        description: '一次调用执行多步写操作，要么全成、要么全不成（事务语义）。搭多部件的东西时用它：'
            + '中途任一步失败会自动逆序回滚已完成的步骤，场景回到调用前，不会留下半成品让你去清理。'
            + '加大参数 dryRun: true 时只预演——整组操作照常跑一遍再全部回滚，返回每一步的结果供确认，'
            + '场景与撤销栈都不变（适合"先看看会发生什么"）。'
            + '与 scene_mark/scene_rollback 的区别：那两个是显式的试验-回退（适合探索），这个是自动的。'
            + 'steps 里只接受写方法，最多 50 步，不允许嵌套 scene_batch。需要写通道已启用。',
        inputSchema: {
            type: 'object',
            properties: {
                dryRun: { type: 'boolean', description: '传 true 只预演并回滚，场景不变（默认 false）' },
                steps: {
                    type: 'array',
                    description: '每步形如 { method: "scene.add", params: { name: "Leg" } }',
                    items: {
                        type: 'object',
                        properties: {
                            method: { type: 'string', description: '写方法名，如 scene.add / scene.set / scene.arrange' },
                            params: { type: 'object', description: '该方法自己的参数' },
                        },
                        required: ['method'],
                        additionalProperties: false,
                    },
                },
            },
            required: ['steps'],
            additionalProperties: false,
        },
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
        camera_set_view: 'camera.setView',
        view_screenshot: 'view.screenshot',
        view_probe: 'view.probe',
        log_tail: 'log.tail',
        scene_validate: 'scene.validate',
        scene_set: 'scene.set',
        scene_set_many: 'scene.setMany',
        scene_set_fields: 'scene.setFields',
        scene_set_environment: 'scene.setEnvironment',
        scene_set_material: 'scene.setMaterial',
        scene_arrange: 'scene.arrange',
        scene_add: 'scene.add',
        scene_duplicate: 'scene.duplicate',
        scene_group: 'scene.group',
        scene_remove: 'scene.remove',
        scene_reparent: 'scene.reparent',
        scene_save: 'scene.save',
        history_status: 'history.status',
        history_undo: 'history.undo',
        history_redo: 'history.redo',
        scene_mark: 'scene.mark',
        scene_rollback: 'scene.rollback',
        scene_batch: 'scene.batch',
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
