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



    }
}