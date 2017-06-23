namespace feng3d
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
        public isPlaying: boolean;

        /**
         * 粒子时间
         */
        public time: number = 0;

        /**
         * 起始时间
         */
        public startTime: number = 0;

        /**
         * 播放速度
         */
        public playbackSpeed: number = 1;

        /**
         * 周期
         */
        public cycle: number = 10000;

        public get animatorSet()
        {
            return this._animatorSet;
        }
        public set animatorSet(value)
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

        constructor()
        {
            super();
            this._single = true;

            this._updateEverytime = true;
            //
            this.createUniformData("u_particleTime", () => this.time);
            //
            this.createBoolMacro("HAS_PARTICLE_ANIMATOR", () => this.isPlaying = true);
        }

        public play()
        {
            if (this.isPlaying)
                return;
            if (!this.animatorSet)
            {
                return;
            }

            this.startTime = getTimer();
            this.isPlaying = true;
            ticker.addEventListener(Event.ENTER_FRAME, this.update, this);
        }

        private update()
        {
            this.time = ((getTimer() - this.startTime) / 1000) % this.cycle;
            this.animatorSet.update(this);
        }

        /**
         * 收集渲染数据拥有者
         * @param renderAtomic 渲染原子
         */
        public collectRenderDataHolder(renderAtomic: Object3DRenderAtomic = null)
        {
            this.animatorSet.collectRenderDataHolder(renderAtomic);
            super.collectRenderDataHolder(renderAtomic);
        }
    }
}