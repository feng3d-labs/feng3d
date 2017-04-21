module feng3d
{
    /**
     * 天空盒3D对象
     * @author feng 2017-02-06
     */
    export class ParticleObject3D extends GameObject
    {
        /**
         * 构建3D对象
         */
        constructor(name = "particle")
        {
            super(name);

            this.getOrCreateComponentByClass(Model).geometry = new PointGeometry();
            this.getOrCreateComponentByClass(Model).material = new ParticleMaterial();

            var particleAnimator = this.getOrCreateComponentByClass(ParticleAnimator);
            particleAnimator.cycle = 10;
            particleAnimator.numParticles = 1000;
            //发射组件
            var emission = new ParticleEmission();
            //每秒发射数量
            emission.rate = 50;
            //批量发射
            emission.bursts.push(
                { time: 1, particles: 100 },
                { time: 2, particles: 100 },
                { time: 3, particles: 100 },
                { time: 4, particles: 100 },
                { time: 5, particles: 100 },
            );
            //通过组件来创建粒子初始状态
            particleAnimator.addComponent(emission);
            particleAnimator.addComponent(new ParticlePosition());
            particleAnimator.addComponent(new ParticleVelocity());
            // particleAnimator.addComponent(new ParticleAcceleration());
            particleAnimator.particleGlobal.acceleration = new Vector3D(0, -9.8, 0);
            //通过函数来创建粒子初始状态
            particleAnimator.addComponent(new ParticleColor());
            // particleAnimator.generateFunctions.push({
            //     generate: (particle) =>
            //     {
            //         particle.color = new Color(1, 0, 0, 1).mix(new Color(0, 1, 0, 1), particle.index / particle.total);
            //     }, priority: 0
            // });
        }
    }
}