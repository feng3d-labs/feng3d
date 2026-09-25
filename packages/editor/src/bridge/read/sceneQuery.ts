import type { Object3D } from 'feng3d';
import { readBounds, compareField, readFieldPath, resolveObjectId, getObjectId, requireSceneRoot } from './readCore';
import { projectObjectView, getCanvasSize, getProjector } from './viewProject';

/**
 * 按名称/类型/tag 检索对象。
 *
 * 名称支持三种写法，覆盖 AI 记不准名字的常见情形：
 * - `name`：精确匹配（原行为）
 * - `nameContains`：子串，大小写不敏感（"sphere" 能匹配到 AISphere）
 * - `namePattern`：正则（"^AISphere\\d$"）
 *
 * 还可用 `where` 按字段值过滤，例如"找出掉到平面下的对象"：
 * `{ where: { path: "position.y", op: "lt", value: 0 } }`。
 */
export function sceneFind(params: Record<string, unknown>): unknown
{
    const root = requireSceneRoot();
    const name = params.name === undefined ? undefined : String(params.name);
    const nameContains = params.nameContains === undefined ? undefined : String(params.nameContains).toLowerCase();
    const namePattern = params.namePattern === undefined ? undefined : String(params.namePattern);
    const type = params.type === undefined ? undefined : String(params.type);
    const tag = params.tag === undefined ? undefined : String(params.tag);
    const requestedLimit = params.limit === undefined ? 50 : Number(params.limit);
    if (!Number.isFinite(requestedLimit) || requestedLimit < 1)
    {
        throw new Error(`limit 需要正整数，收到：${JSON.stringify(params.limit)}`);
    }
    // 上限 500：再大就不是"检索"而是"倾倒整个场景"，上下文与内存都不划算
    const limit = Math.min(500, Math.floor(requestedLimit));
    const includeTransform = params.includeTransform === true;
    // 视野信息与 includeTransform 一样按需返回：它是"找没找到"之外最常被追问的一件事
    const includeScreen = params.includeScreen === true;
    const project = includeScreen ? getProjector() : null;
    const canvasSize = includeScreen ? getCanvasSize() : null;
    // 同理：找到之后常要问"它们各自多大、摆在哪儿"，一次带回来省掉 N 次 scene.bounds
    const includeBounds = params.includeBounds === true;
    // 排序：回答"哪个最高、谁离得最远"这类问题时，结果顺序本身就是答案
    const sortBy = params.sortBy === undefined ? undefined : String(params.sortBy);
    const order = params.order === undefined ? 'asc' : String(params.order);
    if (order !== 'asc' && order !== 'desc') throw new Error(`order 只能是 asc / desc，收到：${order}`);
    if (sortBy !== undefined && sortBy !== 'name' && !sortBy.startsWith('position.'))
    {
        throw new Error(`sortBy 只能是 name 或 position.<轴>（如 position.y），收到：${sortBy}`);
    }

    // where 既可以是单个条件，也可以是数组（数组表示**全部满足**）——
    // "y 在平面之上、且名字里带 Ball"这类筛选用单个条件表达不了，只能把结果拉回来自己再过一遍
    const rawWhere = params.where === undefined ? [] : (Array.isArray(params.where) ? params.where : [params.where]);
    const conditions = rawWhere.map((raw) =>
    {
        const condition = (raw ?? {}) as { path?: unknown, op?: unknown, value?: unknown };
        const path = String(condition.path ?? '');
        if (!path)
        {
            throw new Error('where.path 不能为空，例如 { where: { path: "position.y", op: "lt", value: 0 } }');
        }
        const op = String(condition.op ?? 'eq');
        const allowedOps = ['eq', 'ne', 'lt', 'lte', 'gt', 'gte', 'exists'];
        // 拼错 op 时静默返回 false 会让"筛不出东西"变得无法解释，所以直接报错
        if (!allowedOps.includes(op)) throw new Error(`where.op 只能是 ${allowedOps.join(' / ')}，收到：${op}`);

        return { path, op, value: condition.value };
    });

    if (name === undefined && nameContains === undefined && namePattern === undefined
        && type === undefined && tag === undefined && conditions.length === 0)
    {
        throw new Error('至少提供 name / nameContains / namePattern / type / tag / where 之一');
    }

    let regex: RegExp | undefined;
    if (namePattern !== undefined)
    {
        try
        {
            regex = new RegExp(namePattern);
        }
        catch (e)
        {
            throw new Error(`namePattern 不是合法正则：${String((e as { message?: string })?.message ?? e)}`);
        }
    }

    const matched: Record<string, unknown>[] = [];
    // 命中总数与返回条数分开：`count` 只是返回了几条，分不出"就这么多"与"还有更多"
    let totalHits = 0;
    const walk = (object: Object3D) =>
    {
        const objectName = object.name ?? 'Object3D';
        const typeNames = (object.components ?? []).map((c) => c.__type__);
        const hit = (name === undefined || objectName === name)
            && (nameContains === undefined || objectName.toLowerCase().includes(nameContains))
            && (regex === undefined || regex.test(objectName))
            && (tag === undefined || object.tag === tag)
            && (type === undefined || typeNames.includes(type))
            && conditions.every((condition) => compareField(readFieldPath(object, condition.path), condition.op, condition.value));
        if (hit)
        {
            totalHits++;
            // 到量之后仍继续遍历（只是为了把总数数准），但不再构造返回项——构造才是贵的那部分
            if (matched.length < limit)
            {
                matched.push({
                    id: getObjectId(object),
                    name: objectName,
                    types: typeNames,
                    // 位置往往和 id 一样重要（"找到并知道它在哪"），但要 AI 主动要才返回，避免膨胀
                    ...(includeTransform ? { position: object.position ?? null } : {}),
                    // 只给 NDC 与可见性（不给屏幕像素：find 面向"哪些对象在视野里"，无需画布尺寸）
                    ...(includeScreen ? { view: projectObjectView(object, project, canvasSize) } : {}),
                    ...(includeBounds ? { bounds: readBounds(getObjectId(object)).bounds } : {}),
                });
            }
        }
        for (const child of object.children ?? []) walk(child);
    };
    walk(root);

    if (sortBy !== undefined)
    {
        // 排序键从对象上现取：matched 里只带按需返回的字段，position 未必在里面
        const keyOf = (item: Record<string, unknown>): number | string =>
        {
            const object = resolveObjectId(String(item.id));
            if (sortBy === 'name') return object.name ?? '';
            const value = readFieldPath(object, sortBy);

            return typeof value === 'number' ? value : 0;
        };
        const decorated = matched.map((item) => ({ item, key: keyOf(item) }));
        decorated.sort((a, b) =>
        {
            const result = typeof a.key === 'string' || typeof b.key === 'string'
                ? String(a.key).localeCompare(String(b.key))
                : Number(a.key) - Number(b.key);

            return order === 'desc' ? -result : result;
        });
        matched.length = 0;
        for (const entry of decorated) matched.push(entry.item);
    }

    return {
        count: matched.length,
        total: totalHits,
        // 截断了就明说：AI 只看到 count 时，会把"还有 30 个没返回"当成"一共就这些"
        ...(totalHits > matched.length ? { truncated: true, hint: `命中 ${totalHits} 个，只返回前 ${matched.length} 个（可用 limit 调整）` } : {}),
        limit,
        matched,
    };
}
