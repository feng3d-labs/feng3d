namespace feng3d
{
    export class ParticleBillboard extends ParticleComponent
    {
        private _camera:Camera;

        private _matrix: Matrix3D = new Matrix3D;

        /** 广告牌轴线 */
        private _billboardAxis: Vector3D;

		/**
		 * 创建一个广告牌节点
		 * @param billboardAxis
		 */
        constructor(camera:Camera,billboardAxis: Vector3D = null)
        {
            super();
            this.billboardAxis = billboardAxis;
            this._camera = camera;
        }

        public setRenderState(particleAnimator: ParticleAnimator)
        {
            var gameObject = particleAnimator.gameObject;
            var comps: Vector3D[];
            if (this._billboardAxis)
            {
                var pos: Vector3D = gameObject.transform.localToWorldMatrix.position;
                var look: Vector3D = this._camera.sceneTransform.position.subtract(pos);
                var right: Vector3D = look.crossProduct(this._billboardAxis);
                right.normalize();
                look = this._billboardAxis.crossProduct(right);
                look.normalize();

                //create a quick inverse projection matrix
                this._matrix.copyFrom(gameObject.transform.localToWorldMatrix);
                comps = this._matrix.decompose(Orientation3D.AXIS_ANGLE);
                this._matrix.copyColumnFrom(0, right);
                this._matrix.copyColumnFrom(1, this._billboardAxis);
                this._matrix.copyColumnFrom(2, look);
                this._matrix.copyColumnFrom(3, pos);
                this._matrix.appendRotation(-comps[1].w * Math.RAD2DEG, comps[1]);
            }
            else
            {
                //create a quick inverse projection matrix
                this._matrix.copyFrom(gameObject.transform.localToWorldMatrix);
                this._matrix.append(this._camera.inverseSceneTransform);

                //decompose using axis angle rotations
                comps = this._matrix.decompose(Orientation3D.AXIS_ANGLE);

                //recreate the matrix with just the rotation data
                this._matrix.identity();
                this._matrix.appendRotation(-comps[1].w * Math.RAD2DEG, comps[1]);
            }
            particleAnimator.animatorSet.setGlobal("billboardMatrix",this._matrix);
        }

		/**
		 * 广告牌轴线
		 */
        public get billboardAxis(): Vector3D
        {
            return this._billboardAxis;
        }

        public set billboardAxis(value: Vector3D)
        {
            this._billboardAxis = value ? value.clone() : null;
            if (this._billboardAxis)
                this._billboardAxis.normalize();
        }
    }
}