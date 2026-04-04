import { getConstructor } from '../serialization/getConstructor';
import { ComponentA, CustomComponent } from './common';

import { assert, describe, it } from 'vitest';
import { Component } from './Component';

describe('Component', () =>
{
    it('constructor', () =>
    {
        const compnent = new Component();
        assert.ok(!!compnent);
    });

    it('RegisterComponent', () =>
    {
        const compnentCls = getConstructor('CustomComponent');
        assert.ok(compnentCls === CustomComponent);

        // ComponentA 使用@RegisterComponent进行注册，但是
        const compnentACls = getConstructor('ComponentA' as any);
        assert.ok(compnentACls === ComponentA);

        // ComponentB 没有使用@RegisterComponent进行注册
        const compnentBCls = getConstructor('ComponentB' as any);
        assert.ok(compnentBCls === undefined);
    });
});
