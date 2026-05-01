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
        this.transform.on('updateLocalToWorldMatrix', this._onUpdateLocalToWorldMatrix, this);
    }

    dispose()
    {
        this.camera = null;
        this.transform.off('updateLocalToWorldMatrix', this._onUpdateLocalToWorldMatrix, this);
        super.dispose();
    }

    private _onCameraChanged(value: Camera, oldValue: Camera)
    {
        if (oldValue) oldValue.off('scenetransformChanged', this._invalidateSceneTransform, this);
        if (value) value.on('scenetransformChanged', this._invalidateSceneTransform, this);
        this._invalidateSceneTransform();
    }

    private _invalidateSceneTransform()
    {
        if (this._gameObject) this.transform['_invalidateSceneTransform']();
    }

    private _onUpdateLocalToWorldMatrix()
    {
        const _localToWorldMatrix = this.transform['_localToWorldMatrix'];
        if (this.holdSize && this.camera && _localToWorldMatrix)
        {
            const depthScale = this._getDepthScale(this.camera);
            const vec = _localToWorldMatrix.toTRS();
            vec[2].scaleNumber(depthScale * this.holdSize);
            _localToWorldMatrix.fromTRS(vec[0], vec[1], vec[2]);

            console.assert(!isNaN(_localToWorldMatrix.elements[0]));
        }
    }

    private _getDepthScale(camera: Camera)
    {
        const cameraTranform = camera.transform.localToWorldMatrix;
        const distance = this.transform.worldPosition.subTo(cameraTranform.getPosition());
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
