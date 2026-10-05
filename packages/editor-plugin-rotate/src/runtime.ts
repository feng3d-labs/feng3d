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
 * 旋转的运行期行为（issue #674 工厂范式）。
 *
 * 与界面端共享同一份 {@link Rotate} 数据（见 `./shared`）——**同一个 `__type__`，两端都有行为**，
 * 这就是"编辑格式 = 运行格式"的最小可验证形态。
 *
 * 形态：**工厂闭包直接返回对象字面量**——无共享原型、无 this、无 `_` 前缀状态字段；
 * 创建入口是 {@link rotateLogic} 工厂，`registerLogic` 只接受工厂函数（issue #653）。
 * 编辑器侧同理由 `LogicFactoryRef` 描述（见 `packages/editor/src/plugins/types.ts`）。
 */
export interface RotateLogic
{
    /** 当前累计角度（度） */
    readonly angle: number;

    /**
     * 推进一帧。
     *
     * @param interval 距上一帧的秒数
     * @returns 推进后的累计角度（度）
     */
    update(interval: number): number;
}

/**
 * 工厂函数：RotateLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * 工厂闭包直接返回对象字面量：累计角度是闭包内 `let` 状态，getter 与 update 读写同一变量。
 *
 * @param data 纯数据 Rotate（raw）
 */
export function rotateLogic(data: Rotate): RotateLogic
{
    let angle = 0;

    const logic: RotateLogic = {
        get angle() { return angle; },
        update(interval)
        {
            angle += (data.speed ?? 0) * interval;

            return angle;
        },
    };

    return logic;
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
    registerLogic(ROTATE_TYPE, rotateLogic);

    return { type: ROTATE_TYPE };
}