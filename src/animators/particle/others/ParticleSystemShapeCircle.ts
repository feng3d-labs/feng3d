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
            var speed = particle.startVelocity.length;

            // 计算位置
            var angle = Math.random() * FMath.degToRad(this.arc);
            var dir = new Vector3(Math.sin(angle), Math.cos(angle), 0);
            var p = dir.scaleTo(this.radius * Math.random());

            //
            particle.startPosition.copy(p);

            // 计算速度
            particle.startVelocity.copy(dir).scale(speed);
        }
    }
}