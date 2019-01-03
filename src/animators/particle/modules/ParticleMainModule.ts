namespace feng3d
{
    /**
     * 粒子主模块
     */
    export class ParticleMainModule extends ParticleModule
    {
        @oav({ exclude: true })
        enabled = true;

        /**
         * 粒子系统发射粒子的时间长度。如果系统是循环的，这表示一个循环的长度。
         */
        @serialize
        @oav({ tooltip: "粒子系统发射粒子的时间长度。如果系统是循环的，这表示一个循环的长度。" })
        duration = 5;

        /**
         * 如果为真，发射周期将在持续时间后重复。
         */
        @serialize
        @oav({ tooltip: "如果为真，发射周期将在持续时间后重复。" })
        loop = true;

        /**
         * 这个粒子系统在发射粒子之前会等待几秒。
         */
        @serialize
        @oav({ tooltip: "这个粒子系统在发射粒子之前会等待几秒。" })
        startDelay = 0;

        /**
         * 起始寿命为秒，粒子寿命为0时死亡。
         */
        @serialize
        @oav({ tooltip: "起始寿命为秒，粒子寿命为0时死亡。" })
        startLifetime = Object.setValue(new MinMaxCurve(), { between0And1: true, constant: 5, constant1: 5 });

        /**
         * 粒子的起始速度，应用于起始方向。
         */
        @serialize
        @oav({ tooltip: "粒子的起始速度，应用于起始方向。" })
        startSpeed = Object.setValue(new MinMaxCurve(), { constant: 5, constant1: 5 });

        /**
         * 粒子的起始缩放。
         */
        @serialize
        @oav({ tooltip: "粒子的起始缩放。" })
        startScale = Object.setValue(new MinMaxCurveVector3(), { xCurve: { between0And1: true, constant: 1, constant1: 1 }, yCurve: { between0And1: true, constant: 1, constant1: 1 }, zCurve: { between0And1: true, constant: 1, constant1: 1 } });

        /**
         * 粒子的起始旋转角度。
         */
        @serialize
        @oav({ tooltip: "粒子的起始旋转角度。" })
        startRotation = Object.setValue(new MinMaxCurveVector3(), { xCurve: { curveMultiplier: 180 }, yCurve: { curveMultiplier: 180 }, zCurve: { curveMultiplier: 180 } });

        /**
         * 粒子的起始颜色。
         */
        @serialize
        @oav({ tooltip: "粒子的起始颜色。" })
        startColor = new MinMaxGradient();

        /**
         * 按物理管理器中定义的重力进行缩放。
         */
        @serialize
        @oav({ tooltip: "按物理管理器中定义的重力进行缩放。" })
        gravityModifier = new MinMaxCurve();

        /**
         * 使粒子位置模拟在世界，本地或自定义空间。在本地空间中，它们相对于自己的转换而存在，在自定义空间中，它们相对于自定义转换。
         */
        // @serialize
        // @oav({ tooltip: "模拟空间，使粒子位置模拟在世界，本地或自定义空间。在本地空间中，它们相对于自己的转换而存在，在自定义空间中，它们相对于自定义转换。", component: "OAVEnum", componentParam: { enumClass: ParticleSystemSimulationSpace } })
        // simulationSpace = ParticleSystemSimulationSpace.Local;

        /**
         * 使粒子位置模拟相对于自定义转换组件。
         */
        // @serialize
        // @oav({ tooltip: "使粒子位置模拟相对于自定义转换组件。" })
        // customSimulationSpace: Transform;

        /**
         * 缩放粒子系统的播放速度。
         */
        @serialize
        @oav({ tooltip: "缩放粒子系统的播放速度。" })
        simulationSpeed = 1;

        /**
         * 我们应该使用来自整个层次的组合尺度，仅仅是这个粒子结点，还是仅仅对形状模块应用尺度
         */
        // @serialize
        // @oav({ tooltip: "我们应该使用来自整个层次的组合尺度，仅仅是这个粒子结点，还是仅仅对形状模块应用尺度?" })
        // scalingMode = ParticleSystemScalingMode.Local;

        /**
         * 如果启用，系统将自动开始运行。
         */
        @serialize
        @oav({ tooltip: "如果启用，系统将自动开始运行。" })
        playOnAwake = true;

        /**
         * 系统中粒子的数量将被这个数限制。如果达到这个目标，排放将暂时发射。
         */
        @serialize
        @oav({ tooltip: "系统中粒子的数量将被这个数限制。如果达到这个目标，将暂时发射。" })
        maxParticles = 1000;

        /**
         * 此时在周期中的位置
         */
        get rateAtDuration()
        {
            return ((this.particleSystem.time - this.startDelay) % this.duration) / this.duration;
        }

        /**
         * 初始化粒子状态
         * @param particle 粒子
         */
        initParticleState(particle: Particle)
        {
            var rateAtDuration = ((particle.birthTime - this.startDelay) % this.duration) / this.duration;
            //

            particle.position.init(0, 0, 0);
            particle.velocity.init(0, 0, this.startSpeed.getValue(rateAtDuration));
            particle.startScale.copy(this.startScale.getValue(rateAtDuration));
            //
            particle.rotation.copy(this.startRotation.getValue(rateAtDuration));
            //
            particle.startColor.copy(this.startColor.getValue(rateAtDuration));
        }

        /**
         * 更新粒子状态
         * @param particle 粒子
         */
        updateParticleState(particle: Particle, preTime: number, time: number, rateAtLifeTime: number)
        {
            // 计算重力加速度影响速度
            var globalAcceleration = new Vector3(0, -this.gravityModifier.getValue(this.rateAtDuration) * 9.8, 0);

            // 本地加速度
            var localAcceleration = this.particleSystem.transform.worldToLocalMatrix.deltaTransformVector(globalAcceleration);

            //
            particle.velocity.x += localAcceleration.x * (time - preTime);
            particle.velocity.y += localAcceleration.y * (time - preTime);
            particle.velocity.z += localAcceleration.z * (time - preTime);

            //
            particle.scale.copy(particle.startScale);
            //
            particle.color.copy(particle.startColor);
        }
    }
}