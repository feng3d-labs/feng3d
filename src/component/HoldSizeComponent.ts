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
            this.invalidHoldSizeMatrix();
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
            if (!this._camera)
                this._camera.transform.off("scenetransformChanged", this.invalidHoldSizeMatrix);
            this._camera = value;
            if (!this._camera)
                this._camera.transform.on("scenetransformChanged", this.invalidHoldSizeMatrix);
            this.invalidHoldSizeMatrix();
        }

        private _holdSize = 1;
        private _camera: Camera;
        private _holdSizeMatrix: Matrix3D;

        constructor(gameobject: GameObject)
        {
            super(gameobject);
            this.transform.on("scenetransformChanged", this.invalidHoldSizeMatrix);

            this.createUniformData("u_holdSizeMatrix", () => this.holdSizeMatrix);
        }

        private invalidHoldSizeMatrix()
        {
            this._holdSizeMatrix = null;
        }

        private get holdSizeMatrix()
        {
            if (!this.camera)
                throw `请给${this}设置camera属性`;
            var cameraTranform = this.camera.transform.localToWorldMatrix;
            var distance = this.transform.scenePosition.subtract(cameraTranform.position);
            var depth = distance.dotProduct(cameraTranform.forward);
            var scale = this.camera.getScaleByDepth(depth);
            this._holdSizeMatrix = Matrix3D.fromScale(scale * this.holdSize, scale * this.holdSize, scale * this.holdSize);
            return this._holdSizeMatrix;
        }

        dispose()
        {
            this.camera = null;
            this.transform.off("scenetransformChanged", this.invalidHoldSizeMatrix);
            super.dispose();
        }
    }
}