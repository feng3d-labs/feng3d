import { describe, expect, it } from 'vitest';
import { computed as feng3dComputed, effect as feng3dEffect, reactive as feng3dReactive } from 'feng3d';
import { computed as vueComputed, reactive as vueReactive } from 'vue';
import { createWriteBridge } from '../src/vue-app/objectview/utils/createWriteBridge';

/**
 * 属性面板写入路径的契约（根规范 §11.3 在面板边界的落地）。
 *
 * 背景：OAV 控件都写 `reactive(props.owner)[name] = v`，而这个 `reactive` 是 **Vue 的**；
 * 引擎用的是 `@feng3d/reactivity`。两套响应式各有各的依赖表，**互不通知**——
 * 没有这层桥时，改完属性面板数据变了但引擎的 computed 不会失效重算（画面不动）。
 *
 * 这些用例把契约钉在「写入必须通知引擎」上：谁把桥去掉，它们就红。
 */
describe('createWriteBridge', () =>
{
    /** 模拟控件的读写路径：控件拿到的 owner 会经 Vue 的 reactive 包装 */
    function asControl(owner: object): Record<string, unknown>
    {
        return vueReactive(createWriteBridge(owner)) as Record<string, unknown>;
    }

    it('经控件写入时，feng3d 的 effect 与 computed 都收到通知', () =>
    {
        const data: { value: number } = { value: 1 };
        const r_owner = asControl(data);

        let effectRuns = 0;
        const handle = feng3dEffect(() =>
        {
            feng3dReactive(data).value; // 建立依赖
            effectRuns++;
        });
        const derived = feng3dComputed(() => feng3dReactive(data).value * 10);

        expect(effectRuns).toBe(1);
        expect(derived.value).toBe(10);

        r_owner.value = 5; // ← 控件做的事

        expect(effectRuns).toBe(2);
        expect(derived.value).toBe(50);
        handle?.stop?.();
    });

    it('写入落到原对象上（不是写到桥的副本）', () =>
    {
        const data: { value: number } = { value: 1 };
        const r_owner = asControl(data);

        r_owner.value = 42;

        expect(data.value).toBe(42);
    });

    it('Vue 侧照常建立依赖：写入后控件的 computed 也会更新', () =>
    {
        const data: { value: number } = { value: 1 };
        const r_owner = asControl(data);
        const displayed = vueComputed(() => r_owner.value);

        expect(displayed.value).toBe(1);
        r_owner.value = 7;
        expect(displayed.value).toBe(7);
    });

    it('桥自己不包装嵌套对象（不改身份，避免消费方拿代理去比较）', () =>
    {
        // 控件对嵌套对象最终都是**整体写**（`useOAVVector3` 改完分量后整体写回字段），
        // 所以桥不需要代理嵌套对象；一旦代理，`OAVComponentList` 交给 ComponentView 的
        // 组件就变成代理——踩上「代理与原始对象比较失配」那类坑。这里把"桥不改身份"钉住。
        //
        // 注意：控件侧还会经过一层 Vue 的 `reactive(props.owner)`，那层照旧会包装对象
        // （改动之前就是如此），消费方该 `toRaw` 还是要 `toRaw`。
        const position = { x: 0, y: 0, z: 0 };
        const data: { position: typeof position } = { position };

        expect(createWriteBridge(data).position).toBe(position);
    });

    it('整体写嵌套字段（控件实际的做法）同样通知引擎', () =>
    {
        const data: { position: { x: number, y: number, z: number } } = { position: { x: 0, y: 0, z: 0 } };
        const r_owner = asControl(data);

        let effectRuns = 0;
        const handle = feng3dEffect(() =>
        {
            feng3dReactive(data).position;
            effectRuns++;
        });

        r_owner.position = { x: 3, y: 0, z: 0 };

        expect(effectRuns).toBe(2);
        expect(data.position.x).toBe(3);
        handle?.stop?.();
    });

    it('外部（引擎侧）改动后，桥读到的是最新值', () =>
    {
        const data: { value: number } = { value: 1 };
        const r_owner = asControl(data);

        feng3dReactive(data).value = 99;

        expect(r_owner.value).toBe(99);
    });

    it('基础类型不被代理包装（读到的就是数字本身）', () =>
    {
        const data: { count: number, name: string, flag: boolean } = { count: 3, name: 'cube', flag: true };
        const r_owner = asControl(data);

        expect(r_owner.count).toBe(3);
        expect(r_owner.name).toBe('cube');
        expect(r_owner.flag).toBe(true);
    });
});
