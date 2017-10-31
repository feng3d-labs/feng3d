module feng3d
{
    export class ParticleBillboard extends ParticleComponent
    {
        private _camera: Camera;

        private _matrix: Matrix3D = new Matrix3D;

        /** 广告牌轴线 */
        private _billboardAxis: Vector3D;

		/**
		 * 创建一个广告牌节点
		 * @param billboardAxis
		 */
        constructor(camera: Camera, billboardAxis?: Vector3D)
        {
            super();
            this.billboardAxis = <any>billboardAxis;
            this._camera = camera;
        }

        setRenderState(particleAnimator: ParticleAnimator)
        {
            var gameObject = particleAnimator.gameObject;
            this._matrix.copyFrom(gameObject.transform.localToWorldMatrix);
            this._matrix.lookAt(this._camera.transform.localToWorldMatrix.position, this._billboardAxis || Vector3D.Y_AXIS);
            particleAnimator.animatorSet.setGlobal("billboardMatrix", this._matrix);
        }

		/**
		 * 广告牌轴线
		 */
        get billboardAxis(): Vector3D
        {
            return this._billboardAxis;
        }

        set billboardAxis(value: Vector3D)
        {
            this._billboardAxis = value ? value.clone() : <any>null;
            if (this._billboardAxis)
                this._billboardAxis.normalize();
        }
    }
}