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
        HoldSizeComponent: HoldSizeComponent;
    }
}

@AddComponentMenu('Layout/HoldSizeComponent')
@RegisterComponent()
@decoratorRegisterClass()
export class HoldSizeComponent extends Component
{
    __class__: 'HoldSizeComponent';

    /**
     * 保持缩放尺寸
     */
    @oav()
    holdSize = 1;

    /**
     * 相机
     */
    @oav()
    camera: Camera;

    constructor()
    {
        super();
        watcher.watch(this as HoldSizeComponent, 'holdSize', this._invalidateSceneTransform, this);
        watcher.watch(this as HoldSizeComponent, 'camera', this._onCameraChanged, this);
    }

    init()
    {
        // TODO: use reactive effect to watch local2world
    }

    dispose()
    {
        this.camera = null;
        // TODO: use reactive effect to watch local2world
        super.dispose();
    }

    private _onCameraChanged(_value: Camera, _oldValue: Camera)
    {
        // TODO: use reactive effect to watch local2world
        this._invalidateSceneTransform();
    }

    private _invalidateSceneTransform()
    {
        // TODO: use reactive effect to watch local2world
    }

    private _onUpdateLocalToWorldMatrix()
    {
        const _local2world = this.transform['_local2world'];
        if (this.holdSize && this.camera && _local2world)
        {
            const depthScale = this._getDepthScale(this.camera);
            const vec = _local2world.toTRS();
            vec[2].scaleNumber(depthScale * this.holdSize);
            _local2world.fromTRS(vec[0], vec[1], vec[2]);

            console.assert(!isNaN(_local2world.elements[0]));
        }
    }

    private _getDepthScale(camera: Camera)
    {
        const cameraTranform = transformLogic(camera.transform).local2world.value;
        const distance = transformLogic(this.transform).worldPosition.value.subTo(cameraTranform.getPosition());
        if (distance.length === 0)
        {
            distance.x = 1;
        }
        const depth = distance.dot(cameraTranform.getAxisZ());
        let scale = camera.getScaleByDepth(depth);
        // 限制在放大缩小100倍之间，否则容易出现矩阵不可逆问题
        scale = Math.max(Math.min(100, scale), 0.01);

        return scale;
    }
}
