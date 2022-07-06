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

            position.copy(dir).scaleNumber(this.radius);
            if (!this.emitFromShell)
            {
                position.scaleNumber(Math.random());
            }
        }
    }

}