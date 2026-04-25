import { Shape } from '@feng3d-plugins/cannon';
import { Component, RegisterComponent } from 'feng3d';

declare global
{
    export interface MixinsComponentMap
    {
        Collider: Collider;
    }
}

/**
 * 碰撞体
 */
@RegisterComponent()
export class Collider extends Component
{
    get shape()
    {
        return this._shape;
    }
    protected _shape: Shape;
}
