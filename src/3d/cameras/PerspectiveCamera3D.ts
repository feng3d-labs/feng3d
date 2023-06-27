import { RegisterComponent } from '../../ecs/Component';
import { oav } from '@feng3d/objectview';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { watcher } from '../../watcher/watcher';
import { Camera3D } from './Camera3D';

declare module '../../ecs/Component' { interface ComponentMap { PerspectiveCamera3D: PerspectiveCamera3D; } }

/**
 * 透视摄像机
 */
@RegisterComponent({ name: 'PerspectiveCamera3D' })
export class PerspectiveCamera3D extends Camera3D
{
    declare __class__: 'PerspectiveCamera3D';

    /**
     * 垂直视角，视锥体顶面和底面间的夹角；单位为角度，取值范围 [1,179]
     */
    @SerializeProperty()
    @oav()
    fov = 60;

    init(): void
    {
        super.init();

        watcher.watch(this as PerspectiveCamera3D, 'fov', this._invalidateProjectionMatrix, this);
    }

    destroy()
    {
        watcher.unwatch(this as PerspectiveCamera3D, 'fov', this._invalidateProjectionMatrix, this);

        super.destroy();
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

    protected _updateProjectionMatrix()
    {
        this._projectionMatrix.setPerspectiveFromFOV(this.fov, this.aspect, this.near, this.far);
    }
}
