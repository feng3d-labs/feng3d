import { RegisterComponent } from '../../ecs/Component';
import { oav } from '../../objectview/ObjectView';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { watcher } from '../../watcher/watcher';
import { Camera3D } from './Camera3D';

declare module '../../ecs/Component' { interface ComponentMap { OrthographicCamera3D: OrthographicCamera3D; } }

/**
 * 正射投影镜头
 */
@RegisterComponent({ name: 'OrthographicCamera3D' })
export class OrthographicCamera3D extends Camera3D
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
        watcher.watch(this as OrthographicCamera3D, 'size', this.invalidateProjectionMatrix, this);
        this.size = size;
    }

    protected _updateProjectionMatrix()
    {
        this._projectionMatrix.setOrtho(-this.size * this.aspect, this.size * this.aspect, this.size, -this.size, this.near, this.far);
    }

    clone()
    {
        return new OrthographicCamera3D(this.size, this.aspect, this.near, this.far);
    }
}
