import { Component } from '../../src/ecs/Component';
import { ComponentA, CustomComponent } from './common';

import { getConstructor } from '@feng3d/serialization';
import { assert, describe, it } from 'vitest';
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
        const compnentCls = getConstructor('CustomComponent');
        ok(compnentCls === CustomComponent);

        // ComponentA 使用@RegisterComponent进行注册，但是
        const compnentACls = getConstructor('ComponentA' as any);
        ok(compnentACls === ComponentA);

        // ComponentB 没有使用@RegisterComponent进行注册
        const compnentBCls = getConstructor('ComponentB' as any);
        ok(compnentBCls === undefined);
    });
});
