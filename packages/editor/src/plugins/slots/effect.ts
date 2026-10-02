/**
 * 插槽用的 **effect 宿主**抽象（#276 S1）。
 *
 * ## 为什么需要它
 *
 * DSH 的插槽注册**必须经调用方 `ctx.effect`**：注册与声明注入都挂在调用方的 cordis fiber 上，
 * 于是"插件卸载"＝回收 fiber＝注册**以及插件自己装的监听 / 定时器**一起消失
 * （机制见 [PLUGIN_TRIPLE_HALF.md](../../../docs/PLUGIN_TRIPLE_HALF.md) §3.2 / §3.4）。
 *
 * 编辑器现在还没有 cordis（宿主在 #272/#273，接线在 S4），但**没有这层抽象就测不了"注册能不能被撤销"**
 * ——而那正是 #276 验收①要的东西（现状 `revertPluginContributions` 只覆盖 Logic 一类，
 * 定时器 / 监听 / 快捷键没有撤销通道）。
 *
 * 所以这里落一个**与 `Fiber.effect` / `Fiber.dispose` 同语义的最小实现**：
 *
 * | 本抽象 | cordis 对应 |
 * |---|---|
 * | `host.effect(setup)` | `ctx.effect(setup)` |
 * | `host.dispose()` | `fiber.dispose()` |
 * | `host.disposed` | fiber 的终态 |
 *
 * **S4 换成真实 fiber**：`createEffectHost()` 的调用点收敛在装载器一处（见决策稿 §3.7 的 S4），
 * 语义由本文件的用例与 `packages/editor/spikes/cordis-dispose.mjs` 共同守住
 * （后者在真 cordis 上验过同一件事：撤销后定时器停、监听不再触发）。
 */

/**
 * effect 宿主：能装 effect、能被释放。
 *
 * 实现方（S1 的 {@link EffectScope} 或 S4 的 cordis fiber 适配层）负责保证两条：
 * 1. `setup` 里注册的东西在**释放**时被清理（`setup` 返回的清理函数被调用）；
 * 2. 释放**幂等**，且释放后再装 effect 会**报错**（静默吞掉会让调用方以为装上了）。
 */
export interface EffectHost
{
    /**
     * 装一个 effect：`setup` 立即执行，它返回的函数在该 effect 被释放时调用。
     *
     * @param setup 立即执行的装配函数；可返回清理函数
     * @returns 单独释放这一个 effect 的函数（幂等）
     * @throws 宿主已释放时抛出——不能让调用方以为装上了
     */
    effect(setup: () => void | (() => void)): () => void;

    /**
     * 释放本宿主以及挂在它上面的**全部** effect（授权顺序为后进先出）。
     *
     * 幂等：重复调用无副作用（这正是"卸载一个插件"与"卸载流程被触发两次"能共存的原因）。
     */
    dispose(): void;

    /** 是否已释放 */
    readonly disposed: boolean;
}

/**
 * S1 的 effect 宿主实现（纯 TS，无 cordis 依赖）。
 *
 * 语义对齐 cordis 的 fiber：
 * - `effect()` 立即执行 `setup`，把它的清理函数压栈；
 * - `dispose()` 逆序调用全部清理函数，并标记终态；
 * - 单独释放（`effect()` 的返回值）从栈里摘掉自己再清理——**幂等**，重复调用不会跑两次清理。
 *
 * @returns 新的 effect 宿主
 */
export function createEffectHost(): EffectHost
{
    return new EffectScope();
}

/** {@link createEffectHost} 的实现（用类而不是闭包：将来要被 cordis Service 代理绑 `this`） */
export class EffectScope implements EffectHost
{
    /** 清理栈（后进先出）；`null` 表示还没装过任何 effect（lazy，避免无谓分配） */
    #cleanups: (() => void)[] | null = null;

    /** 是否已释放 */
    #disposed = false;

    /** @inheritdoc */
    get disposed(): boolean
    {
        return this.#disposed;
    }

    /**
     * @inheritdoc
     *
     * 刻意是**原型方法**（不是箭头函数属性）：S4 换成 cordis 的 `Service` 之后，
     * 代理要靠调用时的 `this` 绑定把 effect 记到**调用方**的 fiber 上——写成箭头属性会把 `this`
     * 冻在服务自己的 root ctx 上，从而**静默**破坏 per-plugin 卸载
     * （DSH 在 `dsh-client-ui-renderer/lib/types/client/registry.d.ts:79-84` 记着这一条）。
     */
    effect(setup: () => void | (() => void)): () => void
    {
        if (this.#disposed) throw new Error('effect 宿主已释放：不能再装 effect（装配方应先检查 disposed，或把装配放进所属 owner 的 effect 里）');

        const cleanup = setup();
        const run = typeof cleanup === 'function' ? cleanup : null;
        let done = false;

        /**
         * 只跑一次的清理。
         */
        const once = (): void =>
        {
            if (done) return;
            done = true;
            run?.();
        };

        this.#cleanups ??= [];
        this.#cleanups.push(once);

        return () =>
        {
            const stack = this.#cleanups;
            if (stack)
            {
                const index = stack.indexOf(once);
                if (index >= 0) stack.splice(index, 1);
            }
            once();
        };
    }

    /**
     * @inheritdoc
     *
     * 逆序调用清理函数：后装的先拆（与装配顺序相反，避免"拆父再拆子"这类顺序问题）。
     */
    dispose(): void
    {
        if (this.#disposed) return;
        this.#disposed = true;

        const stack = this.#cleanups;
        this.#cleanups = null;
        if (!stack) return;

        for (let i = stack.length - 1; i >= 0; i--) stack[i]();
    }
}
