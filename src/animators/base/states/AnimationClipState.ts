module feng3d
{
	/**
	 * 动画剪辑状态
	 * @author feng 2015-9-18
	 */
    export class AnimationClipState extends AnimationStateBase
    {
        private _animationClipNode: AnimationClipNodeBase;
        protected _blendWeight: number;
        protected _currentFrame: number = 0;
        protected _nextFrame: number;

        protected _oldFrame: number;
        protected _timeDir: number;
        protected _framesDirty: boolean = true;

		/**
		 * 混合权重	(0[当前帧],1[下一帧])
		 * @see #currentFrame
		 * @see #nextFrame
		 */
        public get blendWeight(): number
        {
            if (this._framesDirty)
                this.updateFrames();

            return this._blendWeight;
        }

		/**
		 * 当前帧
		 */
        public get currentFrame(): number
        {
            if (this._framesDirty)
                this.updateFrames();

            return this._currentFrame;
        }

		/**
		 * 下一帧
		 */
        public get nextFrame(): number
        {
            if (this._framesDirty)
                this.updateFrames();

            return this._nextFrame;
        }

		/**
		 * 创建一个帧动画状态
		 * @param animator				动画
		 * @param animationClipNode		帧动画节点
		 */
        constructor(animator: AnimatorBase, animationClipNode: AnimationClipNodeBase)
        {
            super(animator, animationClipNode);

            this._animationClipNode = animationClipNode;
        }

		/**
		 * @inheritDoc
		 */
        public update(time: number)
        {
            if (!this._animationClipNode.looping)
            {
                if (time > this._startTime + this._animationClipNode.totalDuration)
                    time = this._startTime + this._animationClipNode.totalDuration;
                else if (time < this._startTime)
                    time = this._startTime;
            }

            if (this._time == time - this._startTime)
                return;

            this.updateTime(time);
        }

		/**
		 * @inheritDoc
		 */
        public phase(value: number)
        {
            var time: number = value * this._animationClipNode.totalDuration + this._startTime;

            if (this._time == time - this._startTime)
                return;

            this.updateTime(time);
        }

		/**
		 * @inheritDoc
		 */
        protected updateTime(time: number)
        {
            this._framesDirty = true;

            this._timeDir = (time - this._startTime > this._time) ? 1 : -1;

            super.updateTime(time);
        }

		/**
		 * 更新帧，计算当前帧、下一帧与混合权重
		 *
		 * @see #currentFrame
		 * @see #nextFrame
		 * @see #blendWeight
		 */
        protected updateFrames()
        {
            this._framesDirty = false;

            var looping: boolean = this._animationClipNode.looping;
            var totalDuration: number = this._animationClipNode.totalDuration;
            var lastFrame: number = this._animationClipNode.lastFrame;
            var time: number = this._time;

            //trace("time", time, totalDuration)
            if (looping && (time >= totalDuration || time < 0))
            {
                time %= totalDuration;
                if (time < 0)
                    time += totalDuration;
            }

            if (!looping && time >= totalDuration)
            {
                this.notifyPlaybackComplete();
                this._currentFrame = lastFrame;
                this._nextFrame = lastFrame;
                this._blendWeight = 0;
            }
            else if (!looping && time <= 0)
            {
                this._currentFrame = 0;
                this._nextFrame = 0;
                this._blendWeight = 0;
            }
            else if (this._animationClipNode.fixedFrameRate)
            {
                var t: number = time / totalDuration * lastFrame;
                this._currentFrame = ~~t;
                this._blendWeight = t - this._currentFrame;
                this._nextFrame = this._currentFrame + 1;
            }
            else
            {
                this._currentFrame = 0;
                this._nextFrame = 0;

                var dur: number = 0, frameTime: number;
                var durations: number[] = this._animationClipNode.durations;

                do
                {
                    frameTime = dur;
                    dur += durations[this.nextFrame];
                    this._currentFrame = this._nextFrame++;
                } while (time > dur);

                if (this._currentFrame == lastFrame)
                {
                    this._currentFrame = 0;
                    this._nextFrame = 1;
                }

                this._blendWeight = (time - frameTime) / durations[this._currentFrame];
            }
        }

		/**
		 * 通知播放完成
		 */
        private notifyPlaybackComplete()
        {
            this._animationClipNode.dispatchEvent(new AnimationStateEvent(AnimationStateEvent.PLAYBACK_COMPLETE, this._animator, this, this._animationClipNode));
        }
    }
}
