import { isLogicRegistered } from 'feng3d';

/**
 * 判断一个「场景树子节点」是否损坏，返回原因（有效时返回 `null`）。
 *
 * ## 为什么要单独有这个判据
 *
 * `children` 里可能出现三类坏东西。它们既不会被导出、也不会被察觉，
 * 只会在某个路径真正去读它时炸开：
 *
 * - `undefined`：历史反序列化路径曾把 `undefined` push 进 `children`
 *   （`Hierarchy.collectTree` 的注释里记着这件事）；
 * - 没有 `__type__` 的对象：旧格式数据或损坏的场景文件（issue #140 的现场是
 *   `{"id":"/","types":[],"activeSelf":true,"childCount":0}`——没有 `name`、没有组件、
 *   也没有 `__type__`）；
 * - `__type__` 未注册的对象：类型名写错，或注册它的插件被关掉。
 *
 * 这类节点 `logic()` 返回 `null`，于是读它的链路要么静默跳过、要么抛
 * `Cannot read properties of null`；而 `scene.export` 会因为序列化把它丢掉，
 * 于是**导出看不到、体检原先也查不到**——只能靠"页面加载报错"或逐层展开层级树发现
 * （issue #140）。判据抽到这里，是为了让层级面板（跳过它）与桥接体检（报出它）
 * 用**同一把尺子**，而不是各自写一份。
 *
 * 返回原因而不是 `boolean`：报错信息要能照着修，得说清是"缺字段"还是"类型名没注册"。
 *
 * @param value `children` 数组里的一项
 * @returns 损坏原因；有效时返回 `null`
 */
export function describeInvalidSceneObject(value: unknown): string | null
{
    if (value === null) return '是 null';
    if (value === undefined) return '是 undefined';
    if (typeof value !== 'object') return `不是对象（是 ${typeof value}）`;

    const declaredType = (value as { __type__?: unknown }).__type__;
    if (typeof declaredType !== 'string')
    {
        const keys = Object.keys(value as object);

        return `缺少 __type__（该对象的键：${keys.length > 0 ? keys.join(', ') : '(空对象)'}）`;
    }
    if (!isLogicRegistered(declaredType)) return `__type__ '${declaredType}' 没有注册`;

    return null;
}

/**
 * 判断渲染字段（`geometry` / `material`）是不是**引擎认得的纯数据**，返回原因（可用时返回 `null`）。
 *
 * 与 {@link describeInvalidSceneObject} 有一处刻意的区别：渲染字段**允许旧格式**
 * （没有 `__type__` 但有已注册的 `__class__`）——引擎侧 `RenderableLogic.#resolveDeclared`
 * 会就地兼容它；对象树节点则没有这层兼容（`Object3DLogic` 只认 `__type__`）。
 *
 * 这条判据同时供两侧使用，避免"写时拦一套、体检报另一套"：
 * - 写时：`assertDeclaredRenderableField`（`scene.add` 的 `components` 直传）据此拒绝；
 * - 体检：`scene.validate` 据此报 `invalid-field`。
 *
 * @param value 字段值
 * @returns 不可用的原因；可用时返回 `null`
 */
export function describeInvalidRenderField(value: unknown): string | null
{
    if (value === null || value === undefined) return '是空值';

    if (typeof value !== 'object')
    {
        // 到了这里多半是"展示文本被写回数据"（issue #184）：属性的文本框把对象显示成
        // `" (Object)"`，一失焦就把这串字写进了字段
        return `需要是纯数据对象（如 { __type__: 'CubeGeometry' }），收到：${JSON.stringify(value)}`;
    }

    const declared = value as { readonly __type__?: unknown, readonly __class__?: unknown };
    const declaredType = typeof declared.__type__ === 'string' ? declared.__type__
        : typeof declared.__class__ === 'string' ? declared.__class__ : undefined;
    if (declaredType !== undefined && isLogicRegistered(declaredType)) return null;

    const keys = Object.keys(value as object);
    const keysText = keys.length > 0 ? keys.join(', ') : '(空对象)';

    return declaredType === undefined
        ? `缺少 __type__（该对象的键：${keysText}）`
        : `__type__ '${declaredType}' 没有注册`;
}

/**
 * 字段是否是 `{ x, y, z }` 形式的向量（三个数字分量）。
 *
 * `position` / `rotation` / `scale` 都是这种形态。判据要判**能不能用**而不是**有没有值**：
 * 被写成字符串的 `position`（如 `" (Object)"`）是 truthy 的，逐分量读写才抛
 * `Cannot create property 'x' on string`（用户报的现场，issue #184）。
 *
 * @param value 字段值
 */
export function isVector3Like(value: unknown): boolean
{
    if (value === null || typeof value !== 'object') return false;

    const vector = value as { x?: unknown, y?: unknown, z?: unknown };

    return typeof vector.x === 'number' && typeof vector.y === 'number' && typeof vector.z === 'number';
}

/**
 * 从子节点数组里滤出有效对象，并对每个无效项回调一次。
 *
 * 抽成独立函数是为了**可单测**：层级面板（`Hierarchy.collectTree`）与桥接体检
 * （`scene.validate`）都按同一份判据处理 `children`，但两者都缠着 DOM / 编辑器状态，
 * 直接单测成本很高；把"滤 + 报"这一步拿出来，逻辑本身就能被测试固定住。
 *
 * @param children 子节点数组（可以是响应式代理数组——读取会正常建立依赖）
 * @param onInvalid 每遇到一个无效子节点调用一次，参数是该项与其损坏原因
 * @returns 有效子节点（顺序不变）
 */
export function filterValidSceneObjects<T>(
    children: readonly unknown[],
    onInvalid: (child: unknown, reason: string) => void,
): T[]
{
    const valid: T[] = [];
    for (const child of children)
    {
        const reason = describeInvalidSceneObject(child);
        if (reason)
        {
            onInvalid(child, reason);

            continue;
        }
        valid.push(child as T);
    }

    return valid;
}
