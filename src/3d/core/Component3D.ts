import { NodeComponent } from '../../core/NodeComponent';
import { EventEmitter } from '../../event/EventEmitter';
import { Node3D, Node3DEventMap } from './Node3D';

export interface Component3D
{
    readonly emitter: EventEmitter<Node3DEventMap>;
    get entity(): Node3D;
}

/**
 * 3D組件
 *
 * 附加在3D结点上的組件，處理3D相關的邏輯。
 */
export class Component3D extends NodeComponent
{
    declare protected _entity: Node3D;
}
