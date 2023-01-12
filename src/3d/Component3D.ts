import { Node3D, Node3DEventMap } from './Node3D';
import { NodeComponent } from '../core/core/NodeComponent';
import { EventEmitter } from '../event/EventEmitter';

/**
 * 3D組件
 *
 * 附加在3D结点上的組件，處理3D相關的邏輯。
 */
export class Component3D extends NodeComponent
{
    declare emitter: EventEmitter<Node3DEventMap>;

    /**
     * 2D节点。
     */
    get node3d()
    {
        return this._entity as Node3D;
    }
}
