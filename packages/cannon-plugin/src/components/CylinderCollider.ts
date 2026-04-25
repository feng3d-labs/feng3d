import { Cylinder } from '@feng3d-plugins/cannon';
import { AddComponentMenu, decoratorRegisterClass, oav, RegisterComponent, serialize } from 'feng3d';
import { Collider } from './Collider';

declare global
{
    export interface MixinsComponentMap
    {
        CylinderCollider: CylinderCollider;
    }
}

export interface CylinderCollider
{
    get shape(): Cylinder;
}

/**
 * 圆柱体碰撞体
 */
@AddComponentMenu('Physics/Cylinder Collider')
@RegisterComponent()
@decoratorRegisterClass()
export class CylinderCollider extends Collider
{
    /**
     * 顶部半径
     */
    @oav()
    @serialize
    topRadius = 0.5;

    /**
     * 底部半径
     */
    @oav()
    @serialize
    bottomRadius = 0.5;

    /**
     * 高度
     */
    @oav()
    @serialize
    height = 2;

    /**
     * 横向分割数
     */
    @oav()
    @serialize
    segmentsW = 16;

    init()
    {
        this._shape = new Cylinder(this.topRadius, this.bottomRadius, this.height, this.segmentsW);
    }
}
