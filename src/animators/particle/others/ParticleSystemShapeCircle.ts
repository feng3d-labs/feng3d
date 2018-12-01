namespace feng3d
{
    /**
     * 粒子系统 发射圆盘
     */
    export class ParticleSystemShapeCircle extends ParticleSystemShape
    {
        @serialize
        @oav({ tooltip: "半径" })
        radius = 1;

        @serialize
        @oav({ tooltip: "弧度" })
        arc = 360;

        /**
         * 初始化粒子状态
         * @param particle 粒子
         */
        initParticleState(particle: Particle)
        {
            var speed = particle.velocity.length;

            // 计算位置
            var angle = Math.random() * FMath.degToRad(this.arc);
            var dir = new Vector3(Math.sin(angle), Math.cos(angle), 0);
            var p = dir.scaleNumberTo(this.radius * Math.random());

            //
            particle.position.copy(p);

            // 计算速度
            particle.velocity.copy(dir).scaleNumber(speed);
        }
    }
}