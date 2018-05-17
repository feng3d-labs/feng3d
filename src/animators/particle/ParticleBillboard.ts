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

        setRenderState(particleSystem: ParticleSystem)
        {
            if (this.camera && this.enable)
            {
                if (this.billboardAxis)
                    this.billboardAxis.normalize();

                var _matrix = new Matrix4x4;
                var gameObject = particleSystem.gameObject;
                _matrix.copyFrom(gameObject.transform.localToWorldMatrix);
                _matrix.lookAt(this.camera.transform.localToWorldMatrix.position, this.billboardAxis || Vector3.Y_AXIS);
                particleSystem.particleGlobal.billboardMatrix = _matrix;
            } else
            {
                particleSystem.particleGlobal.billboardMatrix = new Matrix4x4();
            }
        }
    }
}