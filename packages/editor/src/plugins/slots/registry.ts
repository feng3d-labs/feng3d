import type { EffectHost } from './effect';
import type { SlotEntry, SlotEntryDraft, SlotKind, SlotMap, SlotName, SlotSnapshot } from './types';

/**
 * 插槽注册表（#276 S1）。
 *
 * ## 它是什么、不是什么
 *
 * **是**：DSH `SlotCore` + `SlotRegistry` 里与编辑器有关的那一半的等价物——
 * 座位声明（declaring is claiming）、注册语义（`single` / `list`）、加载期校验、
 * **卸载级联**（经调用方的 {@link EffectHost}）、`slots/changed` 式变更订阅、JSON 安全快照。
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
 * 投影：host.effect(() => slots.register(host, 'panel.main', { id, order, value, source }))
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
    /** 调用方宿主 */
    readonly host: EffectHost;

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

    /** 释放它（`host.effect` 返回的幂等函数）；装配时才拿得到，故可写 */
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
 * 座位与占用的注册表（活应用）。
 *
 * 刻意**不是模块级单例**（R2）：核心在启动时显式创建一个实例并交给渲染方
 * （S4 之后它成为 cordis 的 `Service`）。所有公开方法都是**原型方法**——
 * S4 接 cordis 时代理要靠调用时的 `this` 绑定把 effect 记到调用方 fiber 上，
 * 写成箭头属性会静默破坏 per-plugin 卸载。
 */
export class SlotRegistry
{
    /** 已声明的座位（`Map` 保持声明顺序），值带引用计数 */
    #declared = new Map<SlotName, Declaration>();

    /** 座位 → 占用（数组顺序即注册顺序） */
    #entries = new Map<SlotName, SlotHolder[]>();

    /** 等座位声明的记录 */
    #waiting = new Map<SlotName, SlotWaiter[]>();

    /** 变更订阅者 */
    #listeners = new Set<SlotListener>();

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

        const existing = this.#declared.get(slot);
        if (existing)
        {
            existing.refs++;
        }
        else
        {
            this.#declared.set(slot, { kind: resolved, refs: 1 });
            // 座位刚出现：让等它的人（inject）装 effect
            this.#activate(slot);
            this.#notify(slot);
        }

        let collapsed = false;

        return () =>
        {
            if (collapsed) return;
            collapsed = true;

            const declaration = this.#declared.get(slot);
            if (!declaration) return;
            declaration.refs--;
            if (declaration.refs > 0) return;

            this.#declared.delete(slot);

            // 座位没了：等它装的 effect 先撤（等待记录保留——下次再声明会重装）
            for (const waiter of this.#waiting.get(slot) ?? [])
            {
                waiter.releaseEffect?.();
                waiter.releaseEffect = null;
            }

            // 座位上的占用一起撤："座位不存在了，占用无处安放"
            // 遍历前先拷贝：`release()` 会 splice 同一个数组，边遍历边改会跳过元素
            for (const holder of [...(this.#entries.get(slot) ?? [])]) holder.release();
            this.#entries.delete(slot);

            this.#notify(slot);
        };
    }

    /**
     * 在**调用方宿主**的生命周期内注册一条占用。
     *
     * 注册动作本身是 effect：`host` 被释放（插件卸载）时，这条占用自动消失——
     * 这就是 #276 验收①里"撤销后不再触发"在本层的落点。
     *
     * 幂等：同座位同 `id` 重复注册**不重复添加**，返回的是同一个释放函数
     * （开发期热替换、装载器重跑都不会叠加）。
     *
     * @param host 调用方宿主（S4 之后是调用方的 cordis fiber）
     * @param slot 座位名
     * @param draft 占用内容
     * @returns 释放这条占用（幂等）
     * @throws 座位未声明、宿主已释放、或往 `single` 座位注册第二个占用者时抛出
     */
    register<T>(host: EffectHost, slot: SlotName, draft: SlotEntryDraft<T>): () => void
    {
        const kind = this.#requireDeclared(slot, '注册');
        if (host.disposed) throw new Error(`effect 宿主已释放：不能再往座位 ${slot} 注册（装配应先检查 disposed）`);

        const list = this.#entries.get(slot) ?? [];
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

        /** 先占位再补 `release`：`host.effect` 会**同步**执行装配，而装配里会 push 这个对象 */
        const holder: SlotHolder = { entry, release: () => { /* 由下面替换 */ } };

        const release = host.effect(() =>
        {
            list.push(holder);
            this.#entries.set(slot, list);
            this.#notify(slot);

            return () =>
            {
                const current = this.#entries.get(slot);
                if (current)
                {
                    const index = current.indexOf(holder);
                    if (index >= 0) current.splice(index, 1);
                    if (current.length === 0) this.#entries.delete(slot);
                }
                this.#notify(slot);
            };
        });

        // 释放函数要能被 `entries()` 的消费者与 collapse 拿到，所以放进 holder
        holder.release = release;

        return release;
    }

    /**
     * 等座位**被声明**之后，在调用方宿主的生命周期内装一个 effect。
     *
     * 语义照 DSH 的 `SlotRegistry.inject(key, callback)`：
     * - 座位已声明 → **立即同步**装配；
     * - 未声明 → 排队等；声明提交后装配；
     * - 座位被取消声明 → 撤掉 effect（**等待记录保留**，下次再声明会重装）；
     * - 宿主被释放 → 取消等待 + 移除已装的贡献（"controller 属于调用方 fiber"）。
     *
     * @param host 调用方宿主
     * @param slot 要等的座位名
     * @param callback 座位出现时执行的装配函数（可返回清理函数）
     * @returns 取消等待并撤掉已装 effect（幂等）
     * @throws 宿主已释放时抛出
     */
    inject(host: EffectHost, slot: SlotName, callback: () => void | (() => void)): () => void
    {
        if (host.disposed) throw new Error(`effect 宿主已释放：不能再等座位 ${slot}（装配应先检查 disposed）`);

        const waiter: SlotWaiter = { host, callback, releaseEffect: null };
        const list = this.#waiting.get(slot) ?? [];
        list.push(waiter);
        this.#waiting.set(slot, list);

        // 等待本身也是一个 effect：宿主释放 = 取消等待（不留悬挂回调）
        const cancelWait = host.effect(() => () =>
        {
            const current = this.#waiting.get(slot);
            if (!current) return;
            const index = current.indexOf(waiter);
            if (index >= 0) current.splice(index, 1);
            if (current.length === 0) this.#waiting.delete(slot);
        });

        if (this.#declared.has(slot)) this.#activate(slot);

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
        const list = this.#entries.get(slot) ?? [];

        return list
            .map((holder, index) => ({ holder, index }))
            .sort((a, b) => (a.holder.entry.order - b.holder.entry.order) || (a.index - b.index))
            .map((item) => item.holder.entry);
    }

    /** 已声明的座位（按声明顺序） */
    declaredSlots(): readonly SlotName[]
    {
        return [...this.#declared.keys()];
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
        this.#listeners.add(listener);

        return () => { this.#listeners.delete(listener); };
    }

    /**
     * 现状快照（**JSON 安全**：不含 `value`，只报结构与来源）。
     *
     * @returns 快照
     */
    snapshot(): SlotSnapshot
    {
        const entries: SlotSnapshot['entries'][number][] = [];

        for (const slot of this.#declared.keys())
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
     * 不释放任何 effect 宿主——那是调用方的事（`host.dispose()`）。
     */
    reset(): void
    {
        this.#declared.clear();
        this.#entries.clear();
        this.#waiting.clear();
        this.#listeners.clear();
    }

    /**
     * 装配某个座位上所有等待者（座位刚被声明 / inject 时调用）。
     *
     * @param slot 座位名
     */
    #activate(slot: SlotName): void
    {
        for (const waiter of this.#waiting.get(slot) ?? [])
        {
            if (waiter.releaseEffect) continue;
            // 宿主可能在等待期间被释放：丢掉这条等待，不要试图装 effect
            if (waiter.host.disposed) continue;
            waiter.releaseEffect = waiter.host.effect(() => waiter.callback());
        }
    }

    /**
     * 断言座位已声明，并返回它的容纳方式。
     *
     * @param slot 座位名
     * @param action 动作名（报错里用）
     * @returns 座位的容纳方式
     * @throws 未声明时抛出，并列出当前已声明的座位
     */
    #requireDeclared(slot: SlotName, action: string): SlotKind
    {
        const declaration = this.#declared.get(slot);
        if (!declaration)
        {
            const available = this.declaredSlots();

            throw new Error(`座位 ${slot} 还没有被声明，不能${action}（declaring is claiming：座位由渲染它的那一方 declare）。`
                + `当前已声明：${available.length === 0 ? '（无）' : available.join('、')}`);
        }

        return declaration.kind;
    }

    /**
     * 通知变更订阅者。
     *
     * @param slot 发生变化的座位
     */
    #notify(slot: SlotName): void
    {
        for (const listener of this.#listeners) listener(slot);
    }
}

/**
 * 造一个插槽注册表。
 *
 * @returns 注册表
 */
export function createSlotRegistry(): SlotRegistry
{
    return new SlotRegistry();
}
