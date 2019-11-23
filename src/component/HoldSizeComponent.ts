namespace feng3d
{

    export interface ComponentMap { HoldSizeComponent: HoldSizeComponent; }

    export class HoldSizeComponent extends Component
    {

        __class__: "feng3d.HoldSizeComponent" = "feng3d.HoldSizeComponent";

        /**
         * 保持缩放尺寸
         */
        @oav()
        get holdSize()
        {
            return this._holdSize;
        }
        set holdSize(v)
        {
            if (this._holdSize == v) return;
            this._holdSize = v;
            this.onHoldSizeChanged();
        }
        private _holdSize = 1;

        /**
         * 相机
         */
        @oav()
        get camera()
        {
            return this._camera;
        }
        set camera(v)
        {
            if (this._camera == v) return;
            if (this._camera) this._camera.off("scenetransformChanged", this.invalidateSceneTransform, this);
            this._camera = v;
            if (this._camera) this._camera.on("scenetransformChanged", this.invalidateSceneTransform, this);
            this.invalidateSceneTransform();
        }
        private _camera: Camera;

        init()
        {
            this.transform.on("updateLocalToWorldMatrix", this.updateLocalToWorldMatrix, this);
        }

        dispose()
        {
            this.camera = null;
            this.transform.off("updateLocalToWorldMatrix", this.updateLocalToWorldMatrix, this);
            super.dispose();
        }

        private onHoldSizeChanged()
        {
            this.invalidateSceneTransform();
        }

        private invalidateSceneTransform()
        {
            if (this._gameObject) this.transform["invalidateSceneTransform"]();
        }

        private updateLocalToWorldMatrix()
        {
            var _localToWorldMatrix = this.transform["_localToWorldMatrix"];
            if (this.holdSize && this.camera && _localToWorldMatrix)
            {
                var depthScale = this.getDepthScale(this.camera);
                var vec = _localToWorldMatrix.decompose();
                vec[2].scaleNumber(depthScale * this.holdSize);
                _localToWorldMatrix.recompose(vec[0], vec[1], vec[2]);

                debuger && console.assert(!isNaN(_localToWorldMatrix.rawData[0]));
            }
        }

        private getDepthScale(camera: Camera)
        {
            var cameraTranform = camera.transform.localToWorldMatrix;
            var distance = this.transform.scenePosition.subTo(cameraTranform.position);
            if (distance.length == 0)
                distance.x = 1;
            var depth = distance.dot(cameraTranform.forward);
            var scale = camera.getScaleByDepth(depth);
            //限制在放大缩小100倍之间，否则容易出现矩阵不可逆问题
            scale = Math.max(Math.min(100, scale), 0.01);
            return scale;
        }
    }
}