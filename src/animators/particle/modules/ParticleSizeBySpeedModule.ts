namespace feng3d
{
    /**
     * Script interface for the Size By Speed module.
     * 
     * 粒子系统 缩放随速度变化模块
     */
    export class ParticleSizeBySpeedModule extends ParticleModule
    {

        /**
         * Set the size over speed on each axis separately.
         * 
         * 在每个轴上分别设置生命周期内的大小。
         */
        @serialize
        // @oav({ tooltip: "Set the size over speed on each axis separately." })
        @oav({ tooltip: "在每个轴上分别设置生命周期内的大小。" })
        separateAxes = false;

        /**
         * Curve to control particle size based on speed.
         * 
         * 基于速度的粒度控制曲线。
         */
        // @oav({ tooltip: "Curve to control particle size based on speed." })
        @oav({ tooltip: "基于速度的粒度控制曲线。" })
        get size()
        {
            return this.size3D.xCurve;
        }

        set size(v)
        {
            this.size3D.xCurve = v;
        }

        /**
         * Curve to control particle size based on speed.
         * 
         * 基于寿命的粒度控制曲线。
         */
        @serialize
        // @oav({ tooltip: "Curve to control particle size based on speed." })
        @oav({ tooltip: "基于寿命的粒度控制曲线。" })
        size3D = serialization.setValue(new MinMaxCurveVector3(), { xCurve: { between0And1: true, constant: 1, constantMin: 1, constantMax: 1, curveMultiplier: 1 }, yCurve: { between0And1: true, constant: 1, constantMin: 1, constantMax: 1, curveMultiplier: 1 }, zCurve: { between0And1: true, constant: 1, constantMin: 1, constantMax: 1, curveMultiplier: 1 } });

        /**
         * Apply the size curve between these minimum and maximum speeds.
         * 
         * 在这些最小和最大速度之间应用尺寸变化。
         */
        @serialize
        @oav({ tooltip: "在这些最小和最大速度之间应用颜色渐变。" })
        range = new Vector2(0, 1);

        /**
         * Size multiplier.
         * 
         * 尺寸的乘数。
         */
        get sizeMultiplier()
        {
            return this.size.curveMultiplier;
        }

        set sizeMultiplier(v)
        {
            this.size.curveMultiplier = v;
        }

        /**
         * Size over speed curve for the X axis.
         * 
         * X轴的尺寸随生命周期变化曲线。
         */
        get x()
        {
            return this.size3D.xCurve;
        }

        set x(v)
        {
            this.size3D.xCurve;
        }

        /**
         * X axis size multiplier.
         * 
         * X轴尺寸的乘数。
         */
        get xMultiplier()
        {
            return this.x.curveMultiplier;
        }

        set xMultiplier(v)
        {
            this.x.curveMultiplier = v;
        }

        /**
         * Size over speed curve for the Y axis.
         * 
         * Y轴的尺寸随生命周期变化曲线。
         */
        get y()
        {
            return this.size3D.yCurve;
        }

        set y(v)
        {
            this.size3D.yCurve;
        }

        /**
         * Y axis size multiplier.
         * 
         * Y轴尺寸的乘数。
         */
        get yMultiplier()
        {
            return this.y.curveMultiplier;
        }

        set yMultiplier(v)
        {
            this.y.curveMultiplier = v;
        }

        /**
         * Size over speed curve for the Z axis.
         * 
         * Z轴的尺寸随生命周期变化曲线。
         */
        get z()
        {
            return this.size3D.zCurve;
        }

        set z(v)
        {
            this.size3D.zCurve;
        }

        /**
         * Z axis size multiplier.
         * 
         * Z轴尺寸的乘数。
         */
        get zMultiplier()
        {
            return this.z.curveMultiplier;
        }

        set zMultiplier(v)
        {
            this.z.curveMultiplier = v;
        }

        /**
         * 初始化粒子状态
         * @param particle 粒子
         */
        initParticleState(particle: Particle)
        {
            particle[_SizeBySpeed_rate] = Math.random();
        }

        /**
         * 更新粒子状态
         * @param particle 粒子
         */
        updateParticleState(particle: Particle)
        {
            if (!this.enabled) return;

            var velocity = particle.velocity.length;
            var rate = Math.clamp((velocity - this.range.x) / (this.range.y - this.range.x), 0, 1);
            var size = this.size3D.getValue(rate, particle[_SizeBySpeed_rate]);
            if (!this.separateAxes)
            {
                size.y = size.z = size.x;
            }
            particle.size.multiply(size);
        }
    }

    var _SizeBySpeed_rate = "_SizeBySpeed_rate";
}