import { assert, describe, it } from 'vitest';
import { Component, getComponentType } from '../src';
import { ComponentA, CustomComponent } from './common';

describe('Component', () =>
{
    it('constructor', () =>
    {
        const compnent = new Component();
        assert.ok(!!compnent);
    });

    it('RegisterComponent', () =>
    {
        const compnentCls = getComponentType('CustomComponent');
        assert.ok(compnentCls === CustomComponent);

        // ComponentA 使用@RegisterComponent进行注册，但是
        const compnentACls = getComponentType('ComponentA' as any);
        assert.ok(compnentACls === ComponentA);

        // ComponentB 没有使用@RegisterComponent进行注册
        const compnentBCls = getComponentType('ComponentB' as any);
        assert.ok(compnentBCls === undefined);
    });
});
