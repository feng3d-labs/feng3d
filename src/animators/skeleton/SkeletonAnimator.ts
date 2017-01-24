module feng3d {
	/**
	 * 骨骼动画
	 * @author feng 2014-5-27
	 */
    export class SkeletonAnimator extends AnimatorBase {
        private _globalMatrices: Matrix3D[] = [];
        private _globalPropertiesDirty: boolean;
        private _numJoints: number;

        private _skeleton: Skeleton;
        private _activeSkeletonState: ISkeletonAnimationState;

		/**
		 * 当前骨骼姿势的全局矩阵
		 * @see #globalPose
		 */
        public get globalMatrices(): Matrix3D[] {
            if (this._globalPropertiesDirty)
                this.updateGlobalProperties();

            return this._globalMatrices;
        }

		/**
		 * 骨骼
		 */
        public get skeleton(): Skeleton {
            return this._skeleton;
        }

		/**
		 * 创建一个骨骼动画类
		 * @param animationSet 动画集合
		 * @param skeleton 骨骼
		 * @param forceCPU 是否强行使用cpu
		 */
        constructor(animationSet: SkeletonAnimationSet, skeleton: Skeleton, forceCPU: boolean = false) {
            super(animationSet);

            this._skeleton = skeleton;
            this._numJoints = this._skeleton.numJoints;
        }

		/**
		 * 添加动画
		 * @param node 动画节点
		 */
        public addAnimation(node: AnimationNodeBase) {
            this._animationSet.addAnimation(node);
        }

		/**
		 * 播放动画
		 * @param name 动作名称
		 * @param offset 偏移量
		 */
        public play(name: string, transition: IAnimationTransition = null, offset: number = NaN) {
            if (this._activeAnimationName != name) {
                this._activeAnimationName = name;

                this._activeNode = this._animationSet.getAnimation(name);
                this._activeState = this.getAnimationState(this._activeNode);

                if (this.updatePosition) {
                    //this.update straight away to this.reset position deltas
                    this._activeState.update(this._absoluteTime);
                    this._activeState.positionDelta;
                }

                this._activeSkeletonState = this._activeState as ISkeletonAnimationState;
            }

            this.start();
        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext) {

            super.updateRenderData(renderContext);

            this.renderData.shaderMacro.valueMacros.NUM_SKELETONJOINT = this._numJoints;
            this.renderData.uniforms[RenderDataID.u_skeletonGlobalMatriices] = this.globalMatrices;
        }

		/**
		 * @inheritDoc
		 */
        protected updateDeltaTime(dt: number) {
            super.updateDeltaTime(dt);

            this._globalPropertiesDirty = true;
        }

		/**
		 * 更新骨骼全局变换矩阵
		 */
        private updateGlobalProperties() {
            this._globalPropertiesDirty = false;

            //获取全局骨骼姿势
            var currentSkeletonPose = this._activeSkeletonState.getSkeletonPose();
            var globalMatrix3Ds = currentSkeletonPose.globalMatrix3Ds;

            //姿势变换矩阵
            var joints: SkeletonJoint[] = this._skeleton.joints;

            //遍历每个关节
            for (var i: number = 0; i < this._numJoints; ++i) {

                var inverseMatrix3D: Matrix3D = joints[i].invertMatrix3D;
                var matrix3D: Matrix3D = globalMatrix3Ds[i].clone();
                matrix3D.prepend(inverseMatrix3D);
                this._globalMatrices[i] = matrix3D;
            }
        }
    }
}