namespace feng3d
{
    /**
     * The animation type.
     * 动画类型。
     */
    export enum ParticleSystemAnimationType
    {
        /**
         * Animate over the whole texture sheet from left to right, top to bottom.
         * 从左到右，从上到下动画整个纹理表。
         */
        WholeSheet,
        /**
         * Animate a single row in the sheet from left to right.
         * 从左到右移动工作表中的一行。
         */
        SingleRow,
    }

    /**
     * A flag representing each UV channel.
     * 一个代表每个紫外线频道的旗子。
     */
    export enum UVChannelFlags
    {
        /**
         * 无通道。
         */
        Nothing = 0,
        /**
         * First UV channel.
         * 第一UV通道。
         */
        UV0 = 1,
        /**
         * Second UV channel.
         * 第二UV通道。
         */
        UV1 = 2,
        /**
         * Third UV channel.
         * 第三UV通道。
         */
        UV2 = 4,
        /**
         * Fourth UV channel.
         * 第四UV通道。
         */
        UV3 = 8,
        /**
         * All channel.
         * 所有通道。
         */
        Everything = UV0 | UV1 | UV2 | UV3,
    }

    /**
     * 粒子系统纹理表动画模块。
     */
    export class ParticleTextureSheetAnimationModule extends ParticleModule
    {
        /**
         * Defines the tiling of the texture.
         * 定义纹理的平铺。
         */
        @serialize
        // @oav({ tooltip: "Defines the tiling of the texture." })
        @oav({ tooltip: "定义纹理的平铺。" })
        tiles = new Vector2(1, 1);

        /**
         * Specifies the animation type.
         */
        @serialize
        // @oav({ tooltip: "Specifies the animation type." })
        @oav({ tooltip: "指定动画类型。", component: "OAVEnum", componentParam: { enumClass: ParticleSystemAnimationType } })
        animation = ParticleSystemAnimationType.WholeSheet;

        /**
         * Curve to control which frame of the texture sheet animation to play.
         * 曲线控制哪个帧的纹理表动画播放。
         */
        @serialize
        // @oav({ tooltip: "Curve to control which frame of the texture sheet animation to play." })
        @oav({ tooltip: "曲线控制哪个帧的纹理表动画播放。" })
        frameOverTime = serialization.setValue(new MinMaxCurve(), { mode: MinMaxCurveMode.Curve, curve: { keys: [{ time: 0, value: 0, tangent: 1 }, { time: 1, value: 1, tangent: 1 }] } });

        /**
         * Use a random row of the texture sheet for each particle emitted.
         * 对每个发射的粒子使用纹理表的随机行。
         */
        @serialize
        // @oav({ tooltip: "Use a random row of the texture sheet for each particle emitted." })
        @oav({ tooltip: "对每个发射的粒子使用纹理表的随机行。" })
        useRandomRow = true;

        /**
         * Explicitly select which row of the texture sheet is used, when useRandomRow is set to false.
         * 当useRandomRow设置为false时，显式选择使用纹理表的哪一行。
         */
        @serialize
        // @oav({ tooltip: "Explicitly select which row of the texture sheet is used, when useRandomRow is set to false." })
        @oav({ tooltip: "当useRandomRow设置为false时，显式选择使用纹理表的哪一行。" })
        get rowIndex() { return this._rowIndex; }
        set rowIndex(v)
        {
            this._rowIndex = Math.clamp(v, 0, this.tiles.y - 1);
        }
        private _rowIndex = 0;

        /**
         * Define a random starting frame for the texture sheet animation.
         * 为纹理表动画定义一个随机的起始帧。
         */
        @serialize
        // @oav({ tooltip: "Define a random starting frame for the texture sheet animation." })
        @oav({ tooltip: "为纹理表动画定义一个随机的起始帧。" })
        startFrame = 0;

        /**
         * Specifies how many times the animation will loop during the lifetime of the particle.
         * 指定在粒子的生命周期内动画将循环多少次。
         */
        @serialize
        // @oav({ tooltip: "Specifies how many times the animation will loop during the lifetime of the particle." })
        @oav({ tooltip: "指定在粒子的生命周期内动画将循环多少次。" })
        cycleCount = 1;

        /**
         * Flip the UV coordinate on particles, causing them to appear mirrored.
         * 在粒子上翻转UV坐标，使它们呈现镜像翻转。
         */
        @serialize
        // @oav({ tooltip: "Flip the UV coordinate on particles, causing them to appear mirrored." })
        @oav({ tooltip: "在粒子上翻转UV坐标，使它们呈现镜像翻转。" })
        flipUV = new Vector2();

        /**
         * Choose which UV channels will receive texture animation.
         * 选择哪个UV通道将接收纹理动画。
         * 
         * todo 目前引擎中只有一套UV
         */
        @serialize
        // @oav({ tooltip: "Choose which UV channels will receive texture animation.", component: "OAVEnum", componentParam: { enumClass: UVChannelFlags } })
        @oav({ tooltip: "选择哪个UV通道将接收纹理动画。", component: "OAVEnum", componentParam: { enumClass: UVChannelFlags } })
        uvChannelMask = UVChannelFlags.Everything;

        /**
         * 初始化粒子状态
         * @param particle 粒子
         */
        initParticleState(particle: Particle)
        {
            particle[rateTextureSheetAnimation] = Math.random();
        }

        /**
         * 更新粒子状态
         * @param particle 粒子
         */
        updateParticleState(particle: Particle)
        {
            if (!this.enabled) return;

            var segmentsX = this.tiles.x;
            var segmentsY = this.tiles.y;
            var step = this.tiles.clone().reciprocal();
            var total = segmentsX * segmentsY;
            var uvPos = new Vector2();
            var frameOverTime = this.frameOverTime.getValue(particle.rateAtLifeTime, particle[rateTextureSheetAnimation]);
            var frameIndex = this.startFrame;
            var rowIndex = this.rowIndex;
            var cycleCount = this.cycleCount;

            if (this.animation == ParticleSystemAnimationType.WholeSheet)
            {
                frameIndex += Math.floor(frameOverTime * total * cycleCount);
                uvPos.init(frameIndex % segmentsX, Math.floor(frameIndex / segmentsX) % segmentsY).scale(step);

            } else if (this.animation == ParticleSystemAnimationType.SingleRow)
            {
                frameIndex += Math.floor(frameOverTime * segmentsX * cycleCount);
                if (this.useRandomRow)
                {
                    rowIndex = Math.floor(segmentsY * Math.random());
                }
                uvPos.init(frameIndex % segmentsX, rowIndex).scale(step);
            }

            particle.tilingOffset.init(step.x, step.y, uvPos.x, uvPos.y);
            particle.flipUV = this.flipUV;
        }

    }

    var rateTextureSheetAnimation = "_rateTextureSheetAnimation";
}