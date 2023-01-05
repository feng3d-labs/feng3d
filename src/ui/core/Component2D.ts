import { NodeComponent } from '../../core/core/NodeComponent';
import { EventEmitter } from '../../event/EventEmitter';
import { Node2D, Node2DEventMap } from './Node2D';

export class Component2D extends NodeComponent
{
    declare emitter: EventEmitter<Node2DEventMap>;
    /**
     * 2D节点。
     */
    get node2d()
    {
        return this._entity as Node2D;
    }
}
