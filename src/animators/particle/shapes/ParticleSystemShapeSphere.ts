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
        calcParticlePosDir(particle: Particle)
        {
            // 计算位置
            var dir = Vector3.random().scaleNumber(2).subNumber(1).normalize();

            var p = dir.scaleNumberTo(this.radius);
            if (!this.emitFromShell)
            {
                p.scaleNumber(Math.random());
            }
            return { position: p, dir: dir };
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
         * 计算粒子的发射位置与方向
         * 
         * @param particle 
         * @param position 
         * @param dir 
         */
        calcParticlePosDir(particle: Particle, position: Vector3, dir: Vector3)
        {
            // 计算位置
            dir.copy(Vector3.random()).scaleNumber(2).subNumber(1).normalize();
            dir.z = Math.abs(dir.z);

            position.copy(dir).scaleNumber(this.radius);
            if (!this.emitFromShell)
            {
                position.scaleNumber(Math.random());
            }
        }
    }
}