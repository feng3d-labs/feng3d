import { resolveObjectId } from '../EditorBridge';
import { cloneValue, writeValue } from './writeCore';
import { assertAssignableType, assertFiniteNumbers, deleteField, isFiniteF32, primitiveTypeOf, resolvePath } from './writePure';
import type { FieldTypeFix } from './writePure';

/** 一次字段写入的准备结果（校验已通过，尚未落笔） */
export interface SetOutcome
{
    readonly objectId: string;
    readonly path: string;
    readonly holder: object;
    readonly key: string | number;
    readonly hadKey: boolean;
    readonly before: unknown;
    readonly after: unknown;
    /** 本次写入是不是一次"字段类型修正"（`force: true` 放行的对象 ↔ 原始值互转） */
    readonly typeFix: FieldTypeFix | null;
}

/**
 * 校验并准备好要写入的值（**不落笔**）。
 *
 * 拆出这一步是为了批量写入的原子性：先把所有目标校验通过，再统一落笔，
 * 避免"改到第 3 个对象才发现路径是错的"而留下半成品。
 *
 * @param objectId 目标对象路径式 id
 * @param path 字段路径
 * @param value 要写入的值
 * @param create 字段不存在时是否允许新增
 * @param force 是否放行"对象 ↔ 原始值"的互转（修正已损坏字段类型用，见 issue #186）
 */
export function prepareSet(objectId: string, path: string, value: unknown, create: boolean, force = false): SetOutcome
{
    const object = resolveObjectId(objectId);
    const { holder, key } = resolvePath(object, path);
    const hadKey = Object.prototype.hasOwnProperty.call(holder, key);
    const before = cloneValue((holder as Record<string | number, unknown>)[key]);

    // 防呆一：字段不存在多半是路径拼错（`postion.y` 之类）。静默新增字段会让"改完了"
    // 变成假象——画面毫无变化，AI 却以为成功，接下来基于错误前提继续操作。
    if (!hadKey && !create)
    {
        const available = Object.keys(holder as object).slice(0, 30).join(', ');

        throw new Error(
            `${path} 在目标对象上不存在（字段名可能拼错）。可用字段：${available}。`
            + '确实要新增字段请传 create: true。',
        );
    }

    // 防呆一之补：`null` 与 `undefined` 一律拒绝。
    // `primitiveTypeOf(null)` / `primitiveTypeOf(undefined)` 都返回 null，会让下面的类型比对
    // 整段跳过——实测 `scene.set { path: "position.y", value: null }` 曾被接受，写进变换后
    // 矩阵变 NaN、对象从画面消失。"清空字段"不是桥接应有的语义：要零值就显式写零值
    if (value === null || value === undefined)
    {
        throw new Error(
            `${path} 不能写入 ${value === null ? 'null' : 'undefined'}：变换与 uniform 里的空值会让矩阵变 NaN。`
            + '要清零请显式写零值（0 / "" / false）',
        );
    }

    // 防呆二：原始类型不匹配（把 number 写成 "0.5" 这种字符串）几乎总是错误
    const beforeType = primitiveTypeOf(before);
    const afterType = primitiveTypeOf(value);
    if (beforeType !== null && afterType !== null && beforeType !== afterType)
    {
        throw new Error(`${path} 是 ${beforeType}，传入的却是 ${afterType}：${JSON.stringify(value)}`);
    }

    // 数字必须是有限值：NaN / Infinity 一旦写进变换或 uniform，渲染就会出问题
    // （实测把 NaN 写进 u_glossiness 后页面直接栈溢出）；f32 溢出（如 1e39）同样在 GPU 侧变 Infinity
    if (afterType === 'number' && !isFiniteF32(value as number))
    {
        throw new Error(`${path} 需要有限数字（且不超出 f32 范围），收到：${String(value)}`);
    }

    // 防呆三：对象与原始类型之间也不能互转——把 position 写成字符串会让渲染直接崩掉。
    // 只在字段已存在时判断：新增字段（create: true）本来就没有"原类型"可依据。
    // `force: true` 是留给"修正已经坏掉的字段类型"的显式出口（issue #186），
    // 放行时把这次类型修正如实记下来，随返回值报出去
    const typeFix = hadKey ? assertAssignableType(path, before, value, force) : null;

    // 防呆四：对象/数组里不能藏非法数字——`position: { x: 1e39 }` 会绕过上面的单值检查，
    // 而变换里的 Infinity 会让整个矩阵变 NaN（对象跟着消失，且看不出是谁干的）
    const afterIsObject = value !== null && typeof value === 'object';
    if (afterIsObject) assertFiniteNumbers(value, path);

    return { objectId, path, holder, key, hadKey, before, after: cloneValue(value), typeFix };
}

/** 落笔（写入准备阶段算好的值） */
export function commitSet(outcome: SetOutcome): void
{
    writeValue(outcome.holder, outcome.key, cloneValue(outcome.after));
}

/** 还原到写入前 */
export function revertSet(outcome: SetOutcome): void
{
    if (outcome.hadKey)
    {
        writeValue(outcome.holder, outcome.key, cloneValue(outcome.before));

        return;
    }

    // 字段原本不存在 → 撤销就是"删掉它"。必须经响应式代理（`deleteField`）：
    // 裸 `delete` 绕过 `reactive()`，引擎侧依赖该字段的 computed 不会失效，
    // 表现是"数据已恢复、画面与派生读数停在旧状态"（issue #138）
    deleteField(outcome.holder, outcome.key);
}

/**
 * 统一落笔：中途失败时逆序还原已落笔的部分。
 *
 * `prepareSet` 保证的是"校验阶段原子"（全部校验通过才开始落笔），但**落笔本身也可能失败**
 * （目标字段被冻结、父级已被其它命令改动等）。少了这一步就会留下"改了一半、撤销栈里只有
 * 一半记录"的半成品，而错误信息还写着"已回滚"。
 *
 * @param outcomes 已通过校验的写入准备结果
 */
export function commitAll(outcomes: readonly SetOutcome[]): void
{
    const done: SetOutcome[] = [];
    try
    {
        for (const outcome of outcomes)
        {
            commitSet(outcome);
            done.push(outcome);
        }
    }
    catch (error)
    {
        for (const outcome of [...done].reverse()) revertSet(outcome);
        throw error;
    }
}
