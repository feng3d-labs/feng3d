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
        isPlaying: boolean;

        /**
         * 粒子时间
         */
        time = 0;

        /**
         * 起始时间
         */
        startTime = 0;

        /**
         * 播放速度
         */
        playbackSpeed = 1;

        /**
         * 周期
         */
        cycle = 10000;

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

        constructor(gameObject: GameObject)
        {
            super(gameObject);

            this._updateEverytime = true;
            //
            this.createUniformData("u_particleTime", () => this.time);
            //
            this.createBoolMacro("HAS_PARTICLE_ANIMATOR", () => this.isPlaying = true);
        }

        play()
        {
            if (this.isPlaying)
                return;
            if (!this.animatorSet)
            {
                return;
            }

            this.startTime = Date.now();
            this.isPlaying = true;
            ticker.on("enterFrame", this.update, this);
        }

        private update()
        {
            this.time = ((Date.now() - this.startTime) / 1000) % this.cycle;
            this.animatorSet.update(this);
        }

        /**
         * 收集渲染数据拥有者
         * @param renderAtomic 渲染原子
         */
        collectRenderDataHolder(renderAtomic: Object3DRenderAtomic = null)
        {
            this.animatorSet.collectRenderDataHolder(renderAtomic);
            super.collectRenderDataHolder(renderAtomic);
        }
    }
}