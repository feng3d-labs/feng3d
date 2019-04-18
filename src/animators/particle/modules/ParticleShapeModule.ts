namespace feng3d
{
    /**
     * Shape of the emitter volume, which controls where particles are emitted and their initial direction.
     * 发射体体积的形状，它控制粒子发射的位置和初始方向。
     */
    export class ParticleShapeModule extends ParticleModule
    {
        /**
         * 发射形状类型
         */
        @serialize
        @watch("_onTypeChanged")
        @oav({ tooltip: "发射形状类型", component: "OAVEnum", componentParam: { enumClass: ParticleSystemShapeType } })
        type = ParticleSystemShapeType.Cone;

        /**
         * 发射形状
         */
        @serialize
        @oav({ component: "OAVObjectView" })
        shape: ParticleSystemShape;

        /**
         * 初始化粒子状态
         * @param particle 粒子
         */
        initParticleState(particle: Particle)
        {
            this.shape.initParticleState(particle);
        }

        private _onTypeChanged()
        {
            var preValue = this.shape;
            switch (this.type)
            {
                case ParticleSystemShapeType.Cone:
                    this.shape = new ParticleSystemShapeCone();
                    break;
                case ParticleSystemShapeType.Sphere:
                    this.shape = new ParticleSystemShapeSphere();
                    break;
                case ParticleSystemShapeType.Box:
                    this.shape = new ParticleSystemShapeBox();
                    break;
                case ParticleSystemShapeType.Circle:
                    this.shape = new ParticleSystemShapeCircle();
                    break;
                case ParticleSystemShapeType.Edge:
                    this.shape = new ParticleSystemShapeEdge();
                    break;
            }
            serialization.setValue(this.shape, preValue);
            this.dispatch("refreshView");
        }
    }


}