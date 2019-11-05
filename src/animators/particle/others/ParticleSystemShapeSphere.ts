namespace feng3d
{
    /**
     * 从球体的体积中发射。
     */
    export class ParticleSystemShapeSphere extends ParticleSystemShape
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

            var p = dir.scaleNumberTo(Math.random() * this.radius);

            particle.position.copy(p);

            // 计算速度
            particle.velocity.copy(dir).scaleNumber(speed);
        }
    }

    /**
     * 从半球体的体积中发出。
     */
    export class ParticleSystemShapeHemisphere extends ParticleSystemShape
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
            dir.z = Math.abs(dir.z);

            var p = dir.scaleNumberTo(Math.random() * this.radius);

            particle.position.copy(p);

            // 计算速度
            particle.velocity.copy(dir).scaleNumber(speed);
        }
    }
}