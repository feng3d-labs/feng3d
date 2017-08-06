namespace feng3d
{
    export class HoldSizeComponent extends Component
    {
        /**
         * 保持缩放尺寸
         */
        get holdSize()
        {
            return this._holdSize;
        }
        set holdSize(value)
        {
            if (this._holdSize == value)
                return;
            this._holdSize = value;
            this.invalidateSceneTransform();
        }

        /**
         * 相对
         */
        get camera()
        {
            return this._camera;
        }
        set camera(value)
        {
            if (this._camera == value)
                return;
            if (this._camera)
                this._camera.transform.off("scenetransformChanged", this.invalidateSceneTransform, this);
            this._camera = value;
            if (this._camera)
                this._camera.transform.on("scenetransformChanged", this.invalidateSceneTransform, this);
            this.invalidateSceneTransform();
        }

        private _holdSize = 1;
        private _camera: Camera;

        constructor(gameobject: GameObject)
        {
            super(gameobject);
            this.transform.on("updateLocalToWorldMatrix", this.updateLocalToWorldMatrix, this);
        }

        private invalidateSceneTransform()
        {
            this.transform.invalidateSceneTransform();
        }

        private updateLocalToWorldMatrix()
        {
            var _localToWorldMatrix = this.transform["_localToWorldMatrix"];
            if (this.holdSize && this._camera)
            {
                var depthScale = this.getDepthScale(this._camera);
                var vec = _localToWorldMatrix.decompose();
                vec[2].setTo(depthScale, depthScale, depthScale);
                _localToWorldMatrix.recompose(vec);
            }
        }

        private getDepthScale(camera: Camera)
        {
            var cameraTranform = camera.transform.localToWorldMatrix;
            var distance = this.transform.scenePosition.subtract(cameraTranform.position);
            if (distance.length == 0)
                distance.x = 1;
            var depth = distance.dotProduct(cameraTranform.forward);
            var scale = camera.getScaleByDepth(depth);
            return scale;
        }

        dispose()
        {
            this.camera = null;
            this.transform.off("updateLocalToWorldMatrix", this.updateLocalToWorldMatrix, this);
            super.dispose();
        }
    }
}