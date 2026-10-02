import { beforeEach, describe, expect, it } from 'vitest';
import { createEffectHost, createSlotRegistry, SLOT_KINDS } from '../src/plugins/slots';
import type { EffectHost, SlotName, SlotRegistry } from '../src/plugins/slots';

/**
 * 插槽注册表（#276 S1）。
 *
 * 测的是**插槽契约本身**：座位声明（declaring is claiming）、`single` / `list` 语义、
 * 加载期校验、**卸载级联**（宿主释放 = 占用与它装的监听一起消失）、`inject` 的等待语义、
 * 变更订阅与 JSON 安全快照。
 *
 * 为什么这些用例值钱：#276 验收①是"装/卸纯服务插件：**撤销后监听与定时器确实不再触发**"。
 * 现状 `revertPluginContributions` 只覆盖 Logic 一类——定时器 / 监听 / 快捷键没有撤销通道。
 * 本文件第 3 组用例就是那条验收在插槽层的可执行形式（配合 `spikes/cordis-dispose.mjs`
 * 在真 cordis 上验证同一语义）。
 *
 * 用**合成座位与合成占用者**，不碰内置清单与界面（S1 不接线，接线在 S2）。
 */

let slots: SlotRegistry;

/** 声明面板座位（多数用例的前置） */
function declarePanel(): () => void
{
    return slots.declare('panel.main');
}

beforeEach(() =>
{
    slots = createSlotRegistry();
});

describe('座位声明（declaring is claiming）', () =>
{
    it('未声明的座位不能注册，且报错里列出当前已声明的座位', () =>
    {
        // 刻意先声明一个别的座位，好让报错能"指出可用的是什么"
        slots.declare('scene.overlay');

        expect(() => slots.register(createEffectHost(), 'panel.main', { id: 'p1', source: 'plugin-a' }))
            .toThrow(/座位 panel\.main 还没有被声明[\s\S]*scene\.overlay/);
    });

    it('声明后可注册，entries 查得到 id / order / value / source', () =>
    {
        declarePanel();
        const host = createEffectHost();

        slots.register(host, 'panel.main', { id: 'p1', order: 3, value: { view: 'a' }, source: 'plugin-a' });

        expect(slots.entries('panel.main')).toEqual([
            { slot: 'panel.main', id: 'p1', order: 3, value: { view: 'a' }, source: 'plugin-a' },
        ]);
    });

    it('重复声明是幂等的：两次声明要两次取消才真正取消', () =>
    {
        const collapseA = slots.declare('panel.main');
        const collapseB = slots.declare('panel.main');

        collapseA();
        // 第一次取消只减引用计数：座位还在，注册照常
        expect(slots.declaredSlots()).toEqual(['panel.main']);

        collapseB();
        expect(slots.declaredSlots()).toEqual([]);
    });

    it('取消声明会撤掉座位上的占用，并让 inject 的等待者重新等', () =>
    {
        const collapse = slots.declare('panel.main');
        const host = createEffectHost();
        let assembled = 0;

        slots.register(host, 'panel.main', { id: 'p1', source: 'plugin-a' });
        slots.inject(host, 'panel.main', () =>
        {
            assembled++;

            return () => { assembled--; };
        });
        expect(assembled).toBe(1);

        collapse();

        // 座位没了：占用与等待者装的 effect 都撤（等待记录保留）
        expect(slots.entries('panel.main')).toEqual([]);
        expect(assembled).toBe(0);

        // 再声明：等待者重新装配
        slots.declare('panel.main');
        expect(assembled).toBe(1);
    });

    it('非核心座位必须显式给 kind（否则报错说清要什么）', () =>
    {
        // `as SlotName`：模拟插件用模块增强加了座位、却忘了进运行期座位表
        const custom = 'toolbar.right' as SlotName;

        expect(() => slots.declare(custom)).toThrow(/没有容纳方式[\s\S]*显式给 kind/);

        // 给了 kind 就能声明（自定义座位走这条路）
        slots.declare(custom, 'list');
        expect(slots.declaredSlots()).toEqual([custom]);
    });

    it('核心座位的容纳方式：根座位是 single，面板与浮层是 list', () =>
    {
        expect(SLOT_KINDS['app.root']).toBe('single');
        expect(SLOT_KINDS['panel.main']).toBe('list');
        expect(SLOT_KINDS['scene.overlay']).toBe('list');
    });
});

describe('注册语义（single / list / 幂等）', () =>
{
    it('list：多个占用按 order 排序，order 相同按注册顺序', () =>
    {
        declarePanel();
        const host = createEffectHost();

        slots.register(host, 'panel.main', { id: 'b', order: 2, source: 'plugin-b' });
        slots.register(host, 'panel.main', { id: 'a', order: 1, source: 'plugin-a' });
        slots.register(host, 'panel.main', { id: 'c', order: 1, source: 'plugin-c' });

        expect(slots.entries('panel.main').map((entry) => entry.id)).toEqual(['a', 'c', 'b']);
    });

    it('single：第二个占用者被拒绝，报错点名已占用者与来源', () =>
    {
        slots.declare('app.root');
        const host = createEffectHost();

        slots.register(host, 'app.root', { id: 'frame', source: 'core' });

        expect(() => slots.register(host, 'app.root', { id: 'rogue', source: 'plugin-x' }))
            .toThrow(/app\.root 是 single[\s\S]*core 的 frame/);
    });

    it('同 id 重复注册是幂等的：不重复添加，且返回同一个释放函数', () =>
    {
        declarePanel();
        const host = createEffectHost();

        const first = slots.register(host, 'panel.main', { id: 'p1', source: 'plugin-a' });
        const second = slots.register(host, 'panel.main', { id: 'p1', source: 'plugin-a' });

        expect(slots.entries('panel.main')).toHaveLength(1);
        expect(second).toBe(first);
    });

    it('释放单条占用只移除它自己（其它占用与宿主都还在）', () =>
    {
        declarePanel();
        const host = createEffectHost();

        slots.register(host, 'panel.main', { id: 'p1', source: 'plugin-a' });
        const release = slots.register(host, 'panel.main', { id: 'p2', source: 'plugin-b' });

        release();

        expect(slots.entries('panel.main').map((entry) => entry.id)).toEqual(['p1']);
        // 宿主没被释放：它还能继续注册（幂等释放不等于卸载）
        expect(host.disposed).toBe(false);
        slots.register(host, 'panel.main', { id: 'p3', source: 'plugin-b' });
        expect(slots.entries('panel.main').map((entry) => entry.id)).toEqual(['p1', 'p3']);
    });
});

describe('卸载级联（#276 验收①的插槽层形式）', () =>
{
    it('宿主释放后，它注册的占用全部消失（别的宿主不受影响）', () =>
    {
        declarePanel();
        const hostA = createEffectHost();
        const hostB = createEffectHost();

        slots.register(hostA, 'panel.main', { id: 'a1', source: 'plugin-a' });
        slots.register(hostB, 'panel.main', { id: 'b1', source: 'plugin-b' });

        hostA.dispose();

        expect(slots.entries('panel.main').map((entry) => entry.id)).toEqual(['b1']);
    });

    it('宿主释放会调用它每个 effect 的清理函数一次（定时器 / 监听就是这样被收走的）', () =>
    {
        declarePanel();
        const host = createEffectHost();
        const log: string[] = [];

        slots.register(host, 'panel.main', { id: 'p1', source: 'plugin-a' });
        // 模拟"插件顺手装的监听"：装在**同一个宿主**上，卸载必须一起走
        host.effect(() =>
        {
            log.push('监听已装');

            return () => { log.push('监听已拆'); };
        });

        host.dispose();
        host.dispose();

        expect(log).toEqual(['监听已装', '监听已拆']);
        // 后进先出：注册的清理也在里面（顺序不在这里断言，避免把实现细节写死）
        expect(slots.entries('panel.main')).toEqual([]);
    });

    it('已释放的宿主不能再注册或 inject（报错，而不是静默不装）', () =>
    {
        declarePanel();
        const host = createEffectHost();
        host.dispose();

        expect(() => slots.register(host, 'panel.main', { id: 'p1', source: 'plugin-a' })).toThrow(/宿主已释放/);
        expect(() => slots.inject(host, 'panel.main', () => { /* 不该跑到这里 */ })).toThrow(/宿主已释放/);
    });

    it('宿主释放后再装 effect 会报错（EffectHost 的契约）', () =>
    {
        const host: EffectHost = createEffectHost();
        host.dispose();

        expect(() => host.effect(() => { /* 不该跑到这里 */ })).toThrow(/已释放/);
    });

    it('EffectScope：单独释放之后再 dispose，清理函数不会跑第二次（幂等契约的另一半）', () =>
    {
        const host = createEffectHost();
        const log: string[] = [];

        const release = host.effect(() =>
        {
            log.push('装配');

            return () => { log.push('清理'); };
        });

        release();
        release();
        host.dispose();

        expect(log).toEqual(['装配', '清理']);
    });
});

describe('inject：等座位被声明', () =>
{
    it('座位已声明时**同步**装配', () =>
    {
        declarePanel();
        const host = createEffectHost();
        let assembled = 0;

        slots.inject(host, 'panel.main', () => { assembled++; });

        expect(assembled).toBe(1);
    });

    it('座位未声明时不装配，声明之后才装', () =>
    {
        const host = createEffectHost();
        let assembled = 0;

        slots.inject(host, 'panel.main', () => { assembled++; });
        expect(assembled).toBe(0);

        slots.declare('panel.main');
        expect(assembled).toBe(1);
    });

    it('取消等待会同时移除等待与已装的 effect', () =>
    {
        declarePanel();
        const host = createEffectHost();
        let assembled = 0;

        const cancel = slots.inject(host, 'panel.main', () =>
        {
            assembled++;

            return () => { assembled--; };
        });
        expect(assembled).toBe(1);

        cancel();
        expect(assembled).toBe(0);

        // 取消之后即使座位再变动，也不该再装配
        slots.declare('panel.main');
        expect(assembled).toBe(0);
    });

    it('宿主释放 = 取消等待（不留悬挂回调）', () =>
    {
        const host = createEffectHost();
        let assembled = 0;

        slots.inject(host, 'panel.main', () => { assembled++; });
        host.dispose();

        // 宿主已释放：座位后来才出现，也不该再装（否则会往一个死宿主里塞 effect）
        slots.declare('panel.main');
        expect(assembled).toBe(0);
    });

    it('一个等待者装配失败不影响其它等待者，也不会把座位卡成"撤不掉"', () =>
    {
        const badHost = createEffectHost();
        const goodHost = createEffectHost();
        let assembled = 0;

        // 座位还没声明：两条等待都先排队
        slots.inject(badHost, 'panel.main', () => { throw new Error('坏插件'); });
        slots.inject(goodHost, 'panel.main', () =>
        {
            assembled++;

            return () => { assembled--; };
        });

        const collapse = slots.declare('panel.main');

        // 好的那个照常装配；坏的那个被丢掉并报出来（否则它会一直留在队列里，之后每次声明都重抛）
        expect(assembled).toBe(1);

        // 座位仍然撤得掉（没被坏插件卡死）
        expect(() => collapse()).not.toThrow();
        expect(assembled).toBe(0);
    });
});

describe('变更订阅与快照', () =>
{
    it('注册 / 注销 / 声明 / 取消声明都会通知，并带上座位名', () =>
    {
        const changes: string[] = [];
        slots.onChanged((slot) => { changes.push(slot); });

        const collapse = slots.declare('panel.main');
        const host = createEffectHost();
        const release = slots.register(host, 'panel.main', { id: 'p1', source: 'plugin-a' });
        release();
        collapse();

        expect(changes).toEqual(['panel.main', 'panel.main', 'panel.main', 'panel.main']);
    });

    it('取消订阅后不再收到通知', () =>
    {
        const changes: string[] = [];
        const off = slots.onChanged((slot) => { changes.push(slot); });

        off();
        slots.declare('panel.main');

        expect(changes).toEqual([]);
    });

    it('snapshot 是 JSON 安全的：不含 value，只报结构与来源', () =>
    {
        declarePanel();
        const host = createEffectHost();
        // value 故意放一个函数：真正的快照里它必须不出现（dump 出来没有意义）
        slots.register(host, 'panel.main', { id: 'p1', order: 2, value: () => 'view', source: 'plugin-a' });

        const snapshot = slots.snapshot();

        expect(snapshot).toEqual({
            declared: ['panel.main'],
            entries: [{ slot: 'panel.main', id: 'p1', order: 2, source: 'plugin-a' }],
        });
        expect(JSON.stringify(snapshot)).not.toContain('view');
    });

    it('batch：期间不通知，结束后每个变化的座位只通知一次', () =>
    {
        declarePanel();
        const host = createEffectHost();
        const changes: string[] = [];
        slots.onChanged((slot) => { changes.push(slot); });

        slots.batch(() =>
        {
            slots.register(host, 'panel.main', { id: 'p1', source: 'plugin-a' });
            slots.register(host, 'panel.main', { id: 'p2', source: 'plugin-a' });
            slots.declare('scene.overlay');
            slots.register(host, 'scene.overlay', { id: 'o1', source: 'plugin-a' });
        });

        // 两处变化（座位去重），而不是四条逐次通知——投影的"先撤后加"就靠它不露中间态
        expect([...changes].sort()).toEqual(['panel.main', 'scene.overlay']);
    });

    it('一个订阅者抛错不掐断其它订阅者（也不把异常抛给调用方——那会掐断 effect 的清理循环）', () =>
    {
        const calls: string[] = [];
        slots.onChanged(() =>
        {
            calls.push('first');

            throw new Error('坏订阅者');
        });
        slots.onChanged(() => { calls.push('second'); });

        expect(() => slots.declare('scene.overlay')).not.toThrow();
        expect(calls).toEqual(['first', 'second']);
    });

    it('batch 内抛异常时，挂起的通知仍会发出（finally 里统一发）', () =>
    {
        declarePanel();
        const host = createEffectHost();
        const changes: string[] = [];
        slots.onChanged((slot) => { changes.push(slot); });

        expect(() =>
            slots.batch(() =>
            {
                slots.register(host, 'panel.main', { id: 'p1', source: 'plugin-a' });

                throw new Error('批量操作中途炸了');
            })
        ).toThrow('批量操作中途炸了');

        // 已经发生的变更不能因为异常而"闷掉"：订阅者看到的是最终态
        expect(changes).toEqual(['panel.main']);
        expect(slots.entries('panel.main').map((entry) => entry.id)).toEqual(['p1']);
    });

    it('reset 清空注册表（用例之间互相隔离靠它）', () =>
    {
        declarePanel();
        slots.register(createEffectHost(), 'panel.main', { id: 'p1', source: 'plugin-a' });

        slots.reset();

        expect(slots.declaredSlots()).toEqual([]);
        expect(slots.entries('panel.main')).toEqual([]);
    });
});
