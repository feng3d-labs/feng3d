import { RegisterComponent } from '../../ecs/Component';
import { Matrix4x4 } from '../../math/geom/Matrix4x4';
import { Component3D } from '../core/Component3D';
import { Node3D } from '../core/Node3D';

declare module '../../ecs/Component'
{
    interface ComponentMap
    {
        Skeleton3D: Skeleton3D;
    }
}

@RegisterComponent({ name: 'Skeleton3D' })
export class Skeleton3D extends Component3D
{
    declare __class__: 'Skeleton3D';

    /**
     * 骨骼蒙皮时逆矩阵列表。
     */
    boneInverses: Matrix4x4[];

    /**
     * 骨骼名称列表
     */
    boneNames: string[];

    /**
     * 当前骨骼姿势的全局矩阵
     * @see #globalPose
     */
    get globalMatrices(): Matrix4x4[]
    {
        for (let i = 0; i < this.boneNames.length; i++)
        {
            const jointObject = this.entity.find(this.boneNames[i]) as Node3D;

            this._globalMatrices[i] = this._globalMatrices[i] || new Matrix4x4();
            this._globalMatrices[i].copy(jointObject.globalMatrix).prepend(this.boneInverses[i]);
        }

        return this._globalMatrices;
    }

    //
    private _globalMatrices: Matrix4x4[] = [];
}
