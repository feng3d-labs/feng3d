namespace feng3d
{
    /**
     * 公告牌粒子组件
     * 开启后粒子将不会收到受到旋转控制，始终面向摄像机
     */
    export class ParticleBillboard extends ParticleComponent
    {
        setRenderState(particleSystem: ParticleSystem, renderAtomic: RenderAtomic)
        {
            super.setRenderState(particleSystem, renderAtomic);

            var cameraMatrix = lazy.getvalue(renderAtomic.uniforms.u_cameraMatrix)
            if (this.enabled && cameraMatrix)
            {
                var gameObject = particleSystem.gameObject;
                var matrix = particleSystem.particleGlobal.billboardMatrix;
                matrix.copyFrom(gameObject.transform.localToWorldMatrix);
                matrix.lookAt(cameraMatrix.position, cameraMatrix.up);
                matrix.position = Vector3.ZERO;
            } else
            {
                particleSystem.particleGlobal.billboardMatrix.identity();
            }
        }
    }
}