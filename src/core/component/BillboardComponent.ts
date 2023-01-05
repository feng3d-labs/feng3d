import { oav } from '../../objectview/ObjectView';
import { Serializable } from '../../serialization/Serializable';
import { watcher } from '../../watcher/watcher';
import { Camera } from '../cameras/Camera';
import { AddComponentMenu } from '../Menu';
import { Component, RegisterComponent } from '../../ecs/Component';
import { Component3D } from '../core/Component3D';

declare global
{
    export interface MixinsComponentMap
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

    constructor()
    {
        super();
        watcher.watch(this as BillboardComponent, 'camera', this._onCameraChanged, this);
    }

    init()
    {
        super.init();
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
