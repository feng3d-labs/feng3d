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
        @watch("onCameraChanged")
        camera: Camera;

        private onCameraChanged(property: string, oldValue: Camera, value: Camera)
        {
            if (oldValue) oldValue.off("scenetransformChanged", this.invalidHoldSizeMatrix, this);
            if (value) value.on("scenetransformChanged", this.invalidHoldSizeMatrix, this);
            this.invalidHoldSizeMatrix();
        }

        init(gameobject: GameObject)
        {
            super.init(gameobject);
            this.transform.on("updateLocalToWorldMatrix", this.updateLocalToWorldMatrix, this);
            this.invalidHoldSizeMatrix();
        }

        private invalidHoldSizeMatrix()
        {
            if (this._gameObject) this.transform["invalidateSceneTransform"]();
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