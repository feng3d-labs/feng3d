import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { watcher } from '@feng3d/watcher';
import { Camera } from '../cameras/Camera';
import { transformLogic } from '../core/transformLogic';
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
        // TODO: use reactive effect to watch local2world
        this._invalidHoldSizeMatrix();
    }

    private _onCameraChanged(value: Camera, _oldValue: Camera)
    {
        // TODO: use reactive effect to watch local2world
        this._invalidHoldSizeMatrix();
    }

    private _invalidHoldSizeMatrix()
    {
        // TODO: use reactive effect to watch local2world
    }

    private _onUpdateLocalToWorldMatrix()
    {
        const _local2world = this.transform['_local2world'];
        if (_local2world && this.camera)
        {
            const camera = this.camera;
            const cameraPos = transformLogic(camera.transform).worldPosition.value;
            const yAxis = transformLogic(camera.transform).local2world.value.getAxisY();
            _local2world.lookAt(cameraPos, yAxis);
        }
    }

    dispose()
    {
        this.camera = null;
        // TODO: use reactive effect to watch local2world
        super.dispose();
    }
}
