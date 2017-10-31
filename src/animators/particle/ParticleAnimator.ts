module feng3d
{

    /**
     * 粒子动画
     * @author feng 2017-01-09
     */
    export class ParticleAnimator extends Component
    {
        /**
         * 是否正在播放
         */
        @oav()
        get isPlaying()
        {
            return this._isPlaying;
        }
        set isPlaying(value)
        {
            if (this._isPlaying == value)
                return;
            if (this._isPlaying)
            {
                ticker.off("enterFrame", this.update, this);
            }
            this._isPlaying = value;
            if (this._isPlaying)
            {
                this.startTime = Date.now();
                ticker.on("enterFrame", this.update, this);
            }
            //
            this.createBoolMacro("HAS_PARTICLE_ANIMATOR", this._isPlaying);
        }
        private _isPlaying = false;

        /**
         * 粒子时间
         */
        @oav()
        time = 0;

        /**
         * 起始时间
         */
        @oav()
        startTime = 0;

        /**
         * 播放速度
         */
        @oav()
        playbackSpeed = 1;

        /**
         * 周期
         */
        @oav()
        cycle = 10000;

        @oav()
        get animatorSet()
        {
            return this._animatorSet;
        }
        set animatorSet(value)
        {
            if (this._animatorSet == value)
                return;
            if (this._animatorSet)
                this.removeRenderDataHolder(this._animatorSet);
            this._animatorSet = value;
            if (this._animatorSet)
                this.addRenderDataHolder(this._animatorSet);
        }
        private _animatorSet: ParticleAnimationSet;

        get single() { return true; }

        init(gameObject: GameObject)
        {
            super.init(gameObject);

            //
            this.createUniformData("u_particleTime", () => this.time);
        }

        private update()
        {
            this.time = ((Date.now() - this.startTime) / 1000) % this.cycle;
            this.animatorSet.update(this);
        }
    }
}