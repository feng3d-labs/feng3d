module feng3d {
	/**
	 * 骨骼动画
	 * @author feng 2014-5-27
	 */
    export class SkeletonAnimator extends AnimatorBase {
        private _globalMatrices: Matrix3D[] = [];
        private _globalPose: SkeletonPose = new SkeletonPose();
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
		 * 当前全局骨骼姿势
		 */
        public get globalPose(): SkeletonPose {
            if (this._globalPropertiesDirty)
                this.updateGlobalProperties();

            return this._globalPose;
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

            //使用时间偏移量处理特殊情况
            if (!isNaN(offset))
                this.reset(name, offset);
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
            this.localToGlobalPose(this._activeSkeletonState.getSkeletonPose(this._skeleton), this._globalPose);

            //姿势变换矩阵
            var globalPoses: JointPose[] = this._globalPose.jointPoses;
            var joints: SkeletonJoint[] = this._skeleton.joints;
            var pose: JointPose;

            //遍历每个关节
            for (var i: number = 0; i < this._numJoints; ++i) {
                //读取关节全局姿势数据
                pose = globalPoses[i];

                var inverseMatrix3D: Matrix3D = joints[i].invertMatrix3D;
                var matrix3D: Matrix3D = pose.matrix3D.clone();
                matrix3D.prepend(inverseMatrix3D);
                this._globalMatrices[i] = matrix3D;
            }
        }

		/**
		 * 本地转换到全局姿势
		 * @param sourcePose 原姿势
		 * @param targetPose 目标姿势
		 * @param skeleton 骨骼
		 */
        protected localToGlobalPose(sourcePose: SkeletonPose, targetPose: SkeletonPose) {
            var globalPoses: JointPose[] = targetPose.jointPoses;
            var globalJointPose: JointPose;
            var len: number = sourcePose.numJointPoses;
            var jointPoses: JointPose[] = sourcePose.jointPoses;
            var parentPose: JointPose;
            var pose: JointPose;

            for (var i: number = 0; i < len; ++i) {
                //初始化单个全局骨骼姿势
                if (globalPoses[i] == null) {
                    globalPoses[i] = new JointPose();
                }
                globalJointPose = globalPoses[i];
                pose = jointPoses[i];

                //计算全局骨骼的 方向偏移与位置偏移
                if (pose.parentIndex < 0) {

                    globalJointPose.matrix3D = pose.matrix3D.clone();
                }
                else {
                    //找到父骨骼全局姿势
                    parentPose = globalPoses[pose.parentIndex];

                    var globalMatrix3D = pose.matrix3D.clone();
                    globalMatrix3D.append(parentPose.matrix3D);
                    globalJointPose.matrix3D = globalMatrix3D;
                }
            }
        }
    }
}