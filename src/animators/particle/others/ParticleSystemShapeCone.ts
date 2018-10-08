namespace feng3d
{
    /**
     * 粒子系统 发射圆锥体
     */
    export class ParticleSystemShapeCone extends ParticleSystemShape
    {
        @oav({ tooltip: "圆锥体开口角度。" })
        angle = 25;

        @oav({ tooltip: "圆锥体底部半径。" })
        radius = 1;

        @oav({ tooltip: "圆锥体高度" })
        height = 5;

        @oav({ tooltip: "在弧线周围产生了新的粒子。" })
        arc = 360;

        /**
         * 初始化粒子状态
         * @param particle 粒子
         */
        initParticleState(particle: Particle)
        {
            // 计算位置
            var angle = Math.random() * FMath.degToRad(this.arc);
            var r = Math.random();
            var p = new Vector3(Math.sin(angle), 0, Math.cos(angle));
            particle.position.copy(p).scale(this.radius).scale(r);

            // 计算速度
            p.scale(this.radius + this.height * Math.tan(FMath.degToRad(this.angle))).scale(r);
            p.y = this.height;
            var dir = p.sub(particle.position).normalize();
            particle.velocity.copy(dir).scale(particle.startSpeed);
        }
    }
}