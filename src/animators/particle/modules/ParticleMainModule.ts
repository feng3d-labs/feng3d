namespace feng3d
{
    /**
     * 粒子主模块
     */
    export class ParticleMainModule extends ParticleModule
    {
        __class__: "feng3d.ParticleMainModule";

        @oav({ exclude: true })
        enabled = true;

        /**
         * 粒子系统的持续时间(秒)。
         */
        @serialize
        // @oav({ tooltip: "The duration of the particle system in seconds." })
        @oav({ tooltip: "粒子系统的持续时间(秒)。" })
        duration = 5;

        /**
         * 粒子系统在循环吗?
         */
        @serialize
        // @oav({ tooltip: "Is the particle system looping?" })
        @oav({ tooltip: "粒子系统在循环吗?" })
        loop = true;

        /**
         * When looping is enabled, this controls whether this particle system will look like it has already simulated for one loop when first becoming visible.
         * 
         * 当循环被激活时，它控制这个粒子系统在第一次出现时是否看起来像已经模拟了一个循环。
         */
        @serialize
        // @oav({ tooltip: "When looping is enabled, this controls whether this particle system will look like it has already simulated for one loop when first becoming visible." })
        @oav({ tooltip: "当循环被激活时，它控制这个粒子系统在第一次出现时是否看起来像已经模拟了一个循环。" })
        prewarm = false;

        /**
         * Start delay in seconds.
         * 
         * 启动延迟(以秒为单位)。
         */
        @serialize
        // @oav({ tooltip: "Start delay in seconds." })
        @oav({ tooltip: "启动延迟(以秒为单位)。" })
        startDelay = new MinMaxCurve();

        /**
         * Start delay multiplier in seconds.
         * 
         * 启动延迟乘数(以秒为单位)。
         */
        get startDelayMultiplier()
        {
            return this.startDelay.curveMultiplier;
        }

        /**
         * The total lifetime in seconds that each new particle will have.
         * 
         * 每个新粒子的总寿命(以秒计)。
         */
        @serialize
        // @oav({ tooltip: "The total lifetime in seconds that each new particle will have." })
        @oav({ tooltip: "每个新粒子的总寿命(以秒计)。" })
        startLifetime = serialization.setValue(new MinMaxCurve(), { between0And1: true, constant: 5, constantMin: 5, constantMax: 5 });

        /**
         * Start lifetime multiplier.
         * This method is more efficient than accessing the whole curve, if you only want to change the overall lifetime multiplier.
         * 
         * 起始寿命乘数。
         * 如果您只想更改总体寿命乘数，则此方法比访问整个曲线更有效。
         */
        get startLifetimeMultiplier()
        {
            return this.startLifetime.curveMultiplier;
        }

        set startLifetimeMultiplier(v)
        {
            this.startLifetime.curveMultiplier = v;
        }

        /**
         * The initial speed of particles when emitted.
         * 
         * 粒子发射时的初始速度。
         */
        @serialize
        // @oav({ tooltip: "The initial speed of particles when emitted." })
        @oav({ tooltip: "粒子发射时的初始速度。" })
        startSpeed = serialization.setValue(new MinMaxCurve(), { constant: 5, constantMin: 5, constantMax: 5 });

        /**
         * A multiplier of the initial speed of particles when emitted.
         * This method is more efficient than accessing the whole curve, if you only want to change the overall speed multiplier.
         * 
         * 粒子发射时的初始速度的乘子。
         * 这种方法比访问整个曲线更有效，如果你只想改变整体速度乘数。
         */
        get startSpeedMultiplier()
        {
            return this.startSpeed.curveMultiplier;
        }

        set startSpeedMultiplier(v)
        {
            this.startSpeed.curveMultiplier = v;
        }

        /**
         * A flag to enable specifying particle size individually for each axis.
         * 
         * 允许为每个轴分别指定粒度大小的标志。
         */
        @serialize
        // @oav({ tooltip: "A flag to enable specifying particle size individually for each axis." })
        @oav({ tooltip: "允许为每个轴分别指定粒度大小的标志。" })
        useStartSize3D = false;

        /**
         * The initial size of particles when emitted.
         * 
         * 粒子发射时的初始大小。
         */
        @serialize
        // @oav({ tooltip: "The initial size of particles when emitted." })
        @oav({ tooltip: "粒子发射时的初始大小。" })
        get startSize()
        {
            return this.startSize3D.xCurve;
        }

        set startSize(v)
        {
            this.startSize3D.xCurve = v;
        }

        /**
         * Start size multiplier.
         * This method is more efficient than accessing the whole curve, if you only want to change the overall size multiplier.
         * 
         * 开始尺寸乘数。
         * 如果您只想更改整体尺寸倍增器，则此方法比访问整个曲线更有效。
         */
        get startSizeMultiplier()
        {
            return this.startSize.curveMultiplier;
        }

        set startSizeMultiplier(v)
        {
            this.startSize.curveMultiplier = v;
        }

        /**
         * The initial size of particles when emitted.
         * 
         * 发射时粒子的初始大小。
         */
        @serialize
        // @oav({ tooltip: "The initial size of particles when emitted." })
        @oav({ tooltip: "发射时粒子的初始大小。" })
        startSize3D = serialization.setValue(new MinMaxCurveVector3(), { xCurve: { between0And1: true, constant: 1, constantMin: 1, constantMax: 1 }, yCurve: { between0And1: true, constant: 1, constantMin: 1, constantMax: 1 }, zCurve: { between0And1: true, constant: 1, constantMin: 1, constantMax: 1 } });

        /**
         * The initial size of particles along the X axis when emitted.
         * 
         * 发射时沿X轴的粒子的初始大小。
         */
        get startSizeX()
        {
            return this.startSize3D.xCurve;
        }

        set startSizeX(v)
        {
            this.startSize3D.xCurve = v;
        }

        /**
         * Start rotation multiplier along the X axis.
         * This method is more efficient than accessing the whole curve, if you only want to change the overall size multiplier.
         * 
         * 启动旋转乘法器沿X轴。
         * 如果您只想更改整体大小倍增器，则此方法比访问整个曲线更有效。
         */
        get startSizeXMultiplier()
        {
            return this.startSizeX.curveMultiplier;
        }

        set startSizeXMultiplier(v)
        {
            this.startSizeX.curveMultiplier = v;
        }

        /**
         * The initial size of particles along the Y axis when emitted.
         * 
         * 发射时沿Y轴的粒子的初始大小。
         */
        get startSizeY()
        {
            return this.startSize3D.yCurve;
        }

        set startSizeY(v)
        {
            this.startSize3D.yCurve = v;
        }

        /**
         * Start rotation multiplier along the Y axis.
         * This method is more efficient than accessing the whole curve, if you only want to change the overall size multiplier.
         * 
         * 启动旋转乘法器沿Y轴。
         * 如果您只想更改整体大小倍增器，则此方法比访问整个曲线更有效。
         */
        get startSizeYMultiplier()
        {
            return this.startSizeY.curveMultiplier;
        }

        set startSizeYMultiplier(v)
        {
            this.startSizeY.curveMultiplier = v;
        }

        /**
         * The initial size of particles along the Z axis when emitted.
         * 
         * 发射时沿Z轴的粒子的初始大小。
         */
        get startSizeZ()
        {
            return this.startSize3D.zCurve;
        }

        set startSizeZ(v)
        {
            this.startSize3D.zCurve = v;
        }

        /**
         * Start rotation multiplier along the Z axis.
         * This method is more efficient than accessing the whole curve, if you only want to change the overall size multiplier.
         * 
         * 启动旋转乘法器沿Z轴。
         * 如果您只想更改整体大小倍增器，则此方法比访问整个曲线更有效。
         */
        get startSizeZMultiplier()
        {
            return this.startSizeZ.curveMultiplier;
        }

        set startSizeZMultiplier(v)
        {
            this.startSizeZ.curveMultiplier = v;
        }

        /**
         * A flag to enable 3D particle rotation.
         * 一个启用粒子3D旋转的标记。
         */
        @serialize
        // @oav({ tooltip: "A flag to enable 3D particle rotation." })
        @oav({ tooltip: "一个启用粒子3D旋转的标记。" })
        useStartRotation3D = false;

        /**
         * The initial rotation of particles when emitted.
         * 粒子发射时的初始旋转。
         */
        // @oav({ tooltip: "The initial rotation of particles when emitted." })
        @oav({ tooltip: "粒子发射时的初始旋转。" })
        get startRotation()
        {
            return this.startRotation3D.zCurve;
        }

        set startRotation(v)
        {
            this.startRotation3D.zCurve = v;
        }

        /**
         * Start rotation multiplier.
         * This method is more efficient than accessing the whole curve, if you only want to change the overall rotation multiplier.
         * 
         * 开始旋转乘数。
         * 这种方法比访问整个曲线更有效，如果你只想改变整体旋转乘数。
         */
        get startRotationMultiplier()
        {
            return this.startRotation.curveMultiplier;
        }

        set startRotationMultiplier(v)
        {
            this.startRotation.curveMultiplier = v;
        }

        /**
         * The initial rotation of particles when emitted.
         * 
         * 粒子发射时的初始旋转。
         */
        @serialize
        // @oav({ tooltip: "The initial rotation of particles when emitted." })
        @oav({ tooltip: "粒子发射时的初始旋转。" })
        startRotation3D = serialization.setValue(new MinMaxCurveVector3(), { xCurve: { curveMultiplier: 180 }, yCurve: { curveMultiplier: 180 }, zCurve: { curveMultiplier: 180 } });

        /**
         * The initial rotation of particles around the X axis when emitted.
         * 
         * 发射时粒子围绕X轴的初始旋转。
         */
        get startRotationX()
        {
            return this.startRotation3D.xCurve;
        }

        set startRotationX(v)
        {
            this.startRotation3D.xCurve = v;
        }

        /**
         * Start rotation multiplier around the X axis.
         * This method is more efficient than accessing the whole curve, if you only want to change the overall rotation multiplier.
         * 
         * 开始绕X轴旋转乘法器。
         * 这种方法比访问整个曲线更有效，如果你只想改变整体旋转乘数。
         */
        get startRotationXMultiplier()
        {
            return this.startRotationX.curveMultiplier;
        }

        set startRotationXMultiplier(v)
        {
            this.startRotationX.curveMultiplier = v;
        }

        /**
         * The initial rotation of particles around the Y axis when emitted.
         * 
         * 发射时粒子围绕Y轴的初始旋转。
         */
        get startRotationY()
        {
            return this.startRotation3D.yCurve;
        }

        set startRotationY(v)
        {
            this.startRotation3D.yCurve = v;
        }

        /**
         * Start rotation multiplier around the Y axis.
         * This method is more efficient than accessing the whole curve, if you only want to change the overall rotation multiplier.
         * 
         * 开始绕Y轴旋转乘法器。
         * 这种方法比访问整个曲线更有效，如果你只想改变整体旋转乘数。
         */
        get startRotationYMultiplier()
        {
            return this.startRotationY.curveMultiplier;
        }

        set startRotationYMultiplier(v)
        {
            this.startRotationY.curveMultiplier = v;
        }

        /**
         * The initial rotation of particles around the Z axis when emitted.
         * 
         * 发射时粒子围绕Z轴的初始旋转。
         */
        get startRotationZ()
        {
            return this.startRotation3D.zCurve;
        }

        set startRotationZ(v)
        {
            this.startRotation3D.zCurve = v;
        }

        /**
         * Start rotation multiplier around the Z axis.
         * This method is more efficient than accessing the whole curve, if you only want to change the overall rotation multiplier.
         * 
         * 开始绕Z轴旋转乘法器。
         * 这种方法比访问整个曲线更有效，如果你只想改变整体旋转乘数。
         */
        get startRotationZMultiplier()
        {
            return this.startRotationZ.curveMultiplier;
        }

        set startRotationZMultiplier(v)
        {
            this.startRotationZ.curveMultiplier = v;
        }

        /**
         * Cause some particles to spin in the opposite direction. Set between 0 and 1, where higher values will cause a higher proportion of particles to spin in the opposite direction.
         * 
         * 导致一些粒子向相反的方向旋转。设置在0和1之间，数值越大，粒子朝相反方向旋转的比例越大。
         */
        @serialize
        // @oav({ tooltip: "Cause some particles to spin in the opposite direction. Set between 0 and 1, where higher values will cause a higher proportion of particles to spin in the opposite direction." })
        @oav({ tooltip: "导致一些粒子向相反的方向旋转。设置在0和1之间，数值越大，粒子朝相反方向旋转的比例越大。" })
        randomizeRotationDirection = 0;

        /**
         * The initial color of particles when emitted.
         * 
         * 粒子发射时的初始颜色。
         */
        @serialize
        // @oav({ tooltip: "The initial color of particles when emitted." })
        @oav({ tooltip: "粒子发射时的初始颜色。" })
        startColor = new MinMaxGradient();

        /**
         * Scale applied to the gravity.
         * 
         * 应用于重力加速度的缩放。
         */
        @serialize
        // @oav({ tooltip: "Scale applied to the gravity." })
        @oav({ tooltip: "应用于重力加速度的缩放。" })
        gravityModifier = new MinMaxCurve();

        /**
         * This selects the space in which to simulate particles. It can be either world or local space.
         * 
         * 模拟空间，使粒子位置模拟在世界，本地或自定义空间。在本地空间中，它们相对于自己的转换而存在，在自定义空间中，它们相对于自定义转换。
         * 
         * @todo
         */
        @serialize
        // @oav({ tooltip: "This selects the space in which to simulate particles. It can be either world or local space.", component: "OAVEnum", componentParam: { enumClass: ParticleSystemSimulationSpace } })
        @oav({ tooltip: "模拟空间，使粒子位置模拟在世界，本地或自定义空间。在本地空间中，它们相对于自己的转换而存在，在自定义空间中，它们相对于自定义转换。", component: "OAVEnum", componentParam: { enumClass: ParticleSystemSimulationSpace } })
        simulationSpace = ParticleSystemSimulationSpace.Local;

        /**
         * Override the default playback speed of the Particle System.
         * 
         * 重写粒子系统的默认播放速度。
         */
        @serialize
        // @oav({ tooltip: "Override the default playback speed of the Particle System." })
        @oav({ tooltip: "重写粒子系统的默认播放速度。" })
        simulationSpeed = 1;

        /**
         * Control how the particle system's Transform Component is applied to the particle system.
         * 
         * 控制粒子系统的变换组件如何应用于粒子系统。
         */
        @serialize
        // @oav({ tooltip: "Control how the particle system's Transform Component is applied to the particle system.", component: "OAVEnum", componentParam: { enumClass: ParticleSystemScalingMode } })
        @oav({ tooltip: "控制粒子系统的变换组件如何应用于粒子系统。", component: "OAVEnum", componentParam: { enumClass: ParticleSystemScalingMode } })
        scalingMode = ParticleSystemScalingMode.Local;

        /**
         * If set to true, the particle system will automatically start playing on startup.
         * 
         * 如果设置为真，粒子系统将自动开始播放启动。
         */
        @serialize
        // @oav({ tooltip: "If set to true, the particle system will automatically start playing on startup." })
        @oav({ tooltip: "如果设置为真，粒子系统将自动开始播放启动。" })
        playOnAwake = true;

        /**
         * The maximum number of particles to emit.
         * 
         * 发射粒子的最大数量。
         */
        @serialize
        // @oav({ tooltip: "The maximum number of particles to emit." })
        @oav({ tooltip: "发射粒子的最大数量。" })
        maxParticles = 1000;

        constructor()
        {
            super();
        }

        /**
         * 初始化粒子状态
         * @param particle 粒子
         */
        initParticleState(particle: Particle)
        {
            //
            var birthRateAtDuration = particle.birthRateAtDuration;

            particle.velocity.set(0, 0, 0);
            particle.acceleration.set(0, 0, 0);
            if (this.useStartSize3D)
            {
                particle.startSize.copy(this.startSize3D.getValue(birthRateAtDuration));
            } else
            {
                var startSize = this.startSize.getValue(birthRateAtDuration);
                particle.startSize.set(startSize, startSize, startSize);
            }

            //
            if (this.useStartRotation3D)
            {
                particle.rotation.copy(this.startRotation3D.getValue(birthRateAtDuration));
            } else
            {
                var startRotation = this.startRotation.getValue(birthRateAtDuration);
                particle.rotation.set(0, 0, startRotation);
            }
            particle.angularVelocity.set(0, 0, 0);
            //
            particle.startColor.copy(this.startColor.getValue(birthRateAtDuration));
        }

        /**
         * 更新粒子状态
         * @param particle 粒子
         */
        updateParticleState(particle: Particle)
        {
            // 加速度
            var gravity = world_gravity.scaleNumberTo(this.gravityModifier.getValue(this.particleSystem._emitInfo.rateAtDuration));
            this.particleSystem.addParticleAcceleration(particle, gravity, ParticleSystemSimulationSpace.World, _Main_preGravity);

            //
            particle.size.copy(particle.startSize);
            particle.color.copy(particle.startColor);
        }
    }

    var world_gravity = new Vector3(0, -9.8, 0);
    var _Main_preGravity = "_Main_preGravity";
}