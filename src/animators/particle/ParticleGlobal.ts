namespace feng3d
{
	/**
	 * 粒子全局属性，作用于所有粒子
	 * 粒子系统会自动在shader中匹配一个"u_particle_${attribute}"uniform数据
     * 例如：position 对应 u_particle_position
	 * @author feng 2017-01-12
	 */
    export class ParticleGlobal
    {
		/**
		 * 位移
		 */
        @oav()
        @serialize
        position = new Vector3();

		/**
		 * 旋转
		 */
        // @oav()
        // @serialize
        // rotation = new Vector3();

		/**
		 * 缩放
		 */
        // @oav()
        // @serialize
        // scale = new Vector3(1, 1, 1);

		/**
		 * 速度
		 */
        @oav()
        @serialize
        velocity = new Vector3();

        /**
         * 加速度
         */
        @oav()
        @serialize
        acceleration = new Vector3();
        
		/**
         * 颜色
		 */
        @oav()
        @serialize
		color = new Color4();

        /**
         * 公告牌矩阵
         */
        // @oav()
        @serialize
        billboardMatrix = new Matrix4x4();
    }
}