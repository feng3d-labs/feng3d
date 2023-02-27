import { RegisterComponent } from '../../ecs/Component';
import { oav } from '../../objectview/ObjectView';
import { watcher } from '../../watcher/watcher';
import { Camera3D } from '../cameras/Camera3D';
import { Component3D } from '../core/Component3D';

declare module '../../ecs/Component' { interface ComponentMap { HoldSize3D: HoldSize3D; } }

/**
 * 保持固定缩放尺寸。
 */
@RegisterComponent({ name: 'HoldSize3D', menu: 'Layout/HoldSize3D' })
export class HoldSize3D extends Component3D
{
    declare __class__: 'HoldSize3D';

    /**
     * 保持缩放尺寸
     */
    @oav()
    holdSize = 1;

    /**
     * 相机
     */
    @oav()
    camera: Camera3D;

    init()
    {
        watcher.watch(this as HoldSize3D, 'holdSize', this._invalidateGlobalTransform, this);
        watcher.watch(this as HoldSize3D, 'camera', this._onCameraChanged, this);
        this.entity.emitter.on('updateGlobalMatrix', this._onUpdateLocalToGlobalMatrix, this);
    }

    destroy()
    {
        this.camera = null;
        this.entity.emitter.off('updateGlobalMatrix', this._onUpdateLocalToGlobalMatrix, this);
        super.destroy();
    }

    private _onCameraChanged(value: Camera3D, oldValue: Camera3D)
    {
        if (oldValue) oldValue.emitter.off('globalMatrixChanged', this._invalidateGlobalTransform, this);
        if (value) value.emitter.on('globalMatrixChanged', this._invalidateGlobalTransform, this);
        this._invalidateGlobalTransform();
    }

    private _invalidateGlobalTransform()
    {
        // @ts-ignore
        this.entity._invalidateGlobalMatrix();
    }

    private _onUpdateLocalToGlobalMatrix()
    {
        // @ts-ignore
        const _globalMatrix = this.entity._globalMatrix;
        if (this.holdSize && this.camera && _globalMatrix)
        {
            const depthScale = this._getDepthScale(this.camera);
            const vec = _globalMatrix.toTRS();
            vec[2].scaleNumber(depthScale * this.holdSize);
            _globalMatrix.fromTRS(vec[0], vec[1], vec[2]);

            console.assert(!isNaN(_globalMatrix.elements[0]));
        }
    }

    private _getDepthScale(camera: Camera3D)
    {
        // 计算GPU空间坐标
        const gpuP = camera.project(this.entity.globalPosition);
        // 根据GPU空间坐标深度值计算缩放
        const scale = camera.getScaleByDepth(gpuP.z);

        return scale;
    }
}
