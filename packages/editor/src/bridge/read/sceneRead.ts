import { logic as getLogic } from 'feng3d';
import type { Object3D } from 'feng3d';
import { EditorData } from '../../global/EditorData';
import { mergeBounds, readBounds, countTree, summarizeValue, resolveObjectId, getObjectId, requireSceneRoot } from './readCore';
import { projectObjectView, getCanvasSize, objectCenter, isInsideNdc, getProjector } from './viewProject';

/**
 * 统计可渲染对象的可见情况（在不在相机视野内）。
 *
 * 与 `scene.validate` 的 outside-view 用同一套判据，区别只是这里给**数量**：
 * "我刚加了 10 个东西，几个看得见"是决定下一步做什么时最先想知道的事。
 *
 * @returns 可见 / 不可见的数量；相机尚未就绪时返回 `null`（不编造数字）
 */
function countVisibleRenderers(root: Object3D): { visible: number, invisible: number } | null
{
    const project = getProjector();
    if (!project) return null;

    let visible = 0;
    let invisible = 0;
    const walk = (object: Object3D) =>
    {
        if ((object.components ?? []).some((component) => component.__type__ === 'MeshRenderer'))
        {
            if (isInsideNdc(project(objectCenter(object)))) visible++;
            else invisible++;
        }
        for (const child of object.children ?? []) walk(child);
    };
    walk(root);

    return { visible, invisible };
}

/**
 * 场景层级摘要（AI 最常调的第一个方法：先建立整体印象）。
 *
 * @param params 暂不需要参数
 */
export function sceneSummary(): unknown
{
    const root = requireSceneRoot();
    const counts = countTree(root);
    const visibility = countVisibleRenderers(root);

    return {
        rootId: getObjectId(root),
        sceneName: root.name,
        objectCount: counts.objects,
        componentCount: counts.components,
        maxDepth: counts.maxDepth,
        selectedCount: EditorData.editorData.selectedObject3Ds?.length ?? 0,
        // "几个看得见"决定下一步是继续搭还是先找镜头，比总数更有用
        ...(visibility ? { renderVisible: visibility.visible, renderInvisible: visibility.invisible } : {}),
        children: (root.children ?? []).map((child) => ({
            id: getObjectId(child),
            name: child.name,
            childCount: (child.children ?? []).length,
            types: (child.components ?? []).map((c) => c.__type__),
        })),
        hint: '用 scene.list 展开某一层，用 scene.get 取单个对象详情；scene.find 可按名称/类型检索。',
    };
}

/**
 * 分层展开：默认只展开两层，避免上下文膨胀。
 *
 * `limit` 是第二道闸：两百个对象的场景在 depth=2 下能列出二十多万字符的树，足以把上下文撑爆。
 * 到量后不再展开，并如实标记 `truncated`——调用方可以缩小 depth 或按 path 逐层看。
 *
 * @param params.path 起始节点（省略为场景根）
 * @param params.depth 展开层数（默认 2）
 * @param params.limit 最多返回多少个节点（默认 100——每个节点约 110 字符，再多就为了"看清层级"
 *   付出几万字符的代价；上限 1000）
 */
export function sceneList(params: Record<string, unknown>): unknown
{
    const root = requireSceneRoot();
    const start = params.path ? resolveObjectId(String(params.path)) : root;
    const depth = params.depth === undefined ? 2 : Number(params.depth);
    const requested = params.limit === undefined ? 100 : Number(params.limit);
    const limit = Number.isFinite(requested) ? Math.max(1, Math.min(1000, Math.floor(requested))) : 100;

    let emitted = 0;
    let truncated = false;
    const build = (object: Object3D, level: number): unknown =>
    {
        const entries: unknown[] = [];
        if (level < depth)
        {
            for (const child of object.children ?? [])
            {
                if (emitted >= limit)
                {
                    truncated = true;
                    break;
                }
                entries.push(build(child, level + 1));
            }
        }
        emitted++;

        return {
            id: getObjectId(object),
            name: object.name,
            types: (object.components ?? []).map((c) => c.__type__),
            activeSelf: getLogic(object)?.activeSelf ?? true,
            childCount: (object.children ?? []).length,
            children: level >= depth ? undefined : entries,
        };
    };

    const node = build(start, 0);

    return {
        depth,
        limit,
        node,
        ...(truncated
            ? { truncated: true, hint: `只列出了前 ${emitted} 个节点——缩小 depth，或用 path 从某一层往下看` }
            : {}),
    };
}

/** 单个对象的详情：变换 + 组件摘要 */
function objectDetail(objectId: string, includeScreen = false, includeBounds = false): unknown
{
    const object = resolveObjectId(objectId);
    const objectLogic = getLogic(object);

    return {
        id: getObjectId(object),
        name: object.name,
        tag: object.tag,
        activeSelf: objectLogic?.activeSelf ?? true,
        position: object.position ?? null,
        rotation: object.rotation ?? null,
        scale: object.scale ?? null,
        parentId: objectLogic?.parent ? getObjectId(objectLogic.parent as Object3D) : null,
        children: (object.children ?? []).map((c) => ({ id: getObjectId(c), name: c.name })),
        components: (object.components ?? []).map((component) => ({
            __type__: component.__type__,
            params: summarizeValue(component),
        })),
        // 与 scene.find 的 includeScreen / includeBounds 同一套换算（同样的信息在两个方法里应当长得一样）
        ...(includeScreen ? { view: projectObjectView(object, getProjector(), getCanvasSize()) } : {}),
        ...(includeBounds ? { bounds: readBounds(objectId).bounds } : {}),
    };
}

/**
 * 单对象详情；也支持一次取多个（`objectIds`）。
 *
 * 多对象形态是为了省往返：AI 常要对比几个对象（"这两个球的位置差多少"），
 * 逐个查询会把一次交互拆成 N 次。
 *
 * @param params.includeScreen 附带 NDC 与是否在相机视野内（与 `scene.find` 一致）
 * @param params.includeBounds 附带世界包围盒（与 `scene.find` 一致）——省掉再调一次 `scene.bounds`
 */
export function sceneGet(params: Record<string, unknown>): unknown
{
    const rawIds = params.objectIds ?? (params.objectId === undefined ? undefined : [params.objectId]);
    if (rawIds === undefined) throw new Error('缺少 objectId（或 objectIds）；可用 scene.summary / scene.list 获取');
    if (!Array.isArray(rawIds) || rawIds.length === 0) throw new Error('objectIds 必须是非空数组');
    // 每个详情约 300 字符：一次问两百个就是六万字符，同样得有个闸
    const requested = params.limit === undefined ? 50 : Number(params.limit);
    const limit = Number.isFinite(requested) ? Math.max(1, Math.min(200, Math.floor(requested))) : 50;
    const picked = rawIds.slice(0, limit);

    const details = picked.map((id) => objectDetail(
        String(id),
        params.includeScreen === true,
        params.includeBounds === true,
    ));
    if (rawIds.length === 1) return details[0];

    return {
        count: details.length,
        total: rawIds.length,
        ...(rawIds.length > details.length
            ? { truncated: true, hint: `要求 ${rawIds.length} 个，只返回前 ${details.length} 个（可用 limit 调整）` }
            : {}),
        objects: details,
    };
}

/**
 * 世界包围盒。
 *
 * `selfWorldBounds` 由渲染侧 Logic 提供，形态可能是 Computed 也可能是裸值，这里做运行时探测，
 * 取不到时返回 null 而不是抛错（P1 目标是"能问"，不是"必须有答案"）。
 *
 * 支持一次问多个对象：合并后的包围盒回答的是"这一堆整体占多大、中心在哪"——
 * "把它们摆到某个位置"这类操作的前提，逐个调用再自己合并既啰嗦又容易算错。
 *
 * @param params.objectId 单个对象
 * @param params.objectIds 多个对象（最多 200 个），返回合并后的包围盒
 */
export function sceneBounds(params: Record<string, unknown>): unknown
{
    const rawIds = params.objectIds ?? (params.objectId === undefined ? undefined : [params.objectId]);
    if (rawIds === undefined) throw new Error('缺少 objectId 或 objectIds');
    if (!Array.isArray(rawIds) || rawIds.length === 0) throw new Error('objectIds 必须是非空数组');
    if (rawIds.length > 200) throw new Error(`一次最多 200 个对象（收到 ${rawIds.length}）`);

    const details = rawIds.map((rawId) => readBounds(String(rawId)));
    if (rawIds.length === 1) return details[0];

    const boxes = details.map((detail) => detail.bounds).filter((bounds) => !!bounds);
    const merged = mergeBounds(boxes);

    return {
        count: details.length,
        withBounds: boxes.length,
        bounds: merged,
        ...(merged ? {} : { reason: '这些对象都没有包围盒' }),
        objects: details,
    };
}
