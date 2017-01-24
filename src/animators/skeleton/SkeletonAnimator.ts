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
        private _forceCPU: boolean;
        private _jointsPerVertex: number;
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
		 * 是否强行使用cpu
		 */
        public get forceCPU(): boolean {
            return this._forceCPU;
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
            this._forceCPU = forceCPU;
            this._jointsPerVertex = animationSet.jointsPerVertex;

            if (this._forceCPU || this._jointsPerVertex > 4)
                this._animationSet.cancelGPUCompatibility();

            animationSet.numJoints = this._skeleton.numJoints;
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

                if (!this._animationSet.hasAnimation(name))
                    throw new Error("Animation root node " + name + " not found!");

                if (transition && this._activeNode) {
                    //setup the transition
                    this._activeNode = transition.getAnimationNode(this, this._activeNode, this._animationSet.getAnimation(name), this._absoluteTime);
                    this._activeNode.addEventListener(AnimationStateEvent.TRANSITION_COMPLETE, this.onTransitionComplete, this);
                }
                else
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
        public setRenderState(renderable, camera: Camera3D) {
            //检查全局变换矩阵
            if (this._globalPropertiesDirty)
                this.updateGlobalProperties();
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
            this.localToGlobalPose(this._activeSkeletonState.getSkeletonPose(this._skeleton), this._globalPose, this._skeleton);

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
        protected localToGlobalPose(sourcePose: SkeletonPose, targetPose: SkeletonPose, skeleton: Skeleton) {
            var globalPoses: JointPose[] = targetPose.jointPoses;
            var globalJointPose: JointPose;
            var joints: SkeletonJoint[] = skeleton.joints;
            var len: number = sourcePose.numJointPoses;
            var jointPoses: JointPose[] = sourcePose.jointPoses;
            var parentIndex: number;
            var joint: SkeletonJoint;
            var parentPose: JointPose;
            var pose: JointPose;
            var or: Quaternion;
            var tr: Vector3D;
            var gTra: Vector3D;
            var gOri: Quaternion;

            var x1: number, y1: number, z1: number, w1: number;
            var x2: number, y2: number, z2: number, w2: number;
            var x3: number, y3: number, z3: number;

            //初始化全局骨骼姿势长度
            if (globalPoses.length != len)
                globalPoses.length = len;

            for (var i: number = 0; i < len; ++i) {
                //初始化单个全局骨骼姿势
                if (globalPoses[i] == null) {
                    globalPoses[i] = new JointPose();
                }
                globalJointPose = globalPoses[i];
                joint = joints[i];
                parentIndex = joint.parentIndex;
                pose = jointPoses[i];

                //
                globalJointPose.invalid();
                //世界方向偏移
                gOri = globalJointPose.orientation;
                //全局位置偏移
                gTra = globalJointPose.translation;

                //计算全局骨骼的 方向偏移与位置偏移
                if (parentIndex < 0) {
                    //处理跟骨骼(直接赋值)
                    tr = pose.translation;
                    or = pose.orientation;
                    gOri.x = or.x;
                    gOri.y = or.y;
                    gOri.z = or.z;
                    gOri.w = or.w;
                    gTra.x = tr.x;
                    gTra.y = tr.y;
                    gTra.z = tr.z;
                }
                else {
                    //处理其他骨骼

                    //找到父骨骼全局姿势
                    parentPose = globalPoses[parentIndex];

                    or = parentPose.orientation;
                    tr = pose.translation;
                    //提取父姿势的世界方向数据
                    x2 = or.x;
                    y2 = or.y;
                    z2 = or.z;
                    w2 = or.w;
                    //提取当前姿势相对父姿势的位置数据
                    x3 = tr.x;
                    y3 = tr.y;
                    z3 = tr.z;

                    //计算当前姿势相对父姿势在全局中的位置偏移方向(有点没搞懂，我只能这么说如果一定要我来计算的话，我一定能做出来)
                    w1 = -x2 * x3 - y2 * y3 - z2 * z3;
                    x1 = w2 * x3 + y2 * z3 - z2 * y3;
                    y1 = w2 * y3 - x2 * z3 + z2 * x3;
                    z1 = w2 * z3 + x2 * y3 - y2 * x3;

                    //计算当前骨骼全局姿势的位置数据（父姿势的世界坐标加上当前姿势相对父姿势转换为全局的坐标变化量）
                    tr = parentPose.translation;
                    gTra.x = -w1 * x2 + x1 * w2 - y1 * z2 + z1 * y2 + tr.x;
                    gTra.y = -w1 * y2 + x1 * z2 + y1 * w2 - z1 * x2 + tr.y;
                    gTra.z = -w1 * z2 - x1 * y2 + y1 * x2 + z1 * w2 + tr.z;

                    //提取父姿势的世界方向数据
                    x1 = or.x;
                    y1 = or.y;
                    z1 = or.z;
                    w1 = or.w;
                    //提取当前姿势相对父姿势的方向数据
                    or = pose.orientation;
                    x2 = or.x;
                    y2 = or.y;
                    z2 = or.z;
                    w2 = or.w;

                    //根据父姿势的世界方向数据与当前姿势的方向数据计算当前姿势的世界方向数据
                    gOri.w = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2;
                    gOri.x = w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2;
                    gOri.y = w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2;
                    gOri.z = w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2;
                }
            }
        }

		/**
		 * 处理动画变换完成时间
		 */
        private onTransitionComplete(event: AnimationStateEvent) {
            if (event.type == AnimationStateEvent.TRANSITION_COMPLETE) {
                event.animationNode.removeEventListener(AnimationStateEvent.TRANSITION_COMPLETE, this.onTransitionComplete, this);
                if (this._activeState == event.animationState) {
                    this._activeNode = this._animationSet.getAnimation(this._activeAnimationName);
                    this._activeState = this.getAnimationState(this._activeNode);
                    this._activeSkeletonState = this._activeState as ISkeletonAnimationState;
                }
            }
        }

    }
}