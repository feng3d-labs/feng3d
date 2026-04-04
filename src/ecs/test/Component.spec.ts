import { Component } from '../src/Component';
import { ComponentA, CustomComponent } from './common';

import { getConstructor } from '@feng3d/serialization';
import { assert, describe, it } from 'vitest';

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
