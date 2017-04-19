module feng3d
{
	/**
	 * 动画播放器
	 * @author feng 2017-01-04
	 */
    export class AnimationPlayer
    {
        private _time: number = 0;
        private preTime: number = 0;
        private _isPlaying = false;

        /**
         * 播放速度
         */
        public playbackSpeed = 1;

        /**
         * 动画时间
         */
        public get time()
        {
            return this._time;
        }

        public set time(value: number)
        {
            this._time = value;
        }

        /**
         * 开始
         */
        public start()
        {
            this.time = 0;
            this.continue();
        }

        /**
         * 停止
         */
        public stop()
        {
            this.pause();
        }

        /**
         * 继续
         */
        public continue()
        {
            this._isPlaying
            this.preTime = getTimer();
            ticker.addEventListener(Event.ENTER_FRAME, this.onEnterFrame, this);
        }

        /**
         * 暂停
         */
        public pause()
        {
            ticker.removeEventListener(Event.ENTER_FRAME, this.onEnterFrame, this);
        }

        /**
		 * 自动更新动画时帧更新事件
		 */
        private onEnterFrame(event: Event)
        {
            var currentTime = getTimer();
            this.time = this.time + (currentTime - this.preTime) * this.playbackSpeed;
            this.preTime = getTimer();
        }
    }
}