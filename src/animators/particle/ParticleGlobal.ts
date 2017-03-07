module feng3d
{
	/**
	 * 粒子
	 * 粒子系统会自动在shader中匹配一个"a_particle_${attribute}"顶点属性,并且属性值不为空时会自动添加 "#define D_a_particle_${attribute}"
	 * 例如：position 对应 a_particle_position 与 #define D_a_particle_position
	 * @author feng 2017-01-12
	 */
    export interface ParticleGlobal
    {
        /**
         * 加速度
         */
        acceleration: Vector3D;
    }
}