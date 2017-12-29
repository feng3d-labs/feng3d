namespace feng3d
{
    export class BillboardComponent extends Component
    {
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
                this._camera.gameObject.off("scenetransformChanged", this.invalidHoldSizeMatrix, this);
            this._camera = value;
            if (this._camera)
                this._camera.gameObject.on("scenetransformChanged", this.invalidHoldSizeMatrix, this);
            this.invalidHoldSizeMatrix();
        }

        private _holdSize = 1;
        private _camera: Camera | null;

        init(gameobject: GameObject)
        {
            super.init(gameobject);
            this.transform.on("updateLocalToWorldMatrix", this.updateLocalToWorldMatrix, this);
        }

        private invalidHoldSizeMatrix()
        {
            this.transform["invalidateSceneTransform"]();
        }

        private updateLocalToWorldMatrix()
        {
            var _localToWorldMatrix = this.transform["_localToWorldMatrix"];
            if (_localToWorldMatrix && this._camera)
            {
                var camera = this._camera;
                var cameraPos = camera.transform.scenePosition;
                var yAxis = camera.transform.localToWorldMatrix.up;
                _localToWorldMatrix.lookAt(cameraPos, yAxis);
            }
        }

        dispose()
        {
            this.camera = null;
            this.transform.off("updateLocalToWorldMatrix", this.updateLocalToWorldMatrix, this);
            super.dispose();
        }
    }
}