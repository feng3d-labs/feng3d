namespace feng3d
{
    /**
     * 粒子系统 发射盒子
     */
    export class ParticleSystemShapeBox extends ParticleSystemShape
    {
        @serialize
        @oav({ tooltip: "盒子X方向宽度。" })
        boxX = 1;

        @serialize
        @oav({ tooltip: "盒子Y方向宽度。" })
        boxY = 1;

        @serialize
        @oav({ tooltip: "盒子Z方向宽度。" })
        boxZ = 1;

        /**
         * 初始化粒子状态
         * @param particle 粒子
         */
        initParticleState(particle: Particle)
        {
            var speed = particle.velocity.length;

            // 计算位置
            var dir = new Vector3(0, 0, 1);

            var p = new Vector3(this.boxX, this.boxY, this.boxZ).multiply(Vector3.random().scaleNumber(2).subNumber(1));

            particle.position.copy(p);

            // 计算速度
            particle.velocity.copy(dir).scaleNumber(speed);
        }
    }
}