import { Matrix4x4 } from '../../../math/geom/Matrix4x4';
import { Serializable } from '../../../serialization/Serializable';
import { Component, RegisterComponent } from '../../../ecs/Component';
import { Node3D } from '../../core/Node3D';

declare global
{
    export interface MixinsComponentMap
    {
        SkeletonComponent: SkeletonComponent;
    }
}

@RegisterComponent()
@Serializable()
export class SkeletonComponent extends Component
{
    __class__: 'SkeletonComponent';

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
            const jointObject = this.object3D.find(this.boneNames[i]) as Node3D;

            this._globalMatrices[i] = this._globalMatrices[i] || new Matrix4x4();
            this._globalMatrices[i].copy(jointObject.globalMatrix).prepend(this.boneInverses[i]);
        }

        return this._globalMatrices;
    }

    //
    private _globalMatrices: Matrix4x4[] = [];
}
