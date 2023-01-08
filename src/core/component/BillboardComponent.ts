import { RegisterComponent } from '../../ecs/Component';
import { oav } from '../../objectview/ObjectView';
import { Serializable } from '../../serialization/Serializable';
import { watcher } from '../../watcher/watcher';
import { Camera } from '../cameras/Camera';
import { Component3D } from '../core/Component3D';
import { AddComponentMenu } from '../Menu';

declare module '../../ecs/Component'
{
    interface ComponentMap
    {
        BillboardComponent: BillboardComponent;
    }
}

@AddComponentMenu('Layout/BillboardComponent')
@RegisterComponent({ name: 'BillboardComponent' })
@Serializable('BillboardComponent')
export class BillboardComponent extends Component3D
{
    declare __class__: 'BillboardComponent';

    /**
     * 相机
     */
    @oav()
    camera: Camera;

    init()
    {
        super.init();
        watcher.watch(this as BillboardComponent, 'camera', this._onCameraChanged, this);
        this.node3d.emitter.on('updateGlobalMatrix', this._onUpdateLocalToWorldMatrix, this);
        this._invalidHoldSizeMatrix();
    }

    private _onCameraChanged(value: Camera, oldValue: Camera)
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
