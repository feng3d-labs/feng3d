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
        shape: Object;

        private _onTypeChanged()
        {
            var preValue = this.shape;
            switch (this.type)
            {
                case ParticleSystemShapeType.Cone:
                    this.shape = new ParticleSystemShapeCone();
                    serialization.setValue(this.shape, preValue);
                    break;
                case ParticleSystemShapeType.Sphere:
                    this.shape = new ParticleSystemShapeSphere();
                    serialization.setValue(this.shape, preValue);
                    break;
            }

            this.dispatch("refreshView");
        }
    }


}