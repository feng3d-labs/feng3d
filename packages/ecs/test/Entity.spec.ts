import { assert, describe, it } from 'vitest';
import { Entity } from '../src';
import { ComponentA, CustomComponent } from './common';

describe('Entity', () =>
{
    it('constructor', () =>
    {
        const entity = new Entity();
        assert.ok(!!entity);
    });

    it('addComponent', () =>
    {
        const entity = new Entity();
        const compnentA = entity.addComponent(ComponentA);

        assert.ok(compnentA instanceof ComponentA);
        assert.ok(compnentA === entity.getComponentAt(0));
        assert.ok(compnentA === entity.components[0]);

        const customComponent = entity.addComponent(CustomComponent);
        assert.ok(customComponent === entity.getComponentAt(1));
    });
});
