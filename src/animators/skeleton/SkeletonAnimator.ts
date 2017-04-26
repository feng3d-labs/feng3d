module feng3d
{
	/**
	 * 骨骼动画
	 * @author feng 2014-5-27
	 */
    export class SkeletonAnimator extends AnimatorBase
    {
        /** 动画节点列表 */
        public animations: AnimationNodeBase[] = [];
		/**
		 * 骨骼
		 */
        public skeleton: Skeleton;

        private _globalMatrices: Matrix3D[] = [];
        private _globalPropertiesDirty: boolean = true;

        private _activeSkeletonState: SkeletonClipState;

		/**
		 * 当前骨骼姿势的全局矩阵
		 * @see #globalPose
		 */
        public get globalMatrices(): Matrix3D[]
        {
            if (this._globalPropertiesDirty)
                this.updateGlobalProperties();

            return this._globalMatrices;
        }

		/**
		 * 创建一个骨骼动画类
		 */
        constructor(skeleton: Skeleton)
        {
            super();

            this.skeleton = skeleton;
        }

		/**
		 * 播放动画
		 * @param name 动作名称
		 */
        public play()
        {
            if (!this._activeNode)
                this._activeNode = this.animations[0];
            this._activeState = this.getAnimationState(this._activeNode);

            if (this.updatePosition)
            {
                //this.update straight away to this.reset position deltas
                this._activeState.update(this._absoluteTime);
                this._activeState.positionDelta;
            }

            this._activeSkeletonState = <SkeletonClipState>this._activeState;

            this.start();
        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext, renderData: RenderAtomic)
        {
            if (this._activeSkeletonState)
            {
                renderData.shaderMacro.valueMacros.NUM_SKELETONJOINT = this.skeleton.numJoints;
                renderData.uniforms[RenderDataID.u_skeletonGlobalMatriices] = this.globalMatrices;
                renderData.shaderMacro.boolMacros.HAS_SKELETON_ANIMATION = true;
                super.updateRenderData(renderContext, renderData);
            } else
            {
                renderData.shaderMacro.boolMacros.HAS_SKELETON_ANIMATION = false;
            }
        }

		/**
		 * @inheritDoc
		 */
        protected updateDeltaTime(dt: number)
        {
            super.updateDeltaTime(dt);

            this._globalPropertiesDirty = true;

            this.invalidateRenderData();
        }

		/**
		 * 更新骨骼全局变换矩阵
		 */
        private updateGlobalProperties()
        {
            this._globalPropertiesDirty = false;

            //获取全局骨骼姿势
            var currentSkeletonPose = this._activeSkeletonState.getSkeletonPose();
            var globalMatrix3Ds = currentSkeletonPose.globalMatrix3Ds;

            //姿势变换矩阵
            var joints: SkeletonJoint[] = this.skeleton.joints;

            //遍历每个关节
            for (var i: number = 0; i < this.skeleton.numJoints; ++i)
            {
                var inverseMatrix3D: Matrix3D = joints[i].invertMatrix3D;
                var matrix3D: Matrix3D = globalMatrix3Ds[i].clone();
                matrix3D.prepend(inverseMatrix3D);
                this._globalMatrices[i] = matrix3D;
            }
        }
    }
}