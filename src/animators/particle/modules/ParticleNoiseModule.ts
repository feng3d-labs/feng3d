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
        @oav({ tooltip: "生成一维、二维或三维噪声。" })
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

        // 以下两个值用于与Unity中数据接近
        private _frequencyScale = 0.2;
        private _strengthScale = 4;

        /**
         * 绘制噪音到图片
         * 
         * @param image 图片数据
         */
        drawImage(image: ImageData)
        {
            var cellSizeX = this._frequencyScale / this.frequency;
            var cellSizeY = this._frequencyScale / this.frequency;
            var strength = this.strength * this._strengthScale;
            var quality = this.quality;
            var octaveCount = this.octaveCount;
            var octaveScale = this.octaveScale;
            var octaveMultiplier = this.octaveMultiplier;

            if (this.damping) strength /= this.frequency;

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
                    var value = getValue(x, y);
                    for (var l = 1, ln = octaveCount; l < ln; l++)
                    {
                        var value0 = getValue(x * octaveScale, y * octaveScale);
                        value += (value0 - value) * octaveMultiplier;
                    }
                    // datas.push(value);
                    // if (min > value) min = value;
                    // if (max < value) max = value;

                    value = (value * strength + 1) / 2 * 256;
                    var cell = (x + y * imageWidth) * 4;
                    data[cell] = data[cell + 1] = data[cell + 2] = Math.floor(value);
                    data[cell + 3] = 255; // alpha
                }
            }
            // console.log(datas, min, max);

            function getValue(x: number, y: number)
            {
                var value = 0;

                if (quality == ParticleSystemNoiseQuality.Low)
                {
                    value = noise.perlin1(x / imageWidth / cellSizeX);
                } else if (quality == ParticleSystemNoiseQuality.Medium)
                {
                    value = noise.perlin2(x / imageWidth / cellSizeX, y / imageHeight / cellSizeY);
                } else if (quality == ParticleSystemNoiseQuality.High)
                {
                    value = noise.perlin3(x / imageWidth / cellSizeX, y / imageHeight / cellSizeY, 0);
                }
                return value;
            }
        }

    }
}