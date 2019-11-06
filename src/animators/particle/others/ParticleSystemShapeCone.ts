namespace feng3d
{
    /**
     * 粒子系统圆锥体发射类型，用于定义基于圆锥体的发射类型。
     */
    export enum ParticleSystemShapeConeEmitFrom
    {
        /**
         * 从圆锥体底面发射。
         */
        Base,
        /**
         * 从圆锥体底面边缘沿着曲面发射。
         */
        BaseShell,
        /**
         * 从圆锥体内部发射。
         */
        Volume,
        /**
         * 从圆锥体曲面沿着曲面发射。
         */
        VolumeShell,
    }

    /**
     * 粒子系统发射圆锥体，用于定义基于圆锥体的粒子发射时的初始状态。
     */
    export class ParticleSystemShapeCone extends ParticleSystemShape
    {
        /**
         * 圆锥体开口角度。
         */
        @serialize
        @oav({ tooltip: "圆锥体开口角度。" })
        angle = 25;

        /**
         * 圆锥体底部半径。
         */
        @serialize
        @oav({ tooltip: "圆锥体底部半径。" })
        radius = 1;

        /**
         * 圆锥体高度。
         */
        @serialize
        @oav({ tooltip: "圆锥体高度。" })
        height = 5;

        /**
         * 在弧线周围产生了新的粒子。
         */
        @serialize
        @oav({ tooltip: "在弧线周围产生了新的粒子。" })
        arc = 360;

        /**
         * 粒子系统圆锥体发射类型。
         */
        @serialize
        @oav({ tooltip: "粒子系统圆锥体发射类型。", component: "OAVEnum", componentParam: { enumClass: ParticleSystemShapeConeEmitFrom } })
        emitFrom = ParticleSystemShapeConeEmitFrom.Base;

        /**
         * 初始化粒子状态
         * @param particle 粒子
         */
        initParticleState(particle: Particle)
        {
            var speed = particle.velocity.length;
            var radius = this.radius;
            var angle = this.angle;
            angle = Math.clamp(angle, 0, 87);

            // 在圆心的放心
            var radiusAngle = Math.random() * Math.degToRad(this.arc);
            // 在圆的位置
            var radiusRate = 1;
            if (this.emitFrom == ParticleSystemShapeConeEmitFrom.Base || this.emitFrom == ParticleSystemShapeConeEmitFrom.Volume)
            {
                radiusRate = Math.random();
            }
            // 在圆的位置
            var basePos = new Vector3(Math.sin(radiusAngle), Math.cos(radiusAngle), 0);
            // 底面位置
            var bottomPos = basePos.scaleNumberTo(radius).scaleNumber(radiusRate);
            // 顶面位置
            var topPos = basePos.scaleNumberTo(radius + this.height * Math.tan(Math.degToRad(angle))).scaleNumber(radiusRate);
            topPos.z = this.height;
            // 计算速度
            particle.velocity.copy(topPos.subTo(bottomPos).normalize(speed));
            // 计算位置
            var position = bottomPos.clone();
            if (this.emitFrom == ParticleSystemShapeConeEmitFrom.Volume || this.emitFrom == ParticleSystemShapeConeEmitFrom.VolumeShell)
            {
                // 上下点进行插值
                position.lerpNumber(topPos, Math.random());
            }
            particle.position.copy(position);
        }
    }
}