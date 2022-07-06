namespace feng3d
{
    /**
     * Script interface for the Noise Module.
     * 
     * The Noise Module allows you to apply turbulence to the movement of your particles. Use the low quality settings to create computationally efficient Noise, or simulate smoother, richer Noise with the higher quality settings. You can also choose to define the behavior of the Noise individually for each axis.
     * 
     * 噪声模块
     * 
     * 噪声模块允许你将湍流应用到粒子的运动中。使用低质量设置来创建计算效率高的噪声，或者使用高质量设置来模拟更平滑、更丰富的噪声。您还可以选择为每个轴分别定义噪声的行为。
     */
    export class ParticleNoiseModule extends ParticleModule
    {
        /**
         * Control the noise separately for each axis.
         * 
         * 分别控制每个轴的噪声。
         */
        @serialize
        @oav({ tooltip: "分别控制每个轴的噪声。" })
        separateAxes = false;

        /**
         * How strong the overall noise effect is.
         * 
         * 整体噪音效应有多强。
         */
        @oav({ tooltip: "整体噪音效应有多强。" })
        get strength()
        {
            return this.strength3D.xCurve;
        }

        set strength(v)
        {
            this.strength3D.xCurve = v;
        }

        /**
         * How strong the overall noise effect is.
         * 
         * 整体噪音效应有多强。
         */
        @serialize
        @oav({ tooltip: "整体噪音效应有多强。" })
        strength3D = serialization.setValue(new MinMaxCurveVector3(), { xCurve: { between0And1: true, constant: 1, constantMin: 1, constantMax: 1, curveMultiplier: 1 }, yCurve: { between0And1: true, constant: 1, constantMin: 1, constantMax: 1, curveMultiplier: 1 }, zCurve: { between0And1: true, constant: 1, constantMin: 1, constantMax: 1, curveMultiplier: 1 } });

        /**
         * Define the strength of the effect on the X axis, when using separateAxes option.
         * 
         * 在使用分别控制每个轴时，在X轴上定义效果的强度。
         */
        get strengthX()
        {
            return this.strength3D.xCurve;
        }

        set strengthX(v)
        {
            this.strength3D.xCurve = v;
        }

        /**
         * Define the strength of the effect on the Y axis, when using separateAxes option.
         * 
         * 在使用分别控制每个轴时，在Y轴上定义效果的强度。
         */
        get strengthY()
        {
            return this.strength3D.yCurve;
        }

        set strengthY(v)
        {
            this.strength3D.yCurve = v;
        }

        /**
         * Define the strength of the effect on the Z axis, when using separateAxes option.
         * 
         * 在使用分别控制每个轴时，在Z轴上定义效果的强度。
         */
        get strengthZ()
        {
            return this.strength3D.zCurve;
        }

        set strengthZ(v)
        {
            this.strength3D.zCurve = v;
        }

        /**
         * Low values create soft, smooth noise, and high values create rapidly changing noise.
         * 
         * 低值产生柔和、平滑的噪声，高值产生快速变化的噪声。
         */
        @serialize
        @oav({ tooltip: "低值产生柔和、平滑的噪声，高值产生快速变化的噪声。" })
        frequency = 0.5;

        /**
         * Scroll the noise map over the particle system.
         * 
         * 在粒子系统上滚动噪声图。
         */
        @serialize
        @oav({ tooltip: "在粒子系统上滚动噪声图。" })
        scrollSpeed = new MinMaxCurve();

        /**
         * Higher frequency noise will reduce the strength by a proportional amount, if enabled.
         * 
         * 如果启用高频率噪音，将按比例减少强度。
         */
        @serialize
        @oav({ tooltip: "如果启用高频率噪音，将按比例减少强度。" })
        damping = true;

        /**
         * Layers of noise that combine to produce final noise.
         * 
         * 一层一层的噪声组合在一起产生最终的噪声。
         */
        @serialize
        @oav({ tooltip: "一层一层的噪声组合在一起产生最终的噪声。" })
        octaveCount = 1;

        /**
         * When combining each octave, scale the intensity by this amount.
         * 
         * 当组合每个八度时，按这个比例调整强度。
         */
        @serialize
        @oav({ tooltip: "当组合每个八度时，按这个比例调整强度。" })
        octaveMultiplier = 0.5;

        /**
         * When combining each octave, zoom in by this amount.
         * 
         * 当组合每个八度时，放大这个数字。
         */
        @serialize
        @oav({ tooltip: "当组合每个八度时，放大这个数字。" })
        octaveScale = 2;

        /**
         * Generate 1D, 2D or 3D noise.
         * 
         * 生成一维、二维或三维噪声。
         */
        @serialize
        @oav({ tooltip: "生成一维、二维或三维噪声。", componentParam: { enumClass: ParticleSystemNoiseQuality } })
        quality = ParticleSystemNoiseQuality.High;

        /**
         * Enable remapping of the final noise values, allowing for noise values to be translated into different values.
         * 
         * 允许重新映射最终的噪声值，允许将噪声值转换为不同的值。
         */
        @serialize
        @oav({ tooltip: "允许重新映射最终的噪声值，允许将噪声值转换为不同的值。" })
        remapEnabled = false;

        /**
         * Define how the noise values are remapped.
         * 
         * 定义如何重新映射噪声值。
         */
        @oav({ tooltip: "生成一维、二维或三维噪声。" })
        get remap()
        {
            return this.remap3D.xCurve;
        }

        set remap(v)
        {
            this.remap3D.xCurve = v;
        }

        /**
         * Define how the noise values are remapped.
         * 
         * 定义如何重新映射噪声值。
         */
        @serialize
        @oav({ tooltip: "生成一维、二维或三维噪声。" })
        remap3D = serialization.setValue(new MinMaxCurveVector3(), {
            xCurve: { between0And1: true, constant: 1, constantMin: 1, constantMax: 1, curveMultiplier: 1 },
            yCurve: { between0And1: true, constant: 1, constantMin: 1, constantMax: 1, curveMultiplier: 1 },
            zCurve: { between0And1: true, constant: 1, constantMin: 1, constantMax: 1, curveMultiplier: 1 }
        });

        /**
         * Define how the noise values are remapped on the X axis, when using the ParticleSystem.NoiseModule.separateAxes option.
         * 
         * 在使用分别控制每个轴时，如何在X轴上重新映射噪声值。
         */
        get remapX()
        {
            return this.remap3D.xCurve;
        }

        set remapX(v)
        {
            this.remap3D.xCurve = v;
        }

        /**
         * Define how the noise values are remapped on the Y axis, when using the ParticleSystem.NoiseModule.separateAxes option.
         * 
         * 在使用分别控制每个轴时，如何在Y轴上重新映射噪声值。
         */
        get remapY()
        {
            return this.remap3D.yCurve;
        }

        set remapY(v)
        {
            this.remap3D.yCurve = v;
        }

        /**
         * Define how the noise values are remapped on the Z axis, when using the ParticleSystem.NoiseModule.separateAxes option.
         * 
         * 在使用分别控制每个轴时，如何在Z轴上重新映射噪声值。
         */
        get remapZ()
        {
            return this.remap3D.zCurve;
        }

        set remapZ(v)
        {
            this.remap3D.zCurve = v;
        }

        /**
         * 初始化粒子状态
         * @param particle 粒子
         */
        initParticleState(particle: Particle)
        {
            particle[_Noise_strength_rate] = Math.random();
            particle[_Noise_particle_rate] = Math.random();
        }

        /**
         * 更新粒子状态
         * @param particle 粒子
         */
        updateParticleState(particle: Particle)
        {
            this.particleSystem.removeParticlePosition(particle, _Noise_preOffset);
            if (!this.enabled) return;

            var strengthX = 1;
            var strengthY = 1;
            var strengthZ = 1;
            if (this.separateAxes)
            {
                var strength3D = this.strength3D.getValue(particle.rateAtLifeTime, particle[_Noise_strength_rate]);
                strengthX = strength3D.x;
                strengthY = strength3D.y;
                strengthZ = strength3D.z;
            } else
            {
                strengthX = strengthY = strengthZ = this.strength.getValue(particle.rateAtLifeTime, particle[_Noise_strength_rate]);
            }
            //
            var frequency = ParticleNoiseModule._frequencyScale * this.frequency;
            //
            var offsetPos = new Vector3(strengthX, strengthY, strengthZ);
            //
            offsetPos.scaleNumber(ParticleNoiseModule._strengthScale);
            if (this.damping)
            {
                offsetPos.scaleNumber(1 / this.frequency);
            }
            var time = particle.rateAtLifeTime * ParticleNoiseModule._timeScale % 1;
            //
            offsetPos.x *= this._getNoiseValue((1 / 3 * 0 + time) * frequency, particle[_Noise_particle_rate] * frequency);
            offsetPos.y *= this._getNoiseValue((1 / 3 * 1 + time) * frequency, particle[_Noise_particle_rate] * frequency);
            offsetPos.z *= this._getNoiseValue((1 / 3 * 2 + time) * frequency, particle[_Noise_particle_rate] * frequency);
            //

            this.particleSystem.addParticlePosition(particle, offsetPos, this.particleSystem.main.simulationSpace, _Noise_preOffset);
        }

        // 以下两个值用于与Unity中数据接近
        static _frequencyScale = 5;
        static _strengthScale = 0.3;
        static _timeScale = 5;

        /**
         * 绘制噪音到图片
         * 
         * @param image 图片数据
         */
        drawImage(image: ImageData)
        {
            var strength = this._getDrawImageStrength();
            var strengthX = strength.x;
            var strengthY = strength.y;
            var strengthZ = strength.z;
            //
            strengthX *= ParticleNoiseModule._strengthScale;
            strengthY *= ParticleNoiseModule._strengthScale;
            strengthZ *= ParticleNoiseModule._strengthScale;

            if (this.damping)
            {
                strengthX /= this.frequency;
                strengthY /= this.frequency;
                strengthZ /= this.frequency;
            }
            //
            var frequency = ParticleNoiseModule._frequencyScale * this.frequency;
            //
            var data = image.data;

            var imageWidth = image.width;
            var imageHeight = image.height;

            // var datas: number[] = [];
            // var min = Number.MAX_VALUE;
            // var max = Number.MIN_VALUE;

            for (var x = 0; x < imageWidth; x++)
            {
                for (var y = 0; y < imageHeight; y++)
                {
                    var xv = x / imageWidth * frequency;
                    var yv = 1 - y / imageHeight * frequency;

                    var value = this._getNoiseValue(xv, yv);

                    // datas.push(value);
                    // if (min > value) min = value;
                    // if (max < value) max = value;

                    if (xv < 1 / 3)
                        value = (value * strengthX + 1) / 2 * 256;
                    else if (xv < 2 / 3)
                        value = (value * strengthY + 1) / 2 * 256;
                    else
                        value = (value * strengthZ + 1) / 2 * 256;

                    var cell = (x + y * imageWidth) * 4;
                    data[cell] = data[cell + 1] = data[cell + 2] = Math.floor(value);
                    data[cell + 3] = 255; // alpha
                }
            }
            // console.log(datas, min, max);

        }

        private _getDrawImageStrength()
        {
            var strengthX = 1;
            var strengthY = 1;
            var strengthZ = 1;
            if (this.separateAxes)
            {
                if (this.strengthX.mode == MinMaxCurveMode.Curve || this.strengthX.mode == MinMaxCurveMode.TwoCurves)
                    strengthX = this.strengthX.curveMultiplier;
                else if (this.strengthX.mode == MinMaxCurveMode.Constant)
                    strengthX = this.strengthX.constant;
                else if (this.strengthX.mode == MinMaxCurveMode.TwoConstants)
                    strengthX = this.strengthX.constantMax;

                if (this.strengthY.mode == MinMaxCurveMode.Curve || this.strengthY.mode == MinMaxCurveMode.TwoCurves)
                    strengthY = this.strengthY.curveMultiplier;
                else if (this.strengthY.mode == MinMaxCurveMode.Constant)
                    strengthY = this.strengthY.constant;
                else if (this.strengthY.mode == MinMaxCurveMode.TwoConstants)
                    strengthY = this.strengthY.constantMax;

                if (this.strengthZ.mode == MinMaxCurveMode.Curve || this.strengthZ.mode == MinMaxCurveMode.TwoCurves)
                    strengthZ = this.strengthZ.curveMultiplier;
                else if (this.strengthZ.mode == MinMaxCurveMode.Constant)
                    strengthZ = this.strengthZ.constant;
                else if (this.strengthZ.mode == MinMaxCurveMode.TwoConstants)
                    strengthZ = this.strengthZ.constantMax;
            } else
            {
                if (this.strength.mode == MinMaxCurveMode.Curve || this.strength.mode == MinMaxCurveMode.TwoCurves)
                    strengthX = strengthY = strengthZ = this.strength.curveMultiplier;
                else if (this.strength.mode == MinMaxCurveMode.Constant)
                    strengthX = strengthY = strengthZ = this.strength.constant;
                else if (this.strength.mode == MinMaxCurveMode.TwoConstants)
                    strengthX = strengthY = strengthZ = this.strength.constantMax;
            }
            return { x: strengthX, y: strengthY, z: strengthZ }
        }

        /**
         * 获取噪音值
         * 
         * @param x 
         * @param y 
         */
        private _getNoiseValue(x: number, y: number)
        {
            var value = this._getNoiseValueBase(x, y);
            for (var l = 1, ln = this.octaveCount; l < ln; l++)
            {
                var value0 = this._getNoiseValueBase(x * this.octaveScale, y * this.octaveScale);
                value += (value0 - value) * this.octaveMultiplier;
            }
            return value;
        }

        /**
         * 获取单层噪音值
         * 
         * @param x 
         * @param y 
         */
        private _getNoiseValueBase(x: number, y: number)
        {
            var scrollValue = this._scrollValue;
            if (this.quality == ParticleSystemNoiseQuality.Low)
            {
                return noise.perlin1(x + scrollValue);
            }
            if (this.quality == ParticleSystemNoiseQuality.Medium)
            {
                return noise.perlin2(x, y + scrollValue);
            }
            // if (this.quality == ParticleSystemNoiseQuality.High)
            return noise.perlin3(x, y, scrollValue);
        }

        /**
         * 更新
         * 
         * @param interval 
         */
        update(interval: number)
        {
            this._scrollValue += this.scrollSpeed.getValue(this.particleSystem._emitInfo.rateAtDuration) * interval / 1000;
        }
        private _scrollValue = 0;
    }
    var _Noise_strength_rate = "_Noise_strength_rate";
    var _Noise_particle_rate = "_Noise_particle_rate";
    var _Noise_preOffset = "_Noise_preOffset";

}