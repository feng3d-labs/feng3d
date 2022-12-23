import { ok } from 'assert';
import { Entity } from '../../src/core/core/Entity';
import { ComponentA, CustomComponent } from './common';

describe('Entity', () =>
{
    it('constructor', () =>
    {
        const entity = new Entity();
        ok(!!entity);
    });

    it('addComponent', () =>
    {
        const entity = new Entity();
        const compnentA = entity.addComponent(ComponentA);

        ok(compnentA instanceof ComponentA);
        ok(compnentA === entity.getComponentAt(0));
        ok(compnentA === entity.components[0]);

        const customComponent = entity.addComponent(CustomComponent);
        ok(customComponent === entity.getComponentAt(1));
    });
});
