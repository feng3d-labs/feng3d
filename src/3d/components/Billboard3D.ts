import { RegisterComponent } from '../../ecs/Component';
import { oav } from '@feng3d/objectview';
import { watcher } from '../../watcher/watcher';
import { Camera3D } from '../cameras/Camera3D';
import { Component3D } from '../core/Component3D';

declare module '../../ecs/Component' { interface ComponentMap { Billboard3D: Billboard3D; } }

/**
 * 保持面向摄像机。
 */
@RegisterComponent({ name: 'Billboard3D', menu: 'Layout/Billboard3D' })
export class Billboard3D extends Component3D
{
    declare __class__: 'Billboard3D';

    /**
     * 相机
     */
    @oav()
    camera: Camera3D;

    init()
    {
        super.init();
        watcher.watch(this as Billboard3D, 'camera', this._onCameraChanged, this);
        this.entity.emitter.on('updateGlobalMatrix', this._onUpdateGlobalMatrix, this);
        this._invalidHoldSizeMatrix();
    }

    private _onCameraChanged(value: Camera3D, oldValue: Camera3D)
    {
        if (oldValue) oldValue.emitter.off('globalMatrixChanged', this._invalidHoldSizeMatrix, this);
        if (value) value.emitter.on('globalMatrixChanged', this._invalidHoldSizeMatrix, this);
        this._invalidHoldSizeMatrix();
    }

    private _invalidHoldSizeMatrix()
    {
        // @ts-ignore
        this.entity._invalidateGlobalMatrix();
    }

    private _onUpdateGlobalMatrix()
    {
        // @ts-ignore
        const _globalMatrix = this.entity._globalMatrix;
        if (_globalMatrix && this.camera)
        {
            const camera = this.camera;
            const cameraPos = camera.entity.globalPosition;
            const yAxis = camera.entity.globalMatrix.getAxisY();
            _globalMatrix.lookAt(cameraPos, yAxis);
        }
    }

    destroy()
    {
        this.camera = null;
        this.entity.emitter.off('updateGlobalMatrix', this._onUpdateGlobalMatrix, this);
        super.destroy();
    }
}
