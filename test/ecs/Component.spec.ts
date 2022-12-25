import { ok } from 'assert';
import { Component, getComponentType } from '../../src/ecs/Component';
import { ComponentA, CustomComponent } from './common';

describe('Component', () =>
{
    it('constructor', () =>
    {
        const compnent = new Component();
        ok(!!compnent);
    });

    it('RegisterComponent', () =>
    {
        const compnentCls = getComponentType('CustomComponent');
        ok(compnentCls === CustomComponent);

        // ComponentA 使用@RegisterComponent进行注册，但是
        const compnentACls = getComponentType('ComponentA' as any);
        ok(compnentACls === ComponentA);

        // ComponentB 没有使用@RegisterComponent进行注册
        const compnentBCls = getComponentType('ComponentB' as any);
        ok(compnentBCls === undefined);
    });
});
