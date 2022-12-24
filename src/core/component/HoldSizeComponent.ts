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
        HoldSizeComponent: HoldSizeComponent;
    }
}

@AddComponentMenu('Layout/HoldSizeComponent')
@RegisterComponent()
@Serializable()
export class HoldSizeComponent extends Component3D
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
        watcher.watch(this as HoldSizeComponent, 'holdSize', this._invalidateGlobalTransform, this);
        watcher.watch(this as HoldSizeComponent, 'camera', this._onCameraChanged, this);
    }

    init()
    {
        this.node3d.on('updateGlobalMatrix', this._onUpdateLocalToWorldMatrix, this);
    }

    dispose()
    {
        this.camera = null;
        this.node3d.off('updateGlobalMatrix', this._onUpdateLocalToWorldMatrix, this);
        super.dispose();
    }

    private _onCameraChanged(value: Camera, oldValue: Camera)
    {
        if (oldValue) oldValue.off('globalMatrixChanged', this._invalidateGlobalTransform, this);
        if (value) value.on('globalMatrixChanged', this._invalidateGlobalTransform, this);
        this._invalidateGlobalTransform();
    }

    private _invalidateGlobalTransform()
    {
        if (this._entity) this.entity['_invalidateGlobalMatrix']();
    }

    private _onUpdateLocalToWorldMatrix()
    {
        const _globalMatrix = this.entity['_globalMatrix'];
        if (this.holdSize && this.camera && _globalMatrix)
        {
            const depthScale = this._getDepthScale(this.camera);
            const vec = _globalMatrix.toTRS();
            vec[2].scaleNumber(depthScale * this.holdSize);
            _globalMatrix.fromTRS(vec[0], vec[1], vec[2]);

            console.assert(!isNaN(_globalMatrix.elements[0]));
        }
    }

    private _getDepthScale(camera: Camera)
    {
        const cameraGlobalMatrix = camera.node3d.globalMatrix;
        const distance = this.node3d.worldPosition.subTo(cameraGlobalMatrix.getPosition());
        if (distance.length === 0)
        {
            distance.x = 1;
        }
        const depth = distance.dot(cameraGlobalMatrix.getAxisZ());
        let scale = camera.getScaleByDepth(depth);
        // 限制在放大缩小100倍之间，否则容易出现矩阵不可逆问题
        scale = Math.max(Math.min(100, scale), 0.01);

        return scale;
    }
}
