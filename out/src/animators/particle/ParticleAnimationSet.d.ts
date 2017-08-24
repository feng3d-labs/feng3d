declare namespace feng3d {
    class ParticleAnimationSet extends RenderDataHolder {
        /**
         * 属性数据列表
         */
        private _attributes;
        private _animations;
        /**
         * 生成粒子函数列表，优先级越高先执行
         */
        generateFunctions: ({
            generate: (particle: Particle) => void;
            priority: number;
        })[];
        private particleGlobal;
        /**
         * 粒子数量
         */
        numParticles: number;
        private _isDirty;
        constructor();
        /**
         * 粒子全局属性，作用于所有粒子元素
         */
        setGlobal<K extends keyof ParticleGlobal>(property: K, value: ParticleGlobal[K]): void;
        addAnimation(animation: ParticleComponent): void;
        update(particleAnimator: ParticleAnimator): void;
        /**
         * 生成粒子
         */
        private generateParticles();
        /**
         * 收集粒子数据
         * @param particle      粒子
         */
        private collectionParticle(particle);
        /**
         * 收集粒子属性数据
         * @param attributeID       属性编号
         * @param index             粒子编号
         * @param data              属性数据
         */
        private collectionParticleAttribute(attribute, particle);
    }
}
