import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { watcher } from '@feng3d/watcher';
import { Camera } from '../cameras/Camera';
import { AddComponentMenu } from '../Menu';
import { Component, RegisterComponent } from './Component';

declare global
{
    export interface MixinsComponentMap
    {
        BillboardComponent: BillboardComponent;
    }
}

@AddComponentMenu('Layout/BillboardComponent')
@RegisterComponent()
@decoratorRegisterClass()
export class BillboardComponent extends Component
{
    __class__: 'BillboardComponent';

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
        this.transform.on('updateLocalToWorldMatrix', this._onUpdateLocalToWorldMatrix, this);
        this._invalidHoldSizeMatrix();
    }

    private _onCameraChanged(value: Camera, oldValue: Camera)
    {
        if (oldValue) oldValue.off('scenetransformChanged', this._invalidHoldSizeMatrix, this);
        if (value) value.on('scenetransformChanged', this._invalidHoldSizeMatrix, this);
        this._invalidHoldSizeMatrix();
    }

    private _invalidHoldSizeMatrix()
    {
        if (this._gameObject) this.transform['_invalidateSceneTransform']();
    }

    private _onUpdateLocalToWorldMatrix()
    {
        const _localToWorldMatrix = this.transform['_localToWorldMatrix'];
        if (_localToWorldMatrix && this.camera)
        {
            const camera = this.camera;
            const cameraPos = camera.transform.worldPosition;
            const yAxis = camera.transform.localToWorldMatrix.getAxisY();
            _localToWorldMatrix.lookAt(cameraPos, yAxis);
        }
    }

    dispose()
    {
        this.camera = null;
        this.transform.off('updateLocalToWorldMatrix', this._onUpdateLocalToWorldMatrix, this);
        super.dispose();
    }
}
