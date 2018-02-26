namespace feng3d
{
    export class ParticleBillboard extends ParticleComponent
    {
        /**
         * 看向的摄像机
         */
        camera: Camera;

        /** 广告牌轴线 */
        billboardAxis: Vector3;

        setRenderState(particleAnimator: ParticleAnimator)
        {
            if (this.camera && this.enable)
            {
                if (this.billboardAxis)
                    this.billboardAxis.normalize();

                var _matrix = new Matrix4x4;
                var gameObject = particleAnimator.gameObject;
                _matrix.copyFrom(gameObject.transform.localToWorldMatrix);
                _matrix.lookAt(this.camera.transform.localToWorldMatrix.position, this.billboardAxis || Vector3.Y_AXIS);
                particleAnimator.particleGlobal.billboardMatrix = _matrix;
            } else
            {
                particleAnimator.particleGlobal.billboardMatrix = new Matrix4x4();
            }
        }
    }
}