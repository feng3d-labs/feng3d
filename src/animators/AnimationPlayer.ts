namespace feng3d
{
	/**
	 * 动画播放器
	 * @author feng 2017-01-04
	 */
    export class AnimationPlayer
    {
        private _time = 0;
        private preTime = 0;
        private _isPlaying = false;

        /**
         * 播放速度
         */
        playbackSpeed = 1;

        /**
         * 动画时间
         */
        get time()
        {
            return this._time;
        }

        set time(value: number)
        {
            this._time = value;
        }

        /**
         * 开始
         */
        start()
        {
            this.time = 0;
            this.continue();
        }

        /**
         * 停止
         */
        stop()
        {
            this.pause();
        }

        /**
         * 继续
         */
        continue()
        {
            this._isPlaying
            this.preTime = Date.now();
            ticker.on("enterFrame", this.onEnterFrame, this);
        }

        /**
         * 暂停
         */
        pause()
        {
            ticker.off("enterFrame", this.onEnterFrame, this);
        }

        /**
		 * 自动更新动画时帧更新事件
		 */
        private onEnterFrame(event: EventVO)
        {
            var currentTime = Date.now();
            this.time = this.time + (currentTime - this.preTime) * this.playbackSpeed;
            this.preTime = currentTime;
        }
    }
}