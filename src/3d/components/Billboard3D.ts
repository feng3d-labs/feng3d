import { RegisterComponent } from '../../ecs/Component';
import { oav } from '../../objectview/ObjectView';
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
        this.node3d.emitter.on('updateGlobalMatrix', this._onUpdateGlobalMatrix, this);
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
        this.node3d._invalidateGlobalMatrix();
    }
    
    private _onUpdateGlobalMatrix()
    {
        // @ts-ignore
        const _globalMatrix = this.node3d._globalMatrix;
        if (_globalMatrix && this.camera)
        {
            const camera = this.camera;
            const cameraPos = camera.node3d.globalPosition;
            const yAxis = camera.node3d.globalMatrix.getAxisY();
            _globalMatrix.lookAt(cameraPos, yAxis);
        }
    }

    dispose()
    {
        this.camera = null;
        this.node3d.emitter.off('updateGlobalMatrix', this._onUpdateGlobalMatrix, this);
        super.dispose();
    }
}
