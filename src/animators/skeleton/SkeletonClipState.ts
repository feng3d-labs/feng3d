module feng3d
{
	/**
	 * 骨骼剪辑状态
	 * @author feng 2015-9-18
	 */
    export class SkeletonClipState extends AnimationClipState
    {
        private _rootPos: Vector3D = new Vector3D();
        private _frames: SkeletonPose[];
        private _skeletonClipNode: SkeletonClipNode;
        private _skeletonPose: SkeletonPose = new SkeletonPose();
        private _skeletonPoseDirty: boolean = true;
        private _currentPose: SkeletonPose;
        private _nextPose: SkeletonPose;

		/**
		 * 当前骨骼姿势
		 */
        public get currentPose(): SkeletonPose
        {
            if (this._framesDirty)
                this.updateFrames();

            return this._currentPose;
        }

		/**
		 * 下个姿势
		 */
        public get nextPose(): SkeletonPose
        {
            if (this._framesDirty)
                this.updateFrames();

            return this._nextPose;
        }

		/**
		 * 创建骨骼剪辑状态实例
		 * @param animator				动画
		 * @param skeletonClipNode		骨骼剪辑节点
		 */
        constructor(animator: AnimatorBase, skeletonClipNode: SkeletonClipNode)
        {
            super(animator, skeletonClipNode);

            this._skeletonClipNode = skeletonClipNode;
            this._frames = this._skeletonClipNode.frames;
        }

		/**
		 * @inheritDoc
		 */
        public getSkeletonPose(): SkeletonPose
        {
            if (this._skeletonPoseDirty)
                this.updateSkeletonPose();

            return this._skeletonPose;
        }

		/**
		 * @inheritDoc
		 */
        protected updateTime(time: number)
        {
            this._skeletonPoseDirty = true;

            super.updateTime(time);
        }

		/**
		 * @inheritDoc
		 */
        protected updateFrames()
        {
            super.updateFrames();

            this._currentPose = this._frames[this._currentFrame];

            if (this._skeletonClipNode.looping && this._nextFrame >= this._skeletonClipNode.lastFrame)
            {
                this._nextPose = this._frames[0];
            }
            else
                this._nextPose = this._frames[this._nextFrame];
        }

		/**
		 * 更新骨骼姿势
		 * @param skeleton 骨骼
		 */
        private updateSkeletonPose()
        {
            this._skeletonPoseDirty = false;

            if (!this._skeletonClipNode.totalDuration)
                return;

            if (this._framesDirty)
                this.updateFrames();

            var currentPose: JointPose[] = this._currentPose.jointPoses;
            var nextPose: JointPose[] = this._nextPose.jointPoses;
            var numJoints: number = this._currentPose.numJointPoses;
            var p1: Vector3D, p2: Vector3D;
            var pose1: JointPose, pose2: JointPose;
            var showPoses: JointPose[] = this._skeletonPose.jointPoses;
            var showPose: JointPose;
            var tr: Vector3D;

            for (var i: number = 0; i < numJoints; ++i)
            {
                pose1 = currentPose[i];
                pose2 = nextPose[i];
                //
                showPose = showPoses[i];
                if (showPose == null)
                {
                    showPose = showPoses[i] = new JointPose();
                    showPose.name = pose1.name;
                    showPose.parentIndex = pose1.parentIndex;
                }
                p1 = pose1.translation;
                p2 = pose2.translation;

                //根据前后两个关节姿势计算出当前显示关节姿势
                showPose.orientation.lerp(pose1.orientation, pose2.orientation, this._blendWeight);

                //计算显示的关节位置
                if (i > 0)
                {
                    tr = showPose.translation;
                    tr.x = p1.x + this._blendWeight * (p2.x - p1.x);
                    tr.y = p1.y + this._blendWeight * (p2.y - p1.y);
                    tr.z = p1.z + this._blendWeight * (p2.z - p1.z);
                }
                showPose.invalid();
            }
            this._skeletonPose.invalid();
        }

		/**
		 * @inheritDoc
		 */
        protected updatePositionDelta()
        {
            this._positionDeltaDirty = false;

            if (this._framesDirty)
                this.updateFrames();

            var p1: Vector3D, p2: Vector3D, p3: Vector3D;
            var totalDelta: Vector3D = this._skeletonClipNode.totalDelta;

            //跳过最后，重置位置
            if ((this._timeDir > 0 && this._nextFrame < this._oldFrame) || (this._timeDir < 0 && this._nextFrame > this._oldFrame))
            {
                this._rootPos.x -= totalDelta.x * this._timeDir;
                this._rootPos.y -= totalDelta.y * this._timeDir;
                this._rootPos.z -= totalDelta.z * this._timeDir;
            }

            /** 保存骨骼根节点原位置 */
            var dx: number = this._rootPos.x;
            var dy: number = this._rootPos.y;
            var dz: number = this._rootPos.z;

            //计算骨骼根节点位置
            if (this._skeletonClipNode.stitchFinalFrame && this._nextFrame == this._skeletonClipNode.lastFrame)
            {
                p1 = this._frames[0].jointPoses[0].translation;
                p2 = this._frames[1].jointPoses[0].translation;
                p3 = this._currentPose.jointPoses[0].translation;

                this._rootPos.x = p3.x + p1.x + this._blendWeight * (p2.x - p1.x);
                this._rootPos.y = p3.y + p1.y + this._blendWeight * (p2.y - p1.y);
                this._rootPos.z = p3.z + p1.z + this._blendWeight * (p2.z - p1.z);
            }
            else
            {
                p1 = this._currentPose.jointPoses[0].translation;
                p2 = this._frames[this._nextFrame].jointPoses[0].translation; //cover the instances where we wrap the pose but still want the final frame translation values
                this._rootPos.x = p1.x + this._blendWeight * (p2.x - p1.x);
                this._rootPos.y = p1.y + this._blendWeight * (p2.y - p1.y);
                this._rootPos.z = p1.z + this._blendWeight * (p2.z - p1.z);
            }

            //计算骨骼根节点偏移量
            this._rootDelta.x = this._rootPos.x - dx;
            this._rootDelta.y = this._rootPos.y - dy;
            this._rootDelta.z = this._rootPos.z - dz;

            //保存旧帧编号
            this._oldFrame = this._nextFrame;
        }
    }
}
