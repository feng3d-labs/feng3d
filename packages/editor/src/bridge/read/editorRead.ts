import { logic as getLogic } from 'feng3d';
import type { Object3D } from 'feng3d';
import { getActiveEditorView } from '../../feng3d/editorViewRegistry';
import { EditorData } from '../../global/EditorData';
import { queryEditorLogs } from '../../utils/editorLog';
import type { EditorLogType } from '../../utils/editorLog';
import { summarizeValue, resolveObjectId, getObjectId } from './readCore';
import { projectObjectView, getCanvasSize, getProjector } from './viewProject';

/** 当前选中对象 */
export function selectionGet(): unknown
{
    const selected = EditorData.editorData.selectedObject3Ds ?? [];
    const project = getProjector();
    const canvasSize = getCanvasSize();

    return {
        count: selected.length,
        objects: selected.map((object) => ({
            id: getObjectId(object),
            name: object.name,
            // 用户说"就这个"时，AI 得知道它是什么类型、能不能直接看到、在画面哪个位置
            types: (object.components ?? []).map((component) => component.__type__),
            view: projectObjectView(object, project, canvasSize),
        })),
    };
}

/**
 * 选中对象。
 *
 * 用途：AI 需要让**用户看见**它指的是哪个对象（高亮 + gizmo），也为随后的 `view.screenshot`
 * 提供明确的视觉焦点。
 *
 * 归入只读通道（不需要 `?bridge=write`）：它只改编辑器的 UI 选中状态，**不改动场景数据**，
 * 而且用户随手点一下就会被覆盖，不是破坏性操作。
 *
 * @param params.objectIds 路径式 id 数组；也可传单个 `objectId`。传空数组表示清空选中
 */
export function selectionSet(params: Record<string, unknown>): unknown
{
    const rawIds = params.objectIds ?? (params.objectId === undefined ? [] : [params.objectId]);
    if (!Array.isArray(rawIds)) throw new Error('objectIds 必须是字符串数组（也可传单个 objectId）');

    const objects = rawIds.map((id) => resolveObjectId(String(id)));

    if (objects.length === 0)
    {
        EditorData.editorData.clearSelectedObjects();
    }
    else
    {
        // isAdd = false：替换当前选中。追加语义会让 AI 无法"只选中这一个"
        EditorData.editorData.selectMultiObject(objects, false);
    }

    return selectionGet();
}

/**
 * 解析取景距离参数。
 *
 * 只接受正数：距离为 0 或负数会让相机与目标重合（画面变成一团糊）；
 * 非法值不做兜底而直接报错，否则调用方会以为"退远看整体"生效了。
 *
 * @param params 桥接参数
 * @returns 距离；未提供时返回 `undefined`，交给 `focusOn` 自动取景
 */
function readFocusDistance(params: Record<string, unknown>): number | undefined
{
    if (params.distance === undefined) return undefined;
    const distance = Number(params.distance);
    if (!Number.isFinite(distance) || distance <= 0)
    {
        throw new Error(`distance 需要正数，收到：${JSON.stringify(params.distance)}`);
    }

    return distance;
}

/**
 * 把编辑器相机对准指定对象（看特写）。
 *
 * 用途：`scene.bounds` 只知道尺寸、`view.screenshot` 只给全景；AI 要看某个对象的细节时，
 * 需要先移动相机。归入只读通道：它只移动**编辑器相机**（视图状态），不改场景数据。
 *
 * @param params.objectId 目标对象路径式 id
 * @param params.distance 相机到目标的距离，省略则自动取景刚好框住它；
 *   给更大的值即"退远点看整体"
 */
export function cameraFocus(params: Record<string, unknown>): unknown
{
    const objectId = String(params.objectId ?? '');
    if (!objectId) throw new Error('缺少 objectId');

    const view = getActiveEditorView();
    if (!view) throw new Error('找不到编辑器视图（EditorView 尚未创建）');

    const object = resolveObjectId(objectId);
    view.focusOn(object, readFocusDistance(params));

    return { focused: objectId, name: object.name };
}

/**
 * 视角预设 → 相机宿主对象的旋转（弧度）。
 *
 * 相机前向 = 旋转矩阵 × (0,0,-1)（与 `Object3DLogic` 的矩阵构造同源），因此
 * 「从 +Z 方向看过去」对应旋转为 0。
 */
const VIEW_ROTATIONS: Record<string, { x: number, y: number, z: number }> = {
    front: { x: 0, y: 0, z: 0 },
    back: { x: 0, y: Math.PI, z: 0 },
    right: { x: 0, y: Math.PI / 2, z: 0 },
    left: { x: 0, y: -Math.PI / 2, z: 0 },
    top: { x: -Math.PI / 2, y: 0, z: 0 },
    bottom: { x: Math.PI / 2, y: 0, z: 0 },
    iso: { x: -Math.PI / 6, y: -Math.PI / 4, z: 0 },
};

/**
 * 从预设方向观察某个对象（可只调朝向而不取景）。
 *
 * 为什么需要它：`camera.focus` 只框住对象、**保留当前朝向**，所以 AI 没法表达"从上方看"
 * 这类意图——而很多问题（腿装反、物体悬空）只有换视角才看得出来。
 * 归入只读通道：只动编辑器相机，不改场景数据。
 *
 * @param params.preset `front` / `back` / `left` / `right` / `top` / `bottom` / `iso`（默认 `iso`）
 * @param params.objectId 取景目标，省略则只设置朝向、不改变距离
 * @param params.distance 取景距离（配合 objectId），省略则自动框住目标
 */
export function cameraSetView(params: Record<string, unknown>): unknown
{
    const view = getActiveEditorView();
    if (!view) throw new Error('找不到编辑器视图（EditorView 尚未创建）');

    const preset = String(params.preset ?? 'iso');
    const rotation = VIEW_ROTATIONS[preset];
    if (!rotation) throw new Error(`preset 只能是 ${Object.keys(VIEW_ROTATIONS).join(' / ')}，收到：${preset}`);

    // 顺序：先设朝向，再取景（focusOn 保留朝向、只调距离与裁剪面）
    view.setCameraRotation(rotation);

    if (params.objectId === undefined) return { preset, rotation };

    const target = resolveObjectId(String(params.objectId));
    view.focusOn(target, readFocusDistance(params));

    return { preset, rotation, targetId: getObjectId(target), targetName: target.name };
}

/**
 * 编辑器相机的当前状态（位置与朝向）。
 *
 * 为什么要报出来：AI 调 `camera.focus` / `camera.setView` 之后没有别的办法确认"现在从哪看"，
 * 而"换个视角再看一眼"之类的判断全依赖它。
 *
 * @returns 位置 / 朝向（相机未就绪时返回 `null`，不编造坐标）
 */
export function readCameraState(): unknown
{
    const view = getActiveEditorView();
    const camera = view?.camera;
    if (!camera) return null;
    const object = getLogic(camera)?.entity as Object3D | null;
    if (!object) return null;
    const fov = (camera as { fov?: number }).fov;

    return {
        position: summarizeValue(object.position),
        rotation: summarizeValue(object.rotation),
        ...(typeof fov === 'number' ? { fov } : {}),
    };
}

/**
 * 读取编辑器日志（只读）。
 *
 * 价值：桥接调用成功**不代表场景没问题**——渲染报错、材质告警、未捕获异常都只出现在控制台。
 * 这里返回的正是用户在控制台面板看到的同一份日志（共享缓冲，见 `utils/editorLog.ts`）。
 *
 * 增量读取：先读一次拿到 `lastSeq`，下次传 `sinceSeq` 就只取新增的。
 *
 * @param params.grep 关键字过滤（大小写不敏感）
 * @param params.grepRegex 正则过滤（区分大小写）——子串匹配不了"这几个对象相关的日志"
 *   （`(Ball|Cube)\d+`）；与 `grep` 同时给时两者都要满足
 * @param params.sinceSeq 只要 seq 大于该值的（增量读取）
 */
export function logTail(params: Record<string, unknown>): unknown
{
    const type = (params.type === undefined ? 'all' : String(params.type)) as EditorLogType | 'all';
    if (type !== 'all' && !['log', 'warn', 'error', 'info'].includes(type))
    {
        throw new Error(`type 只能是 all / log / warn / error / info，收到：${type}`);
    }

    return queryEditorLogs({
        type,
        limit: params.limit === undefined ? 50 : Number(params.limit),
        sinceSeq: params.sinceSeq === undefined ? undefined : Number(params.sinceSeq),
        sinceTimestamp: params.sinceTimestamp === undefined ? undefined : Number(params.sinceTimestamp),
        grep: params.grep === undefined ? undefined : String(params.grep),
        grepRegex: params.grepRegex === undefined ? undefined : String(params.grepRegex),
        includeStack: params.includeStack !== false,
        maxMessageLength: params.maxMessageLength === undefined ? undefined : Number(params.maxMessageLength),
    });
}
