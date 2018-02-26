namespace feng3d
{
    export class HoldSizeComponent extends Component
    {
        /**
         * 保持缩放尺寸
         */
        @oav()
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
        @oav()
        get camera()
        {
            return this._camera;
        }
        set camera(value)
        {
            if (this._camera == value)
                return;
            if (this._camera)
                this._camera.gameObject.off("scenetransformChanged", this.invalidateSceneTransform, this);
            this._camera = value;
            if (this._camera)
                this._camera.gameObject.on("scenetransformChanged", this.invalidateSceneTransform, this);
            this.invalidateSceneTransform();
        }

        private _holdSize = 1;
        private _camera: Camera | null;

        init(gameobject: GameObject)
        {
            super.init(gameobject);
            this.transform.on("updateLocalToWorldMatrix", this.updateLocalToWorldMatrix, this);
        }

        private invalidateSceneTransform()
        {
            this.transform["invalidateSceneTransform"]();
        }

        private updateLocalToWorldMatrix()
        {
            var _localToWorldMatrix = this.transform["_localToWorldMatrix"];
            if (this.holdSize && this._camera && _localToWorldMatrix)
            {
                var depthScale = this.getDepthScale(this._camera);
                var vec = _localToWorldMatrix.decompose();
                vec[2].scale(depthScale);
                _localToWorldMatrix.recompose(vec);
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

        dispose()
        {
            this.camera = null;
            this.transform.off("updateLocalToWorldMatrix", this.updateLocalToWorldMatrix, this);
            super.dispose();
        }
    }
}