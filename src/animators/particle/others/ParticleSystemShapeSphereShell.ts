namespace feng3d
{
    /**
     * 从球体表面发射。
     */
    export class ParticleSystemShapeSphereShell extends ParticleSystemShape
    {
        @serialize
        @oav({ tooltip: "球体半径" })
        radius = 1;

        /**
         * 初始化粒子状态
         * @param particle 粒子
         */
        initParticleState(particle: Particle)
        {
            var speed = particle.velocity.length;

            // 计算位置
            var dir = Vector3.random().scaleNumber(2).subNumber(1).normalize();

            var p = dir.scaleNumberTo(this.radius);

            particle.position.copy(p);

            // 计算速度
            particle.velocity.copy(dir).scaleNumber(speed);
        }
    }
}