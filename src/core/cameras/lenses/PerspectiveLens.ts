import { Vector3 } from '../../../math/geom/Vector3';
import { Vector4 } from '../../../math/geom/Vector4';
import { oav } from '../../../objectview/ObjectView';
import { Serializable } from '../../../serialization/Serializable';
import { SerializeProperty } from '../../../serialization/SerializeProperty';
import { watcher } from '../../../watcher/watcher';
import { Projection } from '../Projection';
import { LensBase } from './LensBase';

/**
 * 透视摄像机镜头
 */
@Serializable()
export class PerspectiveLens extends LensBase
{
    /**
     * 垂直视角，视锥体顶面和底面间的夹角；单位为角度，取值范围 [1,179]
     */
    @SerializeProperty()
    @oav()
    fov: number;

    /**
     * 创建一个透视摄像机镜头
     * @param fov 垂直视角，视锥体顶面和底面间的夹角；单位为角度，取值范围 [1,179]
     *
     */
    constructor(fov = 60, aspect = 1, near = 0.3, far = 1000)
    {
        super(aspect, near, far);
        watcher.watch(this as PerspectiveLens, 'fov', this.invalidate, this);
        this._projectionType = Projection.Perspective;
        this.fov = fov;
    }

    /**
     * 焦距
     */
    get focalLength(): number
    {
        return 1 / Math.tan(this.fov * Math.PI / 360);
    }

    set focalLength(value: number)
    {
        this.fov = Math.atan(1 / value) * 360 / Math.PI;
    }

    /**
     * 投影
     *
     * 摄像机空间坐标投影到GPU空间坐标
     *
     * @param point3d 摄像机空间坐标
     * @param v GPU空间坐标
     * @return GPU空间坐标
     */
    project(point3d: Vector3, v = new Vector3()): Vector3
    {
        const v4 = this.matrix.transformVector4(new Vector4().fromVector3(point3d, 1));
        // 透视投影结果中w!=1，需要标准化齐次坐标
        v.fromVector4(v4);
        v.scaleNumber(1 / v4.w);

        return v;
    }

    /**
     * 逆投影
     *
     * GPU空间坐标投影到摄像机空间坐标
     *
     * @param point3d GPU空间坐标
     * @param vOut 摄像机空间坐标（输出）
     * @returns 摄像机空间坐标
     */
    unproject(point3d: Vector3, vOut = new Vector3())
    {
        // ！！该计算过程需要参考或者研究透视投影矩阵
        // 初始化齐次坐标
        const p4 = new Vector4().fromVector3(point3d, 1);
        // 逆投影求出深度值
        const v4 = this.inverseMatrix.transformVector4(p4);
        const sZ = 1 / v4.w;
        // 齐次坐标乘以深度值获取真实的投影结果
        const p44 = p4.scaleNumberTo(sZ);
        // 计算逆投影
        const v44 = this.inverseMatrix.transformVector4(p44);
        // 输出3维坐标
        vOut.fromVector4(v44);

        return vOut;
    }

    protected _updateMatrix()
    {
        this._matrix.setPerspectiveFromFOV(this.fov, this.aspect, this.near, this.far);
    }

    clone()
    {
        return new PerspectiveLens(this.fov, this.aspect, this.near, this.far);
    }
}
