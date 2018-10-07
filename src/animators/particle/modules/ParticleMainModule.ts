namespace feng3d
{
    /**
     * 粒子主模块
     */
    export class ParticleMainModule extends ParticleModule
    {
        /**
         * 粒子系统发射粒子的时间长度。如果系统是循环的，这表示一个循环的长度。
         */
        @serialize
        // @oav({ tooltip: "The length of time the Particle System is emitting particles. If the system is looping, this indicates the length of one cycle." })
        @oav({ tooltip: "粒子系统发射粒子的时间长度。如果系统是循环的，这表示一个循环的长度。" })
        duration = 5;

        /**
         * 如果为真，发射周期将在持续时间后重复。
         */
        @serialize
        // @oav({ tooltip: "If true, the emission cycle will repeat after the duration." })
        @oav({ tooltip: "如果为真，发射周期将在持续时间后重复。" })
        loop = true;

        /**
         * 当播放预暖系统时，将处于一种状态，就好像它坏了发出一个循环。只能在系统循环时使用。
         */
        @serialize
        // @oav({ tooltip: "When played a prewarmed system will be in a state as if it bad emitted one loop cycle. Can only be used if the system is looping." })
        @oav({ tooltip: "当播放预暖系统时，将处于一种状态，就好像它坏了发出一个循环。只能在系统循环时使用。" })
        prewarm = false;

        /**
         * 这个粒子系统在发射粒子之前会等待几秒。不能与预加热循环系统一起使用。
         */
        // @oav({ tooltip: "Delay in seconds that this Particle System will wait before emitting particles. Cannot be used together with a prewarmed looping system." })
        @serialize
        @oav({ tooltip: "这个粒子系统在发射粒子之前会等待几秒。不能与预加热循环系统一起使用。" })
        startDelay = 0;

        /**
         * 起始寿命为秒，粒子寿命为0时死亡。
         */
        @serialize
        // @oav({ tooltip: "Start lifetime is seconds, particle will die when its lifetime reaches 0." })
        @oav({ tooltip: "起始寿命为秒，粒子寿命为0时死亡。" })
        startLifetime = 5;

        /**
         * 粒子的起始速度，应用于起始方向。
         */
        @serialize
        // @oav({ tooltip: "The start speed of particles, applied in the starting direction." })
        @oav({ tooltip: "粒子的起始速度，应用于起始方向。" })
        startSpeed = 5;

        /**
         * 粒子的起始大小。
         */
        @serialize
        // @oav({ tooltip: "The start size of particles." })
        @oav({ tooltip: "粒子的起始大小。" })
        startSize = new Vector3(1, 1, 1);

        /**
         * 粒子的起始旋转角度。
         */
        @serialize
        // @oav({ tooltip: "The start rotation of particles in degress." })
        @oav({ tooltip: "粒子的起始旋转角度。" })
        startRotation = new Vector3();

        /**
         * 使一些粒子朝相反的方向旋转。(设置在0和1之间，值越大，翻转越多)
         */
        @serialize
        // @oav({ tooltip: "Cause some particles to spin in the opposite direction. (Set between 0 and 1, where a higher value causes more to flip)" })
        @oav({ tooltip: "使一些粒子朝相反的方向旋转。(设置在0和1之间，值越大，翻转越多)" })
        randomizeRotationDirection = 0;

        /**
         * 粒子的起始颜色。
         */
        @serialize
        // @oav({ tooltip: "The start color of particles." })
        @oav({ tooltip: "粒子的起始颜色。" })
        @watch("onStartColorChanged")
        startColor = new Color4();

        /**
         * 按物理管理器中定义的重力进行缩放。
         */
        @serialize
        // @oav({ tooltip: "Scales the gravity defined in Physics Manager." })
        @oav({ tooltip: "按物理管理器中定义的重力进行缩放。" })
        gravityModifier = 0;

        /**
         * 使粒子位置模拟在世界，本地或自定义空间。在本地空间中，它们相对于自己的转换而存在，在自定义空间中，它们相对于自定义转换。
         */
        @serialize
        // @oav({ tooltip: "Makes particle positions simulate in world, local or custom space. In local space they stay relative to their own Transform, and in custom space they are relative to the custom Transform." })
        @oav({ tooltip: "使粒子位置模拟在世界，本地或自定义空间。在本地空间中，它们相对于自己的转换而存在，在自定义空间中，它们相对于自定义转换。" })
        simulationSpace = ParticleSimulationSpace.Local;

        /**
         * 使粒子位置模拟相对于自定义转换组件。
         */
        @serialize
        // @oav({ tooltip: "Makes particle positions simulate relative to a custom Transform component." })
        @oav({ tooltip: "使粒子位置模拟相对于自定义转换组件。" })
        customSimulationSpace: Transform;

        /**
         * 缩放粒子系统的播放速度。
         */
        @serialize
        // @oav({ tooltip: "Scale the playback speed of the Particle System." })
        @oav({ tooltip: "缩放粒子系统的播放速度。" })
        simulationSpeed = 1;

        /**
         * 我们应该使用来自整个层次的组合尺度，仅仅是这个粒子节点，还是仅仅对形状模块应用尺度
         */
        @serialize
        // @oav({ tooltip: "Should we use the combined scale from our entire hierachy, just this particle node, or just apply scale to the shape module?" })
        @oav({ tooltip: "我们应该使用来自整个层次的组合尺度，仅仅是这个粒子节点，还是仅仅对形状模块应用尺度?" })
        scalingMode = ParticleScalingMode.Local;

        /**
         * 如果启用，系统将自动开始运行。注意，此设置在当前粒子效应中的所有粒子系统之间共享。
         */
        @serialize
        // @oav({ tooltip: "If enabled, the system will start palying automatically. Note that this setting is shared between all Particle Systems in the current particle effect." })
        @oav({ tooltip: "如果启用，系统将自动开始运行。注意，此设置在当前粒子效应中的所有粒子系统之间共享。" })
        playOnAwake = true;

        /**
         * 系统中粒子的数量将被这个数限制。如果达到这个目标，排放将暂时发射。
         */
        @serialize
        // @oav({ tooltip: "The number of particles in the system will be limited by this number. Emission will be temporarily halted if this is reached." })
        @oav({ tooltip: "系统中粒子的数量将被这个数限制。如果达到这个目标，排放将暂时发射。" })
        @watch("numParticlesChanged")
        maxParticles = 1000;

        /**
         * 每次播放效果时以不同的方式进行模拟。
         */
        @serialize
        // @oav({ tooltip: "Simulate differently each time the effect is played." })
        @oav({ tooltip: "每次播放效果时以不同的方式进行模拟。" })
        autoRandomSeed = true;

        /**
		 * 创建粒子属性
         * @param particle                  粒子
		 */
        generateParticle(particle: Particle, particleSystem: ParticleSystem)
        {
            particle.color.copyFrom(this.startColor);
        }

        private numParticlesChanged()
        {
            if (!this.particleSystem) return;
            this.particleSystem["numParticlesChanged"](this.maxParticles);
            this.particleSystem.invalidate();
        }

        private onStartColorChanged()
        {
            if (!this.particleSystem) return;
            this.particleSystem.invalidate();
        }
    }
}