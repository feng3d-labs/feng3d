import { registerLogic } from '@feng3d/reactivity';
import { ROTATE_TYPE } from './shared';
import type { Rotate } from './shared';

/**
 * 游戏项目端（runtime 半）—— 包入口 `"./runtime"`。
 *
 * ## 这一端的铁律
 *
 * **只能依赖引擎 API**（`@feng3d/reactivity` / `feng3d`），不得 import 编辑器 API、Vue、Element Plus，
 * 也不得用相对路径穿越回 `packages/editor/**`——这一端会被**打进游戏产物**，
 * 拖进编辑器依赖等于把编辑器塞进游戏。边界由 `scripts/check-runtime-half-deps.mjs` 守着
 * （它递归本入口的 import 闭包判定）。
 *
 * ## 为什么注册要显式调用（不在模块顶层）
 *
 * 产物要能 tree-shake，且根 AGENTS.md §3 的 R2「零模块级副作用」对 runtime 端同样成立
 * （模块 import 时不得执行注册）。所以这里导出 {@link installRotateRuntime}，
 * 由产物的入口**显式**调用——"注册了什么"永远是一句看得见的调用。
 */

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        /** 给 `logic()` 提供精确返回类型（`__type__: 'Rotate'`） */
        Rotate: RotateLogic;
    }
}

/**
 * 旋转的运行期行为。
 *
 * 与界面端共享同一份 {@link Rotate} 数据（见 `./shared`）——**同一个 `__type__`，两端都有行为**，
 * 这就是"编辑格式 = 运行格式"的最小可验证形态。
 *
 * 构造函数是 `protected`（对齐根 AGENTS.md §3：只有 `logic()` 能创建 Logic），
 * 因此 {@link installRotateRuntime} 里注册时要过一次断言——与编辑器侧同一套理由
 * （见 `packages/editor/src/plugins/types.ts` 的 `LogicClassRef` 说明）。
 */
export class RotateLogic
{
    #data: Rotate;

    #angle = 0;

    protected constructor(data: Rotate)
    {
        this.#data = data;
    }

    /** 当前累计角度（度） */
    get angle(): number
    {
        return this.#angle;
    }

    /**
     * 推进一帧。
     *
     * @param interval 距上一帧的秒数
     * @returns 推进后的累计角度（度）
     */
    update(interval: number): number
    {
        this.#angle += (this.#data.speed ?? 0) * interval;

        return this.#angle;
    }
}

/**
 * 装载 runtime 半：把本插件引入的 `__type__` 注册到引擎的 Logic 分发表。
 *
 * 幂等：同一 `__type__` 重复注册只是覆盖同一个工厂（引擎侧就是 `Map.set`）。
 *
 * @returns 本次注册的 `__type__`（产物入口日志用）
 */
export function installRotateRuntime(): { readonly type: string }
{
    registerLogic(ROTATE_TYPE, RotateLogic as unknown as new (data: { readonly __type__: 'Rotate' }) => RotateLogic);

    return { type: ROTATE_TYPE };
}
