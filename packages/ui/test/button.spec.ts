// 副作用导入：Button / Transform2D / Rect 都是纯数据类型（Button 是可挂载的 Behaviour 组件、
// Transform2D 是纯数据组件），只用作类型标注的 import 会被转译器整条擦除，于是 feng3d 与本包的
// registerLogic 都不执行、logic() 返回 null（前几批实测踩过的坑，见 tmp/progress-ui-migration.md）。
import 'feng3d';
import { BehaviourLogic, Object3D } from 'feng3d';
import { logic, reactive } from '@feng3d/reactivity';
import { describe, expect, it } from 'vitest';
import '../src/Button';
import '../src/Rect';
import '../src/core/Transform2D';
import { ButtonState, createButtonObject3D } from '../src/Button';
import type { Button } from '../src/Button';
import { getTransform2D } from '../src/core/Transform2D';

/** 构造一个挂了 Button 组件的对象（可选带子对象） */
function mountButton(children?: Object3D[])
{
    const object3D: Object3D = {
        __type__: 'Object3D',
        name: 'button',
        components: [{ __type__: 'Button' }],
        ...(children ? { children } : {}),
    };
    logic(object3D);

    return {
        object3D,
        button: object3D.components!.find((component) => component.__type__ === 'Button') as Button,
    };
}

/** 一个可被子状态数据写回的子对象（`tag` 是 Object3D 的普通数据字段，便于观察写入） */
function labeledChild(name: string, tag: string): Object3D
{
    return { __type__: 'Object3D', name, tag };
}

describe('Button（新架构迁移）', () =>
{
    describe('默认值与 logic 分发', () =>
    {
        it('state 缺省补成 ButtonState.up、allStateData 缺省补成空对象（迁移前的字段初始值）', () =>
        {
            const { button } = mountButton();

            expect(button.state).toBe(ButtonState.up);
            expect(button.allStateData).toEqual({});
        });

        it('logic() 分发到 ButtonLogic（BehaviourLogic 子类，带 saveState / update）', () =>
        {
            const { button } = mountButton();
            const buttonLogic = logic(button);

            expect(buttonLogic).toBeInstanceOf(BehaviourLogic);
            expect(typeof buttonLogic.saveState).toBe('function');
            expect(typeof buttonLogic.update).toBe('function');
        });

        it('字面量里显式声明的 state / allStateData 不被默认值覆盖', () =>
        {
            const object3D: Object3D = {
                __type__: 'Object3D',
                components: [{ __type__: 'Button', state: ButtonState.disabled, allStateData: { disabled: {} } }],
            };
            logic(object3D);
            const button = object3D.components![0] as Button;

            expect(button.state).toBe(ButtonState.disabled);
            expect(button.allStateData).toEqual({ disabled: {} });
        });
    });

    describe('saveState（保存当前状态数据）', () =>
    {
        it('把子对象数据按名存进当前状态（序列化后去掉 __class__）', () =>
        {
            const { button } = mountButton([labeledChild('bg', 'A'), labeledChild('label', 'B')]);

            logic(button).saveState();

            const stateData = button.allStateData![ButtonState.up];
            expect(Object.keys(stateData).sort()).toEqual(['bg', 'label']);
            expect(stateData.bg).toMatchObject({ name: 'bg', tag: 'A' });
            expect(stateData.label).toMatchObject({ name: 'label', tag: 'B' });
            // deleteClassKey 清掉了序列化产生的 __class__（纯数据 Object3D 本就没有；
            // 这里防止将来序列化器给它补上后又被反序列化走进构造器分支）
            expect((stateData.bg as Record<string, unknown>).__class__).toBeUndefined();
        });

        it('同名子对象只保存第一个（迁移前语义）', () =>
        {
            const { button } = mountButton([labeledChild('dup', 'first'), labeledChild('dup', 'second')]);

            logic(button).saveState();

            const stateData = button.allStateData![ButtonState.up];
            expect(Object.keys(stateData)).toEqual(['dup']);
            expect(stateData.dup).toMatchObject({ tag: 'first' });
        });

        it('不同状态各自保存一份数据，互不覆盖（容器按状态名分槽）', () =>
        {
            const child = labeledChild('label', 'up-tag');
            const { button } = mountButton([child]);
            const buttonLogic = logic(button);

            buttonLogic.saveState();
            reactive(child).tag = 'down-tag';
            reactive(button).state = ButtonState.down;
            buttonLogic.saveState();

            expect(button.allStateData![ButtonState.up].label).toMatchObject({ tag: 'up-tag' });
            expect(button.allStateData![ButtonState.down].label).toMatchObject({ tag: 'down-tag' });
        });

        it('未挂载到对象上时安全（没有实体就没有子对象，只写入空的状态数据）', () =>
        {
            const button: Button = { __type__: 'Button' };
            const buttonLogic = logic(button);

            expect(() => buttonLogic.saveState()).not.toThrow();
            expect(button.allStateData).toEqual({ up: {} });
        });
    });

    describe('update（按状态把数据写回子对象）', () =>
    {
        it('state 变化后下一次 update 把该状态的数据写回子对象（经响应式代理写入）', () =>
        {
            const child = labeledChild('label', 'A');
            const { button } = mountButton([child]);
            const buttonLogic = logic(button);

            buttonLogic.saveState();                        // up = { label: { tag: 'A' } }
            buttonLogic.update(16);
            reactive(child).tag = 'B';

            // 切到没有保存数据的状态：不写（保留子对象当前值）
            reactive(button).state = ButtonState.over;
            buttonLogic.update(16);
            expect(child.tag).toBe('B');

            // 切回 up：写回保存的数据
            reactive(button).state = ButtonState.up;
            buttonLogic.update(16);
            expect(child.tag).toBe('A');
        });

        it('update 只在状态失效时重建（未失效的帧不覆盖子对象）', () =>
        {
            const child = labeledChild('label', 'A');
            const { button } = mountButton([child]);
            const buttonLogic = logic(button);

            buttonLogic.saveState();
            buttonLogic.update(16);                         // 首次 update 消耗掉初始失效标志
            reactive(child).tag = 'B';
            buttonLogic.update(16);                         // 状态没变 → 不再写回
            expect(child.tag).toBe('B');

            reactive(button).state = ButtonState.down;      // 失效，但 down 无数据
            buttonLogic.update(16);
            expect(child.tag).toBe('B');

            reactive(button).state = ButtonState.up;
            buttonLogic.update(16);
            expect(child.tag).toBe('A');
        });

        it('未挂载到对象上时 update 安全（无子对象可写）', () =>
        {
            const button: Button = { __type__: 'Button' };
            const buttonLogic = logic(button);

            expect(() => buttonLogic.update(16)).not.toThrow();
        });
    });

    describe('createButtonObject3D（取代原 registerPrimitive）', () =>
    {
        it('只含 Transform2D + Button，没有 CanvasRenderer（与原 primitive 一致）', () =>
        {
            const object3D = createButtonObject3D();

            expect(object3D.components!.map((component) => component.__type__)).toEqual(['Transform2D', 'Button']);
            expect(getTransform2D(object3D)!.size).toEqual({ x: 160, y: 30 });
        });

        it('产出的字面量能被 logic() 正常初始化（含 ButtonLogic 与默认状态）', () =>
        {
            const object3D = createButtonObject3D();
            logic(object3D);
            const button = object3D.components![1] as Button;

            expect(logic(button)).toBeInstanceOf(BehaviourLogic);
            expect(button.state).toBe(ButtonState.up);
            expect(button.allStateData).toEqual({});
        });
    });
});
