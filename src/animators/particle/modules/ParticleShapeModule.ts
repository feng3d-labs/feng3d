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
        get shapeType()
        {
            return this._shapeType;
        }
        set shapeType(v)
        {
            if (this._shapeType == v) return;
            this._shapeType = v;
            this._onShapeTypeChanged();
        }
        private _shapeType: ParticleSystemShapeType;

        /**
         * Type of shape to emit particles from.
         * 发射粒子的形状类型。
         */
        // @oav({ tooltip: "Type of shape to emit particles from.", component: "OAVEnum", componentParam: { enumClass: ParticleSystemShape } })
        @oav({ tooltip: "发射粒子的形状类型。", component: "OAVEnum", componentParam: { enumClass: ParticleSystemShape } })
        get shape()
        {
            return this._shape;
        }
        set shape(v)
        {
            if (this._shape == v) return;
            this._shape = v;
            this._onShapeChanged();
        }
        private _shape: ParticleSystemShape;

        /**
         * 当前使用的发射形状
         */
        @serialize
        @oav({ component: "OAVObjectView" })
        activeShape: ParticleSystemShapeBase;

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

        private _shapeSphere = new ParticleSystemShapeSphere();
        private _shapeHemisphere = new ParticleSystemShapeHemisphere();
        private _shapeCone = new ParticleSystemShapeCone();
        private _shapeBox = new ParticleSystemShapeBox();
        private _shapeCircle = new ParticleSystemShapeCircle();
        private _shapeEdge = new ParticleSystemShapeEdge();

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
            this.activeShape.initParticleState(particle);
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

        private _onShapeTypeChanged()
        {
            var preValue = this.activeShape;
            switch (this.shapeType)
            {
                case ParticleSystemShapeType.Sphere:
                    this._shape = ParticleSystemShape.Sphere;
                    this._shapeSphere.emitFromShell = false;
                    this.activeShape = this._shapeSphere;
                    break;
                case ParticleSystemShapeType.SphereShell:
                    this._shape = ParticleSystemShape.Sphere;
                    this._shapeSphere.emitFromShell = true;
                    this.activeShape = this._shapeSphere;
                    break;
                case ParticleSystemShapeType.Hemisphere:
                    this._shape = ParticleSystemShape.Hemisphere;
                    this._shapeHemisphere.emitFromShell = false;
                    this.activeShape = this._shapeHemisphere;
                    break;
                case ParticleSystemShapeType.HemisphereShell:
                    this._shape = ParticleSystemShape.Hemisphere;
                    this._shapeHemisphere.emitFromShell = true;
                    this.activeShape = this._shapeHemisphere;
                    break;
                case ParticleSystemShapeType.Cone:
                    this._shape = ParticleSystemShape.Cone;
                    this._shapeCone.emitFrom = ParticleSystemShapeConeEmitFrom.Base;
                    this.activeShape = this._shapeCone;
                    break;
                case ParticleSystemShapeType.ConeShell:
                    this._shape = ParticleSystemShape.Cone;
                    this._shapeCone.emitFrom = ParticleSystemShapeConeEmitFrom.BaseShell;
                    this.activeShape = this._shapeCone;
                    break;
                case ParticleSystemShapeType.ConeVolume:
                    this._shape = ParticleSystemShape.Cone;
                    this._shapeCone.emitFrom = ParticleSystemShapeConeEmitFrom.Volume;
                    this.activeShape = this._shapeCone;
                    break;
                case ParticleSystemShapeType.ConeVolumeShell:
                    this._shape = ParticleSystemShape.Cone;
                    this._shapeCone.emitFrom = ParticleSystemShapeConeEmitFrom.VolumeShell;
                    this.activeShape = this._shapeCone;
                    break;
                case ParticleSystemShapeType.Box:
                    this._shape = ParticleSystemShape.Box;
                    this._shapeBox.emitFrom = ParticleSystemShapeBoxEmitFrom.Volume;
                    this.activeShape = this._shapeBox;
                    break;
                case ParticleSystemShapeType.BoxShell:
                    this._shape = ParticleSystemShape.Box;
                    this._shapeBox.emitFrom = ParticleSystemShapeBoxEmitFrom.Shell;
                    this.activeShape = this._shapeBox;
                    break;
                case ParticleSystemShapeType.BoxEdge:
                    this._shape = ParticleSystemShape.Box;
                    this._shapeBox.emitFrom = ParticleSystemShapeBoxEmitFrom.Edge;
                    this.activeShape = this._shapeBox;
                    break;
                case ParticleSystemShapeType.Mesh:
                    this._shape = ParticleSystemShape.Mesh;
                    console.warn(`未实现 ParticleSystemShapeType.Mesh`);
                    this.activeShape = null;
                    break;
                case ParticleSystemShapeType.MeshRenderer:
                    this._shape = ParticleSystemShape.MeshRenderer;
                    console.warn(`未实现 ParticleSystemShapeType.Mesh`);
                    this.activeShape = null;
                    break;
                case ParticleSystemShapeType.SkinnedMeshRenderer:
                    this._shape = ParticleSystemShape.SkinnedMeshRenderer;
                    console.warn(`未实现 ParticleSystemShapeType.Mesh`);
                    this.activeShape = null;
                    break;
                case ParticleSystemShapeType.Circle:
                    this._shape = ParticleSystemShape.Circle;
                    this._shapeCircle.emitFromEdge = false;
                    this.activeShape = this._shapeCircle;
                    break;
                case ParticleSystemShapeType.CircleEdge:
                    this._shape = ParticleSystemShape.Circle;
                    this._shapeCircle.emitFromEdge = true;
                    this.activeShape = this._shapeCircle;
                    break;
                case ParticleSystemShapeType.SingleSidedEdge:
                    this._shape = ParticleSystemShape.Edge;
                    this.activeShape = this._shapeEdge;
                    break;
            }
            serialization.setValue(this.activeShape, preValue);
            this.dispatch("refreshView");
        }

        private _onShapeChanged()
        {
            switch (this.shape)
            {
                case ParticleSystemShape.Sphere:
                    this.shapeType = this._shapeSphere.emitFromShell ? ParticleSystemShapeType.SphereShell : ParticleSystemShapeType.Sphere;
                    break;
                case ParticleSystemShape.Hemisphere:
                    this.shapeType = this._shapeHemisphere.emitFromShell ? ParticleSystemShapeType.HemisphereShell : ParticleSystemShapeType.Hemisphere;
                case ParticleSystemShape.Cone:
                    switch (this._shapeCone.emitFrom)
                    {
                        case ParticleSystemShapeConeEmitFrom.Base:
                            this.shapeType = ParticleSystemShapeType.Cone;
                            break;
                        case ParticleSystemShapeConeEmitFrom.BaseShell:
                            this.shapeType = ParticleSystemShapeType.ConeShell;
                            break;
                        case ParticleSystemShapeConeEmitFrom.Volume:
                            this.shapeType = ParticleSystemShapeType.ConeVolume;
                            break;
                        case ParticleSystemShapeConeEmitFrom.VolumeShell:
                            this.shapeType = ParticleSystemShapeType.ConeVolumeShell;
                            break;
                        default:
                            console.warn(`错误ParticleSystemShapeCone.emitFrom值 ${this._shapeCone.emitFrom}`);
                            break;
                    }
                case ParticleSystemShape.Box:
                    switch (this._shapeBox.emitFrom)
                    {
                        case ParticleSystemShapeBoxEmitFrom.Volume:
                            this.shapeType = ParticleSystemShapeType.Box;
                            break;
                        case ParticleSystemShapeBoxEmitFrom.Shell:
                            this.shapeType = ParticleSystemShapeType.BoxShell;
                            break;
                        case ParticleSystemShapeBoxEmitFrom.Edge:
                            this.shapeType = ParticleSystemShapeType.BoxEdge;
                            break;
                        default:
                            console.warn(`错误ParticleSystemShapeCone.emitFrom值 ${this._shapeCone.emitFrom}`);
                            break;
                    }
                case ParticleSystemShape.Mesh:
                    this.shapeType = ParticleSystemShapeType.Mesh;
                    break;
                case ParticleSystemShape.MeshRenderer:
                    this.shapeType = ParticleSystemShapeType.MeshRenderer;
                    break;
                case ParticleSystemShape.SkinnedMeshRenderer:
                    this.shapeType = ParticleSystemShapeType.SkinnedMeshRenderer;
                    break;
                case ParticleSystemShape.Circle:
                    this.shapeType = this._shapeCircle.emitFromEdge ? ParticleSystemShapeType.CircleEdge : ParticleSystemShapeType.Circle;
                case ParticleSystemShape.Edge:
                    this.shapeType = ParticleSystemShapeType.SingleSidedEdge;
                    break;
            }
        }
    }


}