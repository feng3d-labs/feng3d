module feng3d {

	/**
	 * 骨骼动画节点（一般用于一个动画的帧列表）
	 * 包含基于时间的动画数据作为单独的骨架构成。
	 * @author feng 2014-5-20
	 */
    export class SkeletonClipNode extends AnimationClipNodeBase {
        private _frames: SkeletonPose[] = [];

		/**
		 * 创建骨骼动画节点
		 */
        constructor() {
            super();
            this._stateClass = SkeletonClipState;
        }

		/**
		 * 骨骼姿势动画帧列表
		 */
        public get frames(): SkeletonPose[] {
            return this._frames;
        }

		/**
		 * 添加帧到动画
		 * @param skeletonPose 骨骼姿势
		 * @param duration 持续时间
		 */
        public addFrame(skeletonPose: SkeletonPose, duration: number) {
            this._frames.push(skeletonPose);
            this._durations.push(duration);
            this._totalDuration += duration;

            this._numFrames = this._durations.length;

            this._stitchDirty = true;
        }

		/**
		 * @inheritDoc
		 */
        protected updateStitch() {
            super.updateStitch();

            var i: number = this._numFrames - 1;
            var p1: Vector3D, p2: Vector3D, delta: Vector3D;
            while (i--) {
                this._totalDuration += this._durations[i];
                p1 = this._frames[i].jointPoses[0].translation;
                p2 = this._frames[i + 1].jointPoses[0].translation;
                delta = p2.subtract(p1);
                this._totalDelta.x += delta.x;
                this._totalDelta.y += delta.y;
                this._totalDelta.z += delta.z;
            }

            if (this._stitchFinalFrame && this._looping) {
                this._totalDuration += this._durations[this._numFrames - 1];
                if (this._numFrames > 1) {
                    p1 = this._frames[0].jointPoses[0].translation;
                    p2 = this._frames[1].jointPoses[0].translation;
                    delta = p2.subtract(p1);
                    this._totalDelta.x += delta.x;
                    this._totalDelta.y += delta.y;
                    this._totalDelta.z += delta.z;
                }
            }
        }
    }
}
