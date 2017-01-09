module feng3d {

	/**
	 * 粒子属性
	 * @author feng 2014-11-13
	 */
    export class ParticleProperties {
		/**
		 * 索引
		 */
        public index: number;

		/**
		 * 粒子总数
		 */
        public total: number;

		/**
		 * 开始时间
		 */
        public startTime: number;

		/**
		 * 持续时间
		 */
        public duration: number;

		/**
		 * 延迟周期
		 */
        public delay: number;
    }
}
