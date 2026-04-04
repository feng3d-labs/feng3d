import { NodeComponent } from '@feng3d/core';
import { EventEmitter } from '@feng3d/event';
import { Node2D, Node2DEventMap } from './Node2D';

export interface Component2D
{
    readonly emitter: EventEmitter<Node2DEventMap>;

    get entity(): Node2D;
}

export class Component2D extends NodeComponent
{
    protected _entity: Node2D;
}
