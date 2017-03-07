module feng3d
{
	/**
	 * 动画剪辑节点基类(用于控制动画播放，包含每帧持续时间，是否循环播放等)
	 * @author feng 2014-5-20
	 */
    export class AnimationClipNodeBase extends AnimationNodeBase
    {
        protected _looping: boolean = true;
        protected _totalDuration: number = 0;
        protected _lastFrame: number;

        protected _stitchDirty: boolean = true;
        protected _stitchFinalFrame: boolean = false;
        protected _numFrames: number = 0;

        protected _durations: number[] = [];
        protected _totalDelta: Vector3D = new Vector3D();

        /** 是否稳定帧率 */
        public fixedFrameRate: boolean = true;

		/**
		 * 持续时间列表（ms）
		 */
        public get durations(): number[]
        {
            return this._durations;
        }

		/**
		 * 总坐标偏移量
		 */
        public get totalDelta(): Vector3D
        {
            if (this._stitchDirty)
                this.updateStitch();

            return this._totalDelta;
        }

		/**
		 * 是否循环播放
		 */
        public get looping(): boolean
        {
            return this._looping;
        }

        public set looping(value: boolean)
        {
            if (this._looping == value)
                return;

            this._looping = value;

            this._stitchDirty = true;
        }

		/**
		 * 是否过渡结束帧
		 */
        public get stitchFinalFrame(): boolean
        {
            return this._stitchFinalFrame;
        }

        public set stitchFinalFrame(value: boolean)
        {
            if (this._stitchFinalFrame == value)
                return;

            this._stitchFinalFrame = value;

            this._stitchDirty = true;
        }

		/**
		 * 总持续时间
		 */
        public get totalDuration(): number
        {
            if (this._stitchDirty)
                this.updateStitch();

            return this._totalDuration;
        }

		/**
		 * 最后帧数
		 */
        public get lastFrame(): number
        {
            if (this._stitchDirty)
                this.updateStitch();

            return this._lastFrame;
        }

		/**
		 * 更新动画播放控制状态
		 */
        protected updateStitch()
        {
            this._stitchDirty = false;

            this._lastFrame = (this._looping && this._stitchFinalFrame) ? this._numFrames : this._numFrames - 1;

            this._totalDuration = 0;
            this._totalDelta.x = 0;
            this._totalDelta.y = 0;
            this._totalDelta.z = 0;
        }
    }
}
