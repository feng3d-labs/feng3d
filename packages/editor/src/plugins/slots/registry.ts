import { Service } from '@deepseek-ai/cordis';
import type { Context } from '@deepseek-ai/cordis';
import type { SlotEntry, SlotEntryDraft, SlotKind, SlotMap, SlotName, SlotSnapshot } from './types';

/**
 * 插槽注册表（#276 S1）。
 *
 * ## 它是什么、不是什么
 *
 * **是**：DSH `SlotCore` + `SlotRegistry` 里与编辑器有关的那一半的等价物——
 * 座位声明（declaring is claiming）、注册语义（`single` / `list`）、加载期校验、
 * **卸载级联**（经调用方 cordis context 的 `ctx.effect`）、`slots/changed` 式变更订阅、JSON 安全快照。
 *
 * **不是**：渲染器。谁渲染座位、怎么把 `value` 变成组件，是渲染方的事（S2 接
 * `MainLayout.vue` / `SceneView.vue`）。DSH 也是这么切的：`SlotCore` 管语义，
 * 渲染器（`install()` / `renderSlot('root')`）单独一层。
 *
 * ## 与清单（`EditorPluginManifest`）的关系：投影，不是替代
 *
 * 层叠加（内置 < 插件 < 用户）、同层冲突拒绝、启用禁用、patch 覆盖**全部留在清单侧**
 * （DSH 的 slots 没有"层"的概念）。装载器把**归并后的赢家**注册进座位即可：
 *
 * ```
 * 清单（权威：五类贡献点 + 层 + 启用状态 + patch）
 *    │  pickByLayer / getEnabledPlugins（不变）
 *    ▼
 * 投影：ctx.effect(() => slots.register(ctx, 'panel.main', { id, order, value, source }))
 *    ▼
 * 本注册表（活应用）→ 渲染方读 entries(slot) 画界面
 * ```
 *
 * 详见 [PLUGIN_TRIPLE_HALF.md](../../../docs/PLUGIN_TRIPLE_HALF.md) §3.3–3.4。
 *
 * ## 与 DSH 的**一处有意差异**：`single` 座位的重复注册是错误
 *
 * DSH 的 `root` 是 `single`，第二个条目**遮蔽**已发布的那个（且动态注册者优先级更低因而"赢"），
 * 结果是"页面只剩你的组件"。编辑器不采用这条：本仓已确立"**同层冲突直接拒绝、报错点名双方**"
 * （`registry.ts` 的 `findSameLayerConflicts`、`pluginInstall.spec.ts` 的
 * 「重复的类型名在注册时被拒绝（后注册静默顶掉先注册更难查）」），
 * 而层归并已经在清单侧做完了——插槽层再出现重复就是 bug，不是配置。**显式报错优于静默遮蔽。**
 */

/**
 * 核心内置座位的**运行期座位表**。
 *
 * 类型面在 {@link SlotMap}（模块增强），运行期要 `kind` 才能做 `single` / `list` 校验，
 * 于是有了这张表。两处**由编译器双向锁住**：类型写成 `Record<SlotName, …>`，
 * 少一个键编译不过、多一个键触发字面量的多余属性检查——不会漂移（这条是 S1 的落地要点）。
 */
export const SLOT_KINDS: Readonly<Record<SlotName, SlotMap[SlotName]['kind']>> = {
    'app.root': 'single',
    'panel.hierarchy': 'list',
    'panel.main': 'list',
    'panel.project': 'list',
    'panel.bottom': 'list',
    'scene.overlay': 'list',
};

/** 等待座位被声明的记录（{@link SlotRegistry.inject} 用） */
interface SlotWaiter
{
    /** 调用方 context（它的 fiber 卸载时，等待与已装的 effect 一起回收） */
    readonly ctx: Context;

    /** 座位出现时要装的装配函数 */
    readonly callback: () => void | (() => void);

    /** 已激活时：单独释放该 effect 的函数（未激活为 `null`） */
    releaseEffect: (() => void) | null;
}

/** 一条已注册的占用（含它的释放函数） */
interface SlotHolder
{
    /** 占用 */
    readonly entry: SlotEntry;

    /** 释放它（`ctx.effect` 返回的幂等 Disposable）；装配时才拿得到，故可写 */
    release: () => void;
}

/** 座位声明记录（带引用计数：重复声明是幂等的） */
interface Declaration
{
    /** 容纳方式 */
    readonly kind: SlotKind;

    /** 引用计数（归零才真正取消声明） */
    refs: number;
}

/** 变更订阅者 */
type SlotListener = (slot: SlotName) => void;

/**
 * 座位与占用的注册表（活应用）——**cordis 服务 `slots`**（#276 阶段 2）。
 *
 * ## 两条与 cordis 相关的硬约束（都是实测撞出来的，见 `packages/editor/spikes/cordis-service.mjs`）
 *
 * 1. **状态用 TS `private` 而不是 `#field`**：cordis 的服务代理会让 `this` 变成 Proxy
 *    （`ctx.slots` 与"先取到变量再调用"拿到的都是代理），而 JS 私有字段无法透过 Proxy 访问——
 *    实测 `TypeError: Cannot read private member #declared from an object whose class did not declare it`。
 *    这是本包唯一一处偏离根 `AGENTS.md` §3「私有状态用 #field」的地方，属**技术限制**。
 * 2. **`register` / `inject` 显式接收调用方 `ctx`**：DSH 靠服务代理隐式把 `this.ctx` 绑到调用方，
 *    但那与第 1 条互斥；显式传参同样能拿到"调用方 fiber 卸载 = 注册消失"（已实测），
 *    而且更好追"是谁注册的"。
 *
 * 公开方法一律是**原型方法**（不是箭头属性）：cordis 服务代理在调用时绑定 `this`，
 * 箭头属性会把 `this` 冻在构造时的 context 上。
 */
export class SlotRegistry extends Service
{
    /** 已声明的座位（`Map` 保持声明顺序），值带引用计数 */
    private declared = new Map<SlotName, Declaration>();

    /** 座位 → 占用（数组顺序即注册顺序） */
    private entriesBySlot = new Map<SlotName, SlotHolder[]>();

    /** 等座位声明的记录 */
    private waiting = new Map<SlotName, SlotWaiter[]>();

    /** 变更订阅者 */
    private listeners = new Set<SlotListener>();

    /** 批处理中被挂起的座位（`null` 表示不在批中） */
    private pending: Set<SlotName> | null = null;

    /**
     * 构造：注册为 cordis 服务 `slots`（`#276` 阶段 2 起，与 DSH 同一套 cordis）。
     *
     * @param ctx 所属 context（通常由 `new Context()` + 直接构造，或 `ctx.plugin(SlotRegistry)` 提供）
     */
    constructor(ctx: Context)
    {
        super(ctx, 'slots');
    }

    /**
     * 把一批操作合并成**一次**变更通知。
     *
     * 为什么必需：投影是"先撤后加"（见 `projection.ts`），期间会经过"座位上一个占用都没有"的中间态。
     * 逐个通知的话，渲染方会先看到空集合、再看到新集合——界面闪一下，甚至在某些渲染方那里
     * 因为"空标签区"而报错。批处理让它只看到最终态。
     *
     * 嵌套调用会并入外层批（只有最外层结束时才通知）。
     *
     * @param action 要批量执行的操作
     * @returns `action` 的返回值
     */
    batch<T>(action: () => T): T
    {
        if (this.pending) return action();

        const pending = new Set<SlotName>();
        this.pending = pending;

        try
        {
            return action();
        }
        finally
        {
            this.pending = null;
            for (const slot of pending) this.notifyNow(slot);
        }
    }

    /**
     * 声明一个座位：**声明即认领**——声明方就是渲染它的那一方。
     *
     * 重复声明是**幂等**的（引用计数），因为"核心组件重复初始化"在本仓是常态
     * （见 `registerPlugins` 同 id 跳过、`setPluginEnabled` 状态没变时不动全局表）。
     *
     * @param slot 座位名（`SlotMap` 的键）
     * @param kind 容纳方式；省略时取核心内置座位表 {@link SLOT_KINDS}
     * @returns 取消声明（引用计数归零时才真正取消：撤掉座位上的占用、并让等待者重新等）
     * @throws 座位既不在 `SlotMap` 的类型表里、也没给 `kind` 时抛出
     */
    declare(slot: SlotName, kind?: SlotKind): () => void
    {
        // `SLOT_KINDS` 的类型说"每个 SlotName 都有 kind"，但插件用模块增强加的座位**可能只进了类型**
        // （没进这张运行期表）——所以这里按"可能查不到"处理，而不是相信类型
        const resolved: SlotKind | undefined = kind ?? (SLOT_KINDS[slot] as SlotKind | undefined);
        if (!resolved)
        {
            throw new Error(`座位 ${slot} 没有容纳方式：它不是核心内置座位，declare 时必须显式给 kind（'single' 或 'list'）`);
        }

        const existing = this.declared.get(slot);
        if (existing)
        {
            existing.refs++;
        }
        else
        {
            this.declared.set(slot, { kind: resolved, refs: 1 });
            // 座位刚出现：让等它的人（inject）装 effect
            this.activate(slot);
            this.notify(slot);
        }

        let collapsed = false;

        return () =>
        {
            if (collapsed) return;
            collapsed = true;

            const declaration = this.declared.get(slot);
            if (!declaration) return;
            declaration.refs--;
            if (declaration.refs > 0) return;

            this.declared.delete(slot);

            // 座位没了：等它装的 effect 先撤（等待记录保留——下次再声明会重装）
            for (const waiter of this.waiting.get(slot) ?? [])
            {
                waiter.releaseEffect?.();
                waiter.releaseEffect = null;
            }

            // 座位上的占用一起撤："座位不存在了，占用无处安放"
            // 遍历前先拷贝：`release()` 会 splice 同一个数组，边遍历边改会跳过元素
            for (const holder of [...(this.entriesBySlot.get(slot) ?? [])]) holder.release();
            this.entriesBySlot.delete(slot);

            this.notify(slot);
        };
    }

    /**
     * 在**调用方 context** 的生命周期内注册一条占用。
     *
     * 注册动作本身是 cordis 的 effect：`ctx` 所属 fiber 被卸载（插件卸载）时，这条占用自动消失——
     * 这就是 #276 验收①里"撤销后不再触发"在本层的落点。
     *
     * **为什么显式接收 `ctx` 而不是照 DSH 靠服务代理隐式绑 `this.ctx`**：代理会让 `this` 变成 Proxy，
     * 而 JS 私有字段无法透过 Proxy 访问（实测 `TypeError: Cannot read private member`）；
     * 显式传参既可预测，卸载级联也一样成立（`packages/editor/spikes/cordis-service.mjs` 有实测）。
     *
     * 幂等：同座位同 `id` 重复注册**不重复添加**，返回的是同一个释放函数
     * （开发期热替换、装载器重跑都不会叠加）。
     *
     * @param ctx 调用方 context（通常来自装载器或插件自己的 `ctx`）
     * @param slot 座位名
     * @param draft 占用内容
     * @returns 释放这条占用（幂等）
     * @throws 座位未声明、调用方 fiber 已释放、或往 `single` 座位注册第二个占用者时抛出
     */
    register<T>(ctx: Context, slot: SlotName, draft: SlotEntryDraft<T>): () => void
    {
        const kind = this.requireDeclared(slot, '注册');

        const list = this.entriesBySlot.get(slot) ?? [];
        const previous = list.find((holder) => holder.entry.id === draft.id);
        if (previous) return previous.release;

        if (kind === 'single' && list.length > 0)
        {
            const occupant = list[0].entry;

            throw new Error(`座位 ${slot} 是 single（一个座位一个占用者）：已被 ${occupant.source} 的 ${occupant.id} 占用——`
                + '要覆盖它请走清单的更高层（内置 < 插件 < 用户），不要在插槽层抢座位');
        }

        const entry: SlotEntry = {
            slot,
            id: draft.id,
            order: draft.order ?? 0,
            value: draft.value,
            source: draft.source,
        };

        /** 先占位再补 `release`：`ctx.effect` 会**同步**执行装配，而装配里会 push 这个对象 */
        const holder: SlotHolder = { entry, release: () => { /* 由下面替换 */ } };

        const release = this.effectOf(ctx, `往座位 ${slot} 注册`, () =>
        {
            list.push(holder);
            this.entriesBySlot.set(slot, list);
            this.notify(slot);

            return () =>
            {
                const current = this.entriesBySlot.get(slot);
                if (current)
                {
                    const index = current.indexOf(holder);
                    if (index >= 0) current.splice(index, 1);
                    if (current.length === 0) this.entriesBySlot.delete(slot);
                }
                this.notify(slot);
            };
        });

        // 释放函数要能被 `entries()` 的消费者与 collapse 拿到，所以放进 holder
        holder.release = release;

        return release;
    }

    /**
     * 等座位**被声明**之后，在调用方 context 的生命周期内装一个 effect。
     *
     * 语义照 DSH 的 `SlotRegistry.inject(key, callback)`：
     * - 座位已声明 → **立即同步**装配；
     * - 未声明 → 排队等；声明提交后装配；
     * - 座位被取消声明 → 撤掉 effect（**等待记录保留**，下次再声明会重装）；
     * - 调用方 fiber 被卸载 → 取消等待 + 移除已装的贡献（"controller 属于调用方 fiber"）。
     *
     * @param ctx 调用方 context
     * @param slot 要等的座位名
     * @param callback 座位出现时执行的装配函数（可返回清理函数）
     * @returns 取消等待并撤掉已装 effect（幂等）
     * @throws 调用方 fiber 已释放时抛出
     */
    inject(ctx: Context, slot: SlotName, callback: () => void | (() => void)): () => void
    {
        const waiter: SlotWaiter = { ctx, callback, releaseEffect: null };
        const list = this.waiting.get(slot) ?? [];
        list.push(waiter);
        this.waiting.set(slot, list);

        // 等待本身也是一个 effect：调用方 fiber 卸载 = 取消等待（不留悬挂回调）
        const cancelWait = this.effectOf(ctx, `等座位 ${slot}`, () => () => this.dropWaiter(slot, waiter));

        if (this.declared.has(slot)) this.activate(slot);

        let released = false;

        return () =>
        {
            if (released) return;
            released = true;
            cancelWait();
            waiter.releaseEffect?.();
            waiter.releaseEffect = null;
        };
    }

    /**
     * 某个座位上的占用（**已按生效顺序排序**：`order` 小的在前，相同则按注册顺序）。
     *
     * @param slot 座位名
     * @returns 占用列表（座位未声明或没有占用时为空数组）
     */
    entries(slot: SlotName): readonly SlotEntry[]
    {
        const list = this.entriesBySlot.get(slot) ?? [];

        return list
            .map((holder, index) => ({ holder, index }))
            .sort((a, b) => (a.holder.entry.order - b.holder.entry.order) || (a.index - b.index))
            .map((item) => item.holder.entry);
    }

    /** 已声明的座位（按声明顺序） */
    declaredSlots(): readonly SlotName[]
    {
        return [...this.declared.keys()];
    }

    /**
     * 订阅座位变更（对应 DSH 的 `slots/changed` 事件桥）。
     *
     * 注册 / 注销 / 声明 / 取消声明都会通知；渲染方靠它重画（S2 起替代
     * `MainLayout.vue` 里手工 `rebuildTabs()` 那套）。
     *
     * @param listener 变更回调（入参是发生变化的座位）
     * @returns 取消订阅
     */
    onChanged(listener: SlotListener): () => void
    {
        this.listeners.add(listener);

        return () => { this.listeners.delete(listener); };
    }

    /**
     * 现状快照（**JSON 安全**：不含 `value`，只报结构与来源）。
     *
     * @returns 快照
     */
    snapshot(): SlotSnapshot
    {
        const entries: SlotSnapshot['entries'][number][] = [];

        for (const slot of this.declared.keys())
        {
            for (const entry of this.entries(slot))
            {
                entries.push({ slot: entry.slot, id: entry.id, order: entry.order, source: entry.source });
            }
        }

        return { declared: this.declaredSlots(), entries };
    }

    /**
     * 清空注册表（**只给单元测试**：注册表是实例状态，用例之间必须能互相隔离）。
     *
     * 不释放任何 effect——那是调用方 fiber 的事（`ctx.fiber.dispose()`，
     * 或者直接丢掉整个 root context）。
     */
    reset(): void
    {
        this.declared.clear();
        this.entriesBySlot.clear();
        this.waiting.clear();
        this.listeners.clear();
    }

    /**
     * 装配某个座位上所有等待者（座位刚被声明 / inject 时调用）。
     *
     * **一个等待者装配失败不能卡住整个座位**：回调是插件写的（可能自己撞上 `single` 冲突、
     * 或者干脆抛错），若让它冒泡出去，`declare` 会半途而废（座位留在表里、refs=1、没通知、
     * 调用方连 collapse 都拿不到），而且那条等待会一直留在队列里——之后每次 declare 都在这里重抛，
     * **排在其后的等待者一起被跳过**。所以这里逐条兜住：丢掉坏的、报出来、继续装其余的。
     *
     * @param slot 座位名
     */
    private activate(slot: SlotName): void
    {
        for (const waiter of [...(this.waiting.get(slot) ?? [])])
        {
            if (waiter.releaseEffect) continue;

            try
            {
                // 调用方 fiber 可能在等待期间被卸载：那时 `ctx.effect` 会抛（INACTIVE_EFFECT），
                // 由下面的兜错把这条等待丢掉——不预先判断 fiber 状态，避免依赖 cordis 内部字段
                waiter.releaseEffect = this.effectOf(waiter.ctx, `装配座位 ${slot}`, () => waiter.callback());
            }
            catch (error)
            {
                this.dropWaiter(slot, waiter);
                console.error(`[slots] 座位 ${slot} 上的一个等待者装配失败，已丢弃该等待（其余等待者继续装配）：`, error);
            }
        }
    }

    /**
     * 在调用方 context 上装一个 effect，并把 cordis 的失败原因包成可读的中文报错。
     *
     * cordis 在已释放的 fiber 上会抛 `INACTIVE_EFFECT`（`cannot create effect on inactive context`）；
     * 这里补上**是哪个操作**失败的上下文，便于定位"是谁在已经卸载之后还在注册"。
     *
     * @param ctx 调用方 context
     * @param what 正在做的事（报错里用）
     * @param setup 装配函数（可返回清理函数）
     * @returns 释放这个 effect 的幂等函数（cordis 的 Disposable）
     * @throws cordis 拒绝创建 effect 时抛出（附上 `what`）
     */
    private effectOf(ctx: Context, what: string, setup: () => void | (() => void)): () => void
    {
        try
        {
            // cordis 的 `effect` 要求 execute **返回一个 disposer**（`SyncEffect`），不接受 `void`；
            // 而本层的装配函数允许"没有清理"（返回空），所以在这一层补一个空清理函数收口
            return ctx.effect(() =>
            {
                const cleanup = setup();

                return typeof cleanup === 'function' ? cleanup : () => { /* 没有清理要做 */ };
            }) as unknown as () => void;
        }
        catch (error)
        {
            throw new Error(`${what}失败：${(error as { message?: string })?.message ?? String(error)}（调用方的 cordis fiber 可能已卸载）`);
        }
    }

    /**
     * 从等待队列里摘掉一条等待。
     *
     * @param slot 座位名
     * @param waiter 要摘掉的等待
     */
    private dropWaiter(slot: SlotName, waiter: SlotWaiter): void
    {
        const list = this.waiting.get(slot);
        if (!list) return;

        const index = list.indexOf(waiter);
        if (index >= 0) list.splice(index, 1);
        if (list.length === 0) this.waiting.delete(slot);
    }

    /**
     * 断言座位已声明，并返回它的容纳方式。
     *
     * @param slot 座位名
     * @param action 动作名（报错里用）
     * @returns 座位的容纳方式
     * @throws 未声明时抛出，并列出当前已声明的座位
     */
    private requireDeclared(slot: SlotName, action: string): SlotKind
    {
        const declaration = this.declared.get(slot);
        if (!declaration)
        {
            const available = this.declaredSlots();

            throw new Error(`座位 ${slot} 还没有被声明，不能${action}（declaring is claiming：座位由渲染它的那一方 declare）。`
                + `当前已声明：${available.length === 0 ? '（无）' : available.join('、')}`);
        }

        return declaration.kind;
    }

    /**
     * 通知变更订阅者（批处理中挂起，见 {@link SlotRegistry.batch}）。
     *
     * @param slot 发生变化的座位
     */
    private notify(slot: SlotName): void
    {
        if (this.pending)
        {
            this.pending.add(slot);

            return;
        }

        this.notifyNow(slot);
    }

    /**
     * 立刻通知变更订阅者。
     *
     * **逐个兜住**：一个订阅者抛错不该掐断其它订阅者，更不该把异常抛进 effect 的清理路径
     * （cordis 的 `fiber.dispose` 是逆序跑 disposer，中途抛错会让**后面的清理不跑**——那是更糟的后果）。
     * 报出来，继续通知。
     *
     * @param slot 发生变化的座位
     */
    private notifyNow(slot: SlotName): void
    {
        for (const listener of this.listeners)
        {
            try
            {
                listener(slot);
            }
            catch (error)
            {
                console.error(`[slots] 座位 ${slot} 的变更订阅者抛错（已跳过它，继续通知其余订阅者）：`, error);
            }
        }
    }
}
