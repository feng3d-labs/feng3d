import { Box } from '@feng3d-plugins/cannon';
import { AddComponentMenu, decoratorRegisterClass, oav, RegisterComponent, serialize, Vector3 } from 'feng3d';
import { Collider } from './Collider';

declare global
{
    export interface MixinsComponentMap
    {
        BoxCollider: BoxCollider;
    }
}

export interface BoxCollider
{
    get shape(): Box;
}

/**
 * 长方体碰撞体
 */
@AddComponentMenu('Physics/Box Collider')
@RegisterComponent()
@decoratorRegisterClass()
export class BoxCollider extends Collider
{
    /**
     * 宽度
     */
    @oav()
    @serialize
    width = 1;

    /**
     * 高度
     */
    @oav()
    @serialize
    height = 1;

    /**
     * 深度
     */
    @oav()
    @serialize
    depth = 1;

    declare protected _shape: Box;

    init()
    {
        const halfExtents = new Vector3(this.width / 2, this.height / 2, this.depth / 2);
        this._shape = new Box(halfExtents as any);
    }
}
