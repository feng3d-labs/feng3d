namespace feng3d
{
    /**
     * Shape of the emitter volume, which controls where particles are emitted and their initial direction.
     * 发射体体积的形状，它控制粒子发射的位置和初始方向。
     */
    export class ParticleShapeModule extends ParticleModule
    {
        /**
         * Type of shape to emit particles from.
         * 发射粒子的形状类型。
         */
        @serialize
        // @oav({ tooltip: "Type of shape to emit particles from.", component: "OAVEnum", componentParam: { enumClass: ParticleSystemShapeType } })
        @oav({ tooltip: "发射粒子的形状类型。", component: "OAVEnum", componentParam: { enumClass: ParticleSystemShapeType } })
        get shapeType()
        {
            return this._shapeType;
        }
        set shapeType(v)
        {
            if (this._shapeType == v) return;
            this._shapeType = v;
            this._onTypeChanged();
        }
        private _shapeType: ParticleSystemShapeType;

        /**
         * 发射形状
         */
        @serialize
        @oav({ component: "OAVObjectView" })
        shape: ParticleSystemShape;

        /**
         * Align particles based on their initial direction of travel.
         * 根据粒子的初始运动方向排列粒子。
         * 
         * Using align to Direction in the Shape module forces the system to be rendered using Local Billboard Alignment.
         * 在形状模块中使用align to Direction迫使系统使用本地看板对齐方式呈现。
         */
        @serialize
        // @oav({ tooltip: "Align particles based on their initial direction of travel." })
        @oav({ tooltip: "根据粒子的初始运动方向排列粒子。" })
        alignToDirection = false;

        /**
         * Randomizes the starting direction of particles.
         * 随机化粒子的起始方向。
         */
        @serialize
        // @oav({ tooltip: "Randomizes the starting direction of particles." })
        @oav({ tooltip: "随机化粒子的起始方向。" })
        randomDirectionAmount = 0;

        /**
         * Spherizes the starting direction of particles.
         * 使粒子的起始方向球面化。
         */
        @serialize
        // @oav({ tooltip: "Spherizes the starting direction of particles." })
        @oav({ tooltip: "Spherizes the starting direction of particles." })
        sphericalDirectionAmount = 0;

        constructor()
        {
            super();
            this.shapeType = ParticleSystemShapeType.Cone;
        }

        /**
         * 初始化粒子状态
         * @param particle 粒子
         */
        initParticleState(particle: Particle)
        {
            this.shape.initParticleState(particle);
            if (this.alignToDirection)
            {
                var dir = particle.velocity;
                var mat = new Matrix4x4();
                mat.lookAt(dir, Vector3.Y_AXIS);

                var mat0 = Matrix4x4.fromRotation(particle.rotation.x, particle.rotation.y, particle.rotation.z);
                mat0.append(mat);

                particle.rotation = mat0.rotation;
            }
        }

        private _onTypeChanged()
        {
            var preValue = this.shape;
            switch (this.shapeType)
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
                case ParticleSystemShapeType.SingleSidedEdge:
                    this.shape = new ParticleSystemShapeEdge();
                    break;
            }
            serialization.setValue(this.shape, preValue);
            this.dispatch("refreshView");
        }
    }


}