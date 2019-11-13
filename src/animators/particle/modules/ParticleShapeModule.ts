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
        shape: ParticleSystemShapeBase;

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

        private shapeSphere = new ParticleSystemShapeSphere();
        private shapeHemisphere = new ParticleSystemShapeHemisphere();
        private shapeCone = new ParticleSystemShapeCone();
        private shapeBox = new ParticleSystemShapeBox();
        private shapeCircle = new ParticleSystemShapeCircle();
        private shapeEdge = new ParticleSystemShapeEdge();

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
            if (!this.enabled) return;
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
            var length = particle.velocity.length;
            if (this.randomDirectionAmount > 0)
            {
                var velocity = Vector3.random().scaleNumber(2).subNumber(1).normalize(length);
                particle.velocity.lerpNumber(velocity, this.randomDirectionAmount).normalize(length);
            }
            if (this.sphericalDirectionAmount > 0)
            {
                var velocity = particle.position.clone().normalize(length);
                particle.velocity.lerpNumber(velocity, this.sphericalDirectionAmount).normalize(length);
            }
        }

        private _onTypeChanged()
        {
            var preValue = this.shape;
            switch (this.shapeType)
            {
                case ParticleSystemShapeType.Sphere:
                    this.shapeSphere.emitFromShell = false;
                    this.shape = this.shapeSphere;
                    break;
                case ParticleSystemShapeType.SphereShell:
                    this.shapeSphere.emitFromShell = true;
                    this.shape = this.shapeSphere;
                    break;
                case ParticleSystemShapeType.Hemisphere:
                    this.shapeHemisphere.emitFromShell = false;
                    this.shape = this.shapeHemisphere;
                    break;
                case ParticleSystemShapeType.HemisphereShell:
                    this.shapeHemisphere.emitFromShell = true;
                    this.shape = this.shapeHemisphere;
                    break;
                case ParticleSystemShapeType.Cone:
                    this.shapeCone.emitFrom = ParticleSystemShapeConeEmitFrom.Base;
                    this.shape = this.shapeCone;
                    break;
                case ParticleSystemShapeType.ConeShell:
                    this.shapeCone.emitFrom = ParticleSystemShapeConeEmitFrom.BaseShell;
                    this.shape = this.shapeCone;
                    break;
                case ParticleSystemShapeType.ConeVolume:
                    this.shapeCone.emitFrom = ParticleSystemShapeConeEmitFrom.Volume;
                    this.shape = this.shapeCone;
                    break;
                case ParticleSystemShapeType.ConeVolumeShell:
                    this.shapeCone.emitFrom = ParticleSystemShapeConeEmitFrom.VolumeShell;
                    this.shape = this.shapeCone;
                    break;
                case ParticleSystemShapeType.Box:
                    this.shapeBox.emitFrom = ParticleSystemShapeBoxEmitFrom.Volume;
                    this.shape = this.shapeBox;
                    break;
                case ParticleSystemShapeType.BoxShell:
                    this.shapeBox.emitFrom = ParticleSystemShapeBoxEmitFrom.Shell;
                    this.shape = this.shapeBox;
                    break;
                case ParticleSystemShapeType.BoxEdge:
                    this.shapeBox.emitFrom = ParticleSystemShapeBoxEmitFrom.Edge;
                    this.shape = this.shapeBox;
                    break;
                case ParticleSystemShapeType.Mesh:
                case ParticleSystemShapeType.MeshRenderer:
                case ParticleSystemShapeType.SkinnedMeshRenderer:
                    console.warn(`未实现 ParticleSystemShapeType.Mesh`);
                    this.shape = null;
                    break;
                case ParticleSystemShapeType.Circle:
                    this.shapeCircle.emitFromEdge = false;
                    this.shape = this.shapeCircle;
                    break;
                case ParticleSystemShapeType.CircleEdge:
                    this.shapeCircle.emitFromEdge = true;
                    this.shape = this.shapeCircle;
                    break;
                case ParticleSystemShapeType.SingleSidedEdge:
                    this.shape = this.shapeEdge;
                    break;
            }
            serialization.setValue(this.shape, preValue);
            this.dispatch("refreshView");
        }
    }


}