import { Camera3D } from '../../core/cameras/Camera3D';
import { RegisterComponent } from '../../ecs/Component';
import { oav } from '../../objectview/ObjectView';
import { watcher } from '../../watcher/watcher';
import { Component3D } from '../Component3D';

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
        this.node3d.emitter.on('updateGlobalMatrix', this._onUpdateLocalToWorldMatrix, this);
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
        if (this._entity) this.entity['_invalidateGlobalMatrix']();
    }

    private _onUpdateLocalToWorldMatrix()
    {
        const _globalMatrix = this.node3d['_globalMatrix'];
        if (_globalMatrix && this.camera)
        {
            const camera = this.camera;
            const cameraPos = camera.node3d.worldPosition;
            const yAxis = camera.node3d.globalMatrix.getAxisY();
            _globalMatrix.lookAt(cameraPos, yAxis);
        }
    }

    dispose()
    {
        this.camera = null;
        this.node3d.emitter.off('updateGlobalMatrix', this._onUpdateLocalToWorldMatrix, this);
        super.dispose();
    }
}
