/**
 * #276 阶段 2 验证：**cordis 服务 + 子 fiber 卸载级联**（编辑器插槽层用它做卸载）。
 *
 * ## 它回答什么
 *
 * 阶段 2 把插槽注册表换成了 cordis 服务（与 DSH 同一套 `@deepseek-ai/cordis`），
 * 而"插件卸载 = 它注册的占用与它自己装的监听/定时器一起消失"这条**必须成立**——
 * 这正是 #276 验收①的机制基础。这个脚本用**真实 cordis**（不是 mock）验它。
 *
 * ## 顺带把三条硬约束钉在这里（都是实测撞出来的）
 *
 * 1. **cordis Service 的状态不能用 `#` 私有字段**：服务代理会让 `this` 变成 Proxy
 *    （`ctx.slots` 与"先取到变量再调用"拿到的都是代理），而 JS 私有字段无法透过 Proxy 访问
 *    ——`TypeError: Cannot read private member ... from an object whose class did not declare it`。
 *    所以 `SlotRegistry` 用 TS `private`（运行期是普通属性）。
 * 2. **`register` / `inject` 显式接收调用方 `ctx`**：DSH 靠服务代理隐式绑 `this.ctx`，
 *    但那与约束 1 互斥；显式传参同样拿到卸载级联（下面断言 2/3）。
 * 3. **插件访问服务要先声明 `inject: ['slots']`**：不声明会报
 *    `cannot get property "slots" without inject`。
 *
 * ## 怎么跑
 *
 * ```bash
 * node packages/editor/spikes/cordis-service.mjs
 * ```
 *
 * 直接用 `@deepseek-ai/cordis`（它已是 `packages/editor` 的依赖），不需要探测外部路径。
 * 全部通过退出码 0，任一项失败退出码 1。
 */
import { Context, Service } from '@deepseek-ai/cordis';

/** 记录每次注册时"服务内部看到的 ctx"与"提供的调用方 ctx"是否同一个 */
const observations = [];

class Slots extends Service
{
    /**
     * **刻意用普通字段而不是 `#entries`**（约束 1）：服务代理会让 `this` 变成 Proxy，
     * 私有字段无法透过 Proxy 访问。
     */
    entriesList = [];

    constructor(ctx)
    {
        super(ctx, 'slots');
    }

    register(callerCtx, id)
    {
        observations.push({ id, thisCtxIsCallerCtx: this.ctx === callerCtx });

        return callerCtx.effect(() =>
        {
            this.entriesList.push(id);

            return () =>
            {
                this.entriesList = this.entriesList.filter((item) => item !== id);
            };
        });
    }

    entries()
    {
        return [...this.entriesList];
    }
}

const root = new Context();
await root.plugin(Slots);

// 核心自己的注册（记在 root fiber 上）
const registry = root.slots;
registry.register(root, 'core');

// 子插件：注册两条占用 + 顺手装一个定时器（约束 3：插件要 inject 才能访问 ctx.slots）
let childCtx = null;
let timerTicks = 0;
const childPlugin = Object.assign((ctx) =>
{
    childCtx = ctx;
    ctx.slots.register(ctx, 'child-a');
    ctx.slots.register(ctx, 'child-b');
    ctx.effect(() =>
    {
        const timer = setInterval(() => { timerTicks++; }, 5);

        return () => { clearInterval(timer); };
    });
}, { inject: ['slots'] });

await root.plugin(childPlugin);

const afterMount = [...root.slots.entries()];
await new Promise((resolve) => setTimeout(resolve, 40));
const ticksBeforeDispose = timerTicks;

// 卸载子插件（= 关掉一个插件）
await childCtx.fiber.dispose();
const afterDispose = [...root.slots.entries()];
const ticksAtDispose = timerTicks;
await new Promise((resolve) => setTimeout(resolve, 40));

const checks = [
    ['服务能按名字取到（ctx.slots）', root.slots?.name === 'slots'],
    ['装配后核心与子插件的注册都在', afterMount.join(',') === 'core,child-a,child-b'],
    ['卸载子插件后它的两条注册都消失', !afterDispose.includes('child-a') && !afterDispose.includes('child-b')],
    ['核心自己的注册不受影响', afterDispose.includes('core')],
    ['子插件装的定时器随卸载停止', ticksAtDispose === timerTicks],
    ['卸载前定时器确实在跑（对照组）', ticksBeforeDispose > 0],
];

console.log(`装配后：${JSON.stringify(afterMount)}`);
console.log(`卸载子插件后：${JSON.stringify(afterDispose)}`);
console.log(`定时器：卸载前 ${ticksBeforeDispose} 次 → 卸载后 ${ticksAtDispose} 次 → 再等 40ms ${timerTicks} 次`);
console.log('--- 断言 ---');
let failed = 0;
for (const [title, ok] of checks)
{
    if (!ok) failed++;
    console.log(` ${ok ? 'PASS' : 'FAIL'}  ${title}`);
}
console.log(failed === 0 ? '结论：cordis 服务 + 子 fiber 卸载级联成立' : `结论：${failed} 项未通过`);
process.exit(failed === 0 ? 0 : 1);
