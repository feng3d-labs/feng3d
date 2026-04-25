import { Sphere } from '@feng3d-plugins/cannon';
import { AddComponentMenu, decoratorRegisterClass, oav, RegisterComponent, serialize } from 'feng3d';
import { Collider } from './Collider';

declare global
{
    export interface MixinsComponentMap
    {
        SphereCollider: SphereCollider;
    }
}

export interface SphereCollider
{
    get shape(): Sphere;
}

/**
 * 球形碰撞体
 */
@AddComponentMenu('Physics/Sphere Collider')
@RegisterComponent()
@decoratorRegisterClass()
export class SphereCollider extends Collider
{
    /**
     * 半径
     */
    @oav()
    @serialize
    get radius()
    {
        return this._radius;
    }
    set radius(v)
    {
        this._radius = v;
        if (this._shape)
        { this._shape.radius = v; }
    }

    private _radius = 0.5;

    init()
    {
        this._shape = new Sphere(this._radius);
    }
}
