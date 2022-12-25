import { oav } from '../../../objectview/ObjectView';
import { Serializable } from '../../../serialization/Serializable';
import { SerializeProperty } from '../../../serialization/SerializeProperty';
import { watcher } from '../../../watcher/watcher';
import { Projection } from '../Projection';
import { LensBase } from './LensBase';

/**
 * 正射投影镜头
 */
@Serializable('OrthographicLens')
export class OrthographicLens extends LensBase
{
    /**
     * 尺寸
     */
    @SerializeProperty()
    @oav()
    size: number;

    /**
     * 构建正射投影镜头
     * @param size 尺寸
     */
    constructor(size = 1, aspect = 1, near = 0.3, far = 1000)
    {
        super(aspect, near, far);
        watcher.watch(this as OrthographicLens, 'size', this.invalidate, this);
        this._projectionType = Projection.Orthographic;
        this.size = size;
    }

    protected _updateMatrix()
    {
        this._matrix.setOrtho(-this.size, this.size, this.size, -this.size, this.near, this.far);
    }

    clone()
    {
        return new OrthographicLens(this.size, this.aspect, this.near, this.far);
    }
}
