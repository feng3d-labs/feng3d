namespace feng3d
{
    /**
     * 粒子系统 发射边
     */
    export class ParticleSystemShapeEdge extends ParticleSystemShape
    {
        @serialize
        @oav({ tooltip: "边长" })
        length = 1;

        /**
         * 初始化粒子状态
         * @param particle 粒子
         */
        initParticleState(particle: Particle)
        {
            var speed = particle.velocity.length;

            // 计算位置
            var dir = new Vector3(0, 0, 1);

            var p = new Vector3(this.length * (Math.random() * 2 - 1), 0, 0);

            //
            particle.position.copy(p);

            // 计算速度
            particle.velocity.copy(dir).scaleNumber(speed);
        }
    }
}