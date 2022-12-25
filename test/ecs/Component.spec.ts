import { Component, getComponentType } from '../../src/ecs/Component';
import { ComponentA, CustomComponent } from './common';

import { assert, describe, expect, it } from 'vitest'
const { ok, equal, deepEqual, strictEqual } = assert;

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
