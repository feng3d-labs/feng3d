namespace feng3d
{

    export interface ComponentMap { BillboardComponent: BillboardComponent; }

    export class BillboardComponent extends Component
    {
        __class__: "feng3d.BillboardComponent" = "feng3d.BillboardComponent";

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
            if (this._camera) this._camera.off("scenetransformChanged", this.invalidHoldSizeMatrix, this);
            this._camera = v;
            if (this._camera) this._camera.on("scenetransformChanged", this.invalidHoldSizeMatrix, this);
            this.invalidHoldSizeMatrix();
        }
        private _camera: Camera;

        init()
        {
            super.init();
            this.transform.on("updateLocalToWorldMatrix", this.updateLocalToWorldMatrix, this);
            this.invalidHoldSizeMatrix();
        }

        private invalidHoldSizeMatrix()
        {
            if (this._gameObject) this.transform["_invalidateSceneTransform"]();
        }

        private updateLocalToWorldMatrix()
        {
            var _localToWorldMatrix = this.transform["_localToWorldMatrix"];
            if (_localToWorldMatrix && this.camera)
            {
                var camera = this.camera;
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