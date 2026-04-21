import { describe, expect, it, test, vi } from 'vitest';

import { effect, effectScope, EffectScope, getCurrentScope, onScopeDispose, reactive, ref } from '../src';
import { nextTick } from './nextTick';

describe('响应式/effect/作用域', () =>
{
    it('应运行', () =>
    {
        const fnSpy = vi.fn(() =>
        { });

        effectScope().run(fnSpy);
        expect(fnSpy).toHaveBeenCalledTimes(1);
    });

    it('应接受零参数', () =>
    {
        const scope = effectScope();

        expect(scope.effects.length).toBe(0);
    });

    it('应返回运行值', () =>
    {
        expect(effectScope().run(() => 1)).toBe(1);
    });

    it('应与 active 属性一起工作', () =>
    {
        const scope = effectScope();

        scope.run(() => 1);
        expect(scope.active).toBe(true);
        scope.stop();
        expect(scope.active).toBe(false);
    });

    it('应收集 effect', () =>
    {
        const scope = effectScope();

        scope.run(() =>
        {
            let dummy;
            const counter = reactive({ num: 0 });

            effect(() => (dummy = counter.num));

            expect(dummy).toBe(0);
            counter.num = 7;
            expect(dummy).toBe(7);
        });

        expect(scope.effects.length).toBe(1);
    });

    it('停止', () =>
    {
        let dummy, doubled;
        const counter = reactive({ num: 0 });

        const scope = effectScope();

        scope.run(() =>
        {
            effect(() => (dummy = counter.num));
            effect(() => (doubled = counter.num * 2));
        });

        expect(scope.effects.length).toBe(2);

        expect(dummy).toBe(0);
        counter.num = 7;
        expect(dummy).toBe(7);
        expect(doubled).toBe(14);

        scope.stop();

        counter.num = 6;
        expect(dummy).toBe(7);
        expect(doubled).toBe(14);
    });

    it('应收集嵌套作用域', () =>
    {
        let dummy, doubled;
        const counter = reactive({ num: 0 });

        const scope = effectScope();

        scope.run(() =>
        {
            effect(() => (dummy = counter.num));
            // 嵌套作用域
            effectScope().run(() =>
            {
                effect(() => (doubled = counter.num * 2));
            });
        });

        expect(scope.effects.length).toBe(1);
        expect(scope.scopes!.length).toBe(1);
        expect(scope.scopes![0]).toBeInstanceOf(EffectScope);

        expect(dummy).toBe(0);
        counter.num = 7;
        expect(dummy).toBe(7);
        expect(doubled).toBe(14);

        // 同时停止嵌套作用域
        scope.stop();

        counter.num = 6;
        expect(dummy).toBe(7);
        expect(doubled).toBe(14);
    });

    it('嵌套作用域可以逃逸', () =>
    {
        let dummy, doubled;
        const counter = reactive({ num: 0 });

        const scope = effectScope();

        scope.run(() =>
        {
            effect(() => (dummy = counter.num));
            // 嵌套作用域
            effectScope(true).run(() =>
            {
                effect(() => (doubled = counter.num * 2));
            });
        });

        expect(scope.effects.length).toBe(1);

        expect(dummy).toBe(0);
        counter.num = 7;
        expect(dummy).toBe(7);
        expect(doubled).toBe(14);

        scope.stop();

        counter.num = 6;
        expect(dummy).toBe(7);

        // 嵌套作用域不应被停止
        expect(doubled).toBe(12);
    });

    it('能够运行作用域', () =>
    {
        let dummy, doubled;
        const counter = reactive({ num: 0 });

        const scope = effectScope();

        scope.run(() =>
        {
            effect(() => (dummy = counter.num));
        });

        expect(scope.effects.length).toBe(1);

        scope.run(() =>
        {
            effect(() => (doubled = counter.num * 2));
        });

        expect(scope.effects.length).toBe(2);

        counter.num = 7;
        expect(dummy).toBe(7);
        expect(doubled).toBe(14);

        scope.stop();
    });

    it('无法运行非活动作用域', () =>
    {
        let dummy, doubled;
        const counter = reactive({ num: 0 });

        const scope = effectScope();

        scope.run(() =>
        {
            effect(() => (dummy = counter.num));
        });

        expect(scope.effects.length).toBe(1);

        scope.stop();

        scope.run(() =>
        {
            effect(() => (doubled = counter.num * 2));
        });

        // expect('[警告] 无法运行已停用的 effect 作用域。').toHaveBeenWarned()

        expect(scope.effects.length).toBe(0);

        counter.num = 7;
        expect(dummy).toBe(0);
        expect(doubled).toBe(undefined);
    });

    it('应触发 onScopeDispose 钩子', () =>
    {
        let dummy = 0;

        const scope = effectScope();

        scope.run(() =>
        {
            onScopeDispose(() => (dummy += 1));
            onScopeDispose(() => (dummy += 2));
        });

        scope.run(() =>
        {
            onScopeDispose(() => (dummy += 4));
        });

        expect(dummy).toBe(0);

        scope.stop();
        expect(dummy).toBe(7);
    });

    it('没有活动 effect 作用域时调用 onScopeDispose() 应警告', () =>
    {
        const spy = vi.fn();
        const scope = effectScope();

        scope.run(() =>
        {
            onScopeDispose(spy);
        });

        expect(spy).toHaveBeenCalledTimes(0);

        onScopeDispose(spy);

        // expect(
        //     '[警告] onScopeDispose() 在没有活动的 effect 作用域时被调用，无法关联。',
        // ).toHaveBeenWarned()

        scope.stop();
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('停止子作用域后应从父作用域解引用（无内存泄漏）', () =>
    {
        const parent = effectScope();
        const child = parent.run(() => effectScope())!;

        expect(parent.scopes!.includes(child)).toBe(true);
        child.stop();
        expect(parent.scopes!.includes(child)).toBe(false);
    });

    it('运行分离的嵌套 EffectScope 时 getCurrentScope() 应保持有效', () =>
    {
        const parentScope = effectScope();

        parentScope.run(() =>
        {
            const currentScope = getCurrentScope();

            expect(currentScope).toBeDefined();
            const detachedScope = effectScope(true);

            detachedScope.run(() =>
            { });

            expect(getCurrentScope()).toBe(currentScope);
        });
    });

    it('在活动作用域内调用分离作用域的 .off() 不应破坏 currentScope', () =>
    {
        const parentScope = effectScope();

        parentScope.run(() =>
        {
            const childScope = effectScope(true);

            childScope.on();
            childScope.off();
            expect(getCurrentScope()).toBe(parentScope);
        });
    });

    it('应暂停/恢复 EffectScope', async () =>
    {
        const counter = reactive({ num: 0 });
        const fnSpy = vi.fn(() => counter.num);
        const scope = new EffectScope();

        scope.run(() =>
        {
            effect(fnSpy);
        });

        expect(fnSpy).toHaveBeenCalledTimes(1);

        counter.num++;
        await nextTick();
        expect(fnSpy).toHaveBeenCalledTimes(2);

        scope.pause();
        counter.num++;
        await nextTick();
        expect(fnSpy).toHaveBeenCalledTimes(2);

        counter.num++;
        await nextTick();
        expect(fnSpy).toHaveBeenCalledTimes(2);

        scope.resume();
        expect(fnSpy).toHaveBeenCalledTimes(3);
    });
});
