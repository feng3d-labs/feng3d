namespace feng3d
{
    /**
     * 从球体的体积中发射。
     */
    export class ParticleSystemShapeSphere extends ParticleSystemShape
    {
        /**
         * 球体半径
         */
        @oav({ tooltip: "球体半径" })
        get radius()
        {
            return this._module.radius;
        }

        set radius(v)
        {
            this._module.radius = v;
        }

        /**
         * 是否从球面发射
         */
        @oav({ tooltip: "是否从球面发射" })
        emitFromShell = false;

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
            if (!this.emitFromShell)
            {
                p.scaleNumber(Math.random());
            }

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
        @oav({ tooltip: "球体半径" })
        radius = 1;

        /**
         * 是否从球面发射
         */
        @oav({ tooltip: "是否从球面发射" })
        emitFromShell = false;

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

            var p = dir.scaleNumberTo(this.radius);
            if (!this.emitFromShell)
            {
                p.scaleNumber(Math.random());
            }
            particle.position.copy(p);

            // 计算速度
            particle.velocity.copy(dir).scaleNumber(speed);
        }
    }
}