import { RegisterComponent } from '../../ecs/Component';
import { oav } from '../../objectview/ObjectView';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { watcher } from '../../watcher/watcher';
import { Camera3D } from './Camera3D';

declare module '../../ecs/Component' { interface ComponentMap { OrthographicCamera3D: OrthographicCamera3D; } }

/**
 * 正射投影相机。
 */
@RegisterComponent({ name: 'OrthographicCamera3D' })
export class OrthographicCamera3D extends Camera3D
{
    /**
     * 尺寸
     */
    @SerializeProperty()
    @oav()
    size = 1;

    init(): void
    {
        super.init();

        watcher.watch(this as OrthographicCamera3D, 'size', this._invalidateProjectionMatrix, this);
    }

    dispose(): void
    {
        watcher.unwatch(this as OrthographicCamera3D, 'size', this._invalidateProjectionMatrix, this);

        super.dispose();
    }

    protected _updateProjectionMatrix()
    {
        this._projectionMatrix.setOrtho(-this.size * this.aspect, this.size * this.aspect, this.size, -this.size, this.near, this.far);
    }
}
