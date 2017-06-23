module feng3d
{
    export class ParticleBillboard extends ParticleComponent
    {

        private _matrix: Matrix3D = new Matrix3D;

        /** 广告牌轴线 */
        private _billboardAxis: Vector3D;

		/**
		 * 创建一个广告牌节点
		 * @param billboardAxis
		 */
        constructor(billboardAxis: Vector3D = null)
        {
            super();
            this.billboardAxis = billboardAxis;
        }

        public setRenderState(particleGlobal: ParticleGlobal, gameObject: GameObject, renderContext: RenderContext)
        {
            var comps: Vector3D[];
            if (this._billboardAxis)
            {
                var pos: Vector3D = gameObject.sceneTransform.position;
                var look: Vector3D = renderContext.camera.sceneTransform.position.subtract(pos);
                var right: Vector3D = look.crossProduct(this._billboardAxis);
                right.normalize();
                look = this._billboardAxis.crossProduct(right);
                look.normalize();

                //create a quick inverse projection matrix
                this._matrix.copyFrom(gameObject.sceneTransform);
                comps = this._matrix.decompose(Orientation3D.AXIS_ANGLE);
                this._matrix.copyColumnFrom(0, right);
                this._matrix.copyColumnFrom(1, this._billboardAxis);
                this._matrix.copyColumnFrom(2, look);
                this._matrix.copyColumnFrom(3, pos);
                this._matrix.appendRotation(-comps[1].w * MathConsts.RADIANS_TO_DEGREES, comps[1]);
            }
            else
            {
                //create a quick inverse projection matrix
                this._matrix.copyFrom(gameObject.sceneTransform);
                this._matrix.append(renderContext.camera.inverseSceneTransform);

                //decompose using axis angle rotations
                comps = this._matrix.decompose(Orientation3D.AXIS_ANGLE);

                //recreate the matrix with just the rotation data
                this._matrix.identity();
                this._matrix.appendRotation(-comps[1].w * MathConsts.RADIANS_TO_DEGREES, comps[1]);
            }
            particleGlobal.billboardMatrix = this._matrix;
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