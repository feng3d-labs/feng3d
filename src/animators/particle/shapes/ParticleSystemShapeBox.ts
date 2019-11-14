namespace feng3d
{
    export enum ParticleSystemShapeBoxEmitFrom
    {
        /**
         * 从盒子内部发射。
         */
        Volume,
        /**
         * 从盒子外壳发射。
         */
        Shell,
        /**
         * 从盒子边缘发射。
         */
        Edge,
    }

    /**
     * 粒子系统 发射盒子
     */
    export class ParticleSystemShapeBox extends ParticleSystemShape
    {
        /**
         * 盒子X方向缩放。
         */
        @oav({ tooltip: "盒子X方向缩放。" })
        get boxX()
        {
            return this._module.box.x;
        }

        set boxX(v)
        {
            this._module.box.x = v;
        }

        /**
         * 盒子Y方向缩放。
         */
        @oav({ tooltip: "盒子Y方向缩放。" })
        get boxY()
        {
            return this._module.box.y;
        }

        set boxY(v)
        {
            this._module.box.y = v;
        }

        /**
         * 盒子Z方向缩放。
         */
        @oav({ tooltip: "盒子Z方向缩放。" })
        get boxZ()
        {
            return this._module.box.z;
        }

        set boxZ(v)
        {
            this._module.box.z = v;
        }

        /**
         * 粒子系统盒子发射类型。
         */
        @oav({ tooltip: "粒子系统盒子发射类型。", component: "OAVEnum", componentParam: { enumClass: ParticleSystemShapeBoxEmitFrom } })
        emitFrom = ParticleSystemShapeBoxEmitFrom.Volume;

        /**
         * 初始化粒子状态
         * @param particle 粒子
         */
        initParticleState(particle: Particle)
        {
            var speed = particle.velocity.length;

            // 计算位置
            var p = new Vector3(this.boxX, this.boxY, this.boxZ).multiply(Vector3.random().scaleNumber(2).subNumber(1));

            if (this.emitFrom == ParticleSystemShapeBoxEmitFrom.Shell)
            {
                var max = Math.max(Math.abs(p.x), Math.abs(p.y), Math.abs(p.z));
                if (Math.abs(p.x) == max)
                {
                    p.x = p.x < 0 ? -1 : 1;
                } else if (Math.abs(p.y) == max)
                {
                    p.y = p.y < 0 ? -1 : 1;
                } else if (Math.abs(p.z) == max)
                {
                    p.z = p.z < 0 ? -1 : 1;
                }
            } else if (this.emitFrom == ParticleSystemShapeBoxEmitFrom.Edge)
            {
                var min = Math.min(Math.abs(p.x), Math.abs(p.y), Math.abs(p.z));
                if (Math.abs(p.x) == min)
                {
                    p.y = p.y < 0 ? -1 : 1;
                    p.z = p.z < 0 ? -1 : 1;
                } else if (Math.abs(p.y) == min)
                {
                    p.x = p.x < 0 ? -1 : 1;
                    p.z = p.z < 0 ? -1 : 1;
                } else if (Math.abs(p.z) == min)
                {
                    p.x = p.x < 0 ? -1 : 1;
                    p.y = p.y < 0 ? -1 : 1;
                }
            }

            particle.position.copy(p);

            // 计算速度
            var dir = new Vector3(0, 0, 1);
            particle.velocity.copy(dir).scaleNumber(speed);
        }
    }
}