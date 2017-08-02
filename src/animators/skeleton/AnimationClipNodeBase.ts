namespace feng3d
{
    export interface AnimationStateEventMap
    {
        /**
		 * Dispatched when a non-looping clip node inside an animation state reaches the end of its timeline.
		 */
        playbackComplete: AnimationStateEvent;

        transitionComplete: AnimationStateEvent;
    }

    export interface AnimationClipNodeBase
    {
        once<K extends keyof AnimationStateEventMap>(type: K, listener: (event: AnimationStateEventMap[K]) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof AnimationStateEventMap>(type: K, data?: AnimationStateEventMap[K], bubbles?: boolean);
        has<K extends keyof AnimationStateEventMap>(type: K): boolean;
        on<K extends keyof AnimationStateEventMap>(type: K, listener: (event: AnimationStateEventMap[K]) => any, thisObject?: any, priority?: number, once?: boolean);
        off<K extends keyof AnimationStateEventMap>(type?: K, listener?: (event: AnimationStateEventMap[K]) => any, thisObject?: any);
    }

	/**
	 * 动画剪辑节点基类(用于控制动画播放，包含每帧持续时间，是否循环播放等)
	 * @author feng 2014-5-20
	 */
    export class AnimationClipNodeBase extends AnimationNodeBase
    {
        protected _looping = true;
        protected _totalDuration = 0;
        protected _lastFrame: number;

        protected _stitchDirty = true;
        protected _stitchFinalFrame = false;
        protected _numFrames = 0;

        protected _durations: number[] = [];
        protected _totalDelta: Vector3D = new Vector3D();

        /** 是否稳定帧率 */
        fixedFrameRate = true;

		/**
		 * 持续时间列表（ms）
		 */
        get durations(): number[]
        {
            return this._durations;
        }

		/**
		 * 总坐标偏移量
		 */
        get totalDelta(): Vector3D
        {
            if (this._stitchDirty)
                this.updateStitch();

            return this._totalDelta;
        }

		/**
		 * 是否循环播放
		 */
        get looping(): boolean
        {
            return this._looping;
        }

        set looping(value: boolean)
        {
            if (this._looping == value)
                return;

            this._looping = value;

            this._stitchDirty = true;
        }

		/**
		 * 是否过渡结束帧
		 */
        get stitchFinalFrame(): boolean
        {
            return this._stitchFinalFrame;
        }

        set stitchFinalFrame(value: boolean)
        {
            if (this._stitchFinalFrame == value)
                return;

            this._stitchFinalFrame = value;

            this._stitchDirty = true;
        }

		/**
		 * 总持续时间
		 */
        get totalDuration(): number
        {
            if (this._stitchDirty)
                this.updateStitch();

            return this._totalDuration;
        }

		/**
		 * 最后帧数
		 */
        get lastFrame(): number
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
