module feng3d {

	/**
	 * 骨骼动画集合
	 * @author feng 2014-5-20
	 */
    export class SkeletonAnimationSet extends AnimationSetBase implements IAnimationSet {
        private _jointsPerVertex: number;

        private _numJoints: number;

		/**
		 * 创建一个骨骼动画集合
		 * @param jointsPerVertex 每个顶点关联关节的数量
		 */
        constructor(jointsPerVertex: number = 4) {
            super();
            this._jointsPerVertex = jointsPerVertex;
        }

		/**
		 * 每个顶点关联关节的数量
		 */
        public get jointsPerVertex(): number {
            return this._jointsPerVertex;
        }

		/**
		 * 设置关节数量
		 */
        public set numJoints(value: number) {
            this._numJoints = value;
        }
    }
}
