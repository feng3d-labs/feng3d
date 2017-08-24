var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var feng3d;
(function (feng3d) {
    /**
     * 粒子动画
     * @author feng 2017-01-09
     */
    var ParticleAnimator = (function (_super) {
        __extends(ParticleAnimator, _super);
        function ParticleAnimator(gameObject) {
            var _this = _super.call(this, gameObject) || this;
            /**
             * 粒子时间
             */
            _this.time = 0;
            /**
             * 起始时间
             */
            _this.startTime = 0;
            /**
             * 播放速度
             */
            _this.playbackSpeed = 1;
            /**
             * 周期
             */
            _this.cycle = 10000;
            _this._updateEverytime = true;
            //
            _this.createUniformData("u_particleTime", function () { return _this.time; });
            //
            _this.createBoolMacro("HAS_PARTICLE_ANIMATOR", function () { return _this.isPlaying = true; });
            return _this;
        }
        Object.defineProperty(ParticleAnimator.prototype, "animatorSet", {
            get: function () {
                return this._animatorSet;
            },
            set: function (value) {
                if (this._animatorSet == value)
                    return;
                if (this._animatorSet)
                    this.removeRenderDataHolder(this._animatorSet);
                this._animatorSet = value;
                if (this._animatorSet)
                    this.addRenderDataHolder(this._animatorSet);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ParticleAnimator.prototype, "single", {
            get: function () { return true; },
            enumerable: true,
            configurable: true
        });
        ParticleAnimator.prototype.play = function () {
            if (this.isPlaying)
                return;
            if (!this.animatorSet) {
                return;
            }
            this.startTime = Date.now();
            this.isPlaying = true;
            feng3d.ticker.on("enterFrame", this.update, this);
        };
        ParticleAnimator.prototype.update = function () {
            this.time = ((Date.now() - this.startTime) / 1000) % this.cycle;
            this.animatorSet.update(this);
        };
        /**
         * 收集渲染数据拥有者
         * @param renderAtomic 渲染原子
         */
        ParticleAnimator.prototype.collectRenderDataHolder = function (renderAtomic) {
            if (renderAtomic === void 0) { renderAtomic = null; }
            this.animatorSet.collectRenderDataHolder(renderAtomic);
            _super.prototype.collectRenderDataHolder.call(this, renderAtomic);
        };
        return ParticleAnimator;
    }(feng3d.Component));
    feng3d.ParticleAnimator = ParticleAnimator;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=ParticleAnimator.js.map