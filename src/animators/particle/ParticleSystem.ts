namespace feng3d
{

    export interface ComponentMap { ParticleSystem: ParticleSystem }
    /**
     * 粒子系统
     */
    export class ParticleSystem extends Model
    {
        __class__: "feng3d.ParticleSystem" = "feng3d.ParticleSystem";

        /**
         * 是否正在播放
         */
        get isPlaying()
        {
            return this._isPlaying;
        }
        private _isPlaying = false;

        /**
         * 粒子时间
         */
        time = 0;

        @serialize
        @oav({ block: "main", component: "OAVObjectView" })
        main: ParticleMainModule;

        @serialize
        @oav({ block: "emission", component: "OAVObjectView" })
        particleEmission: ParticleEmission;

        /**
         * 粒子全局属性
         */
        @serialize
        // @oav({ block: "全局属性", component: "OAVObjectView", tooltip: "粒子全局属性，作用与所有粒子。" })
        readonly particleGlobal = new ParticleGlobal();

        /**
         * 粒子列表
         */
        private particles: Particle[] = [];
        /**
         * 死亡粒子列表，这些粒子可以被发射器进行发射
         */
        private deathParticles: Particle[] = [];
        /**
         * 存活粒子列表，这些粒子将会在帧刷中进行状态计算，当生命周期结束时将会被移除且加入到死亡粒子列表中
         */
        private survivalParticles: Particle[] = [];
        /**
         * 被修改过的粒子列表，这些粒子将会在渲染前进行更新渲染va数据
         */
        private changedParticles: Particle[] = [];

        /**
         * 属性数据列表
         */
        private _attributes: { [name: string]: number[] } = {};
        private _isInvalid = true;

        /**
         * 粒子状态控制模块列表
         */
        @serialize
        @oav({ block: "粒子模块", component: "OAVParticleComponentList" })
        readonly components = [
            new ParticleVelocity(),
            new ParticleBillboard(),
        ];

        @oav({ block: "Renderer" })
        geometry = Geometry.billboard;

        @oav({ block: "Renderer" })
        material = Material.particle;

        @oav({ block: "Renderer" })
        @serialize
        castShadows = true;

        @oav({ block: "Renderer" })
        @serialize
        receiveShadows = true;

        get single() { return true; }

        init(gameObject: GameObject)
        {
            super.init(gameObject);

            this.main = this.main || new ParticleMainModule()
            this.main.particleSystem = this;

            this.particleEmission = this.particleEmission || new ParticleEmission();
            this.particleEmission.particleSystem = this;
        }

        update(interval: number)
        {
            if (!this.isPlaying) return;

            this.time = this.time + this.main.simulationSpeed * interval / 1000;

            var t = (this.time - this.main.startDelay) % this.main.duration;


            this.particleEmission.emit(t, this.deathParticles, this.survivalParticles, this.changedParticles);
        }

        /**
         * 停止
         */
        stop()
        {
            this._isPlaying = false;
            this.time = 0;
        }

        /**
         * 播放
         */
        play()
        {
            this._isPlaying = true;
            this.time = 0;
        }

        /**
         * 暂停
         */
        pause()
        {
            this._isPlaying = false;
        }

        /**
         * 继续
         */
        continue()
        {
            this._isPlaying = true;
        }

        invalidate()
        {
            this._isInvalid = true;
        }

        private numParticlesChanged(maxParticles: number)
        {
            this.particles = [];
            //
            for (var i = 0; i < maxParticles; i++)
            {
                this.particles.push(new Particle(i));
            }
            if (this.particleEmission) this.particleEmission.pretime = 0;
            this.deathParticles = this.particles.concat();
            this.survivalParticles = [];
            this.changedParticles = this.particles.concat();
            this.invalidate();
        }

        /**
         * 生成粒子
         */
        private generateParticles()
        {
            this._attributes = {};

            //
            for (var i = 0; i < this.main.maxParticles; i++)
            {
                var particle = new Particle(i);
                this.particleEmission.generateParticle(particle, this);
                this.main.generateParticle(particle, this);
                this.components.forEach(element =>
                {
                    if (element.enabled)
                        element.generateParticle(particle, this);
                });
                this.collectionParticle(particle);
            }
        }

        /**
         * 收集粒子数据
         * @param particle      粒子
         */
        private collectionParticle(particle: Particle)
        {
            for (var attribute in particle)
            {
                this.collectionParticleAttribute(attribute, particle);
            }
        }

        /**
         * 收集粒子属性数据
         * @param attributeID       属性编号
         * @param index             粒子编号
         * @param data              属性数据      
         */
        private collectionParticleAttribute(attribute: string, particle: Particle)
        {
            var attributeID = "a_particle_" + attribute;
            var data = particle[attribute];
            var index = particle.index;
            //
            var vector3DData: number[];
            if (typeof data == "number")
            {
                vector3DData = this._attributes[attributeID] = this._attributes[attributeID] || [];
                vector3DData[index] = data;
            } else if (data instanceof Vector3)
            {
                vector3DData = this._attributes[attributeID] = this._attributes[attributeID] || [];
                vector3DData[index * 3] = data.x;
                vector3DData[index * 3 + 1] = data.y;
                vector3DData[index * 3 + 2] = data.z;
            } else if (data instanceof Color4)
            {
                vector3DData = this._attributes[attributeID] = this._attributes[attributeID] || [];
                vector3DData[index * 4] = data.r;
                vector3DData[index * 4 + 1] = data.g;
                vector3DData[index * 4 + 2] = data.b;
                vector3DData[index * 4 + 3] = data.a;
            } else
            {
                throw new Error(`无法处理${classUtils.getQualifiedClassName(data)}粒子属性`);
            }
        }

        private _awaked = false;

        beforeRender(gl: GL, renderAtomic: RenderAtomic, scene3d: Scene3D, camera: Camera)
        {
            super.beforeRender(gl, renderAtomic, scene3d, camera);

            if (Boolean(scene3d.runEnvironment & RunEnvironment.feng3d) && !this._awaked)
            {
                this._isPlaying = this.main.playOnAwake;
                this._awaked = true;
            }

            //
            this.particleEmission.setRenderState(this, renderAtomic);
            this.main.setRenderState(this, renderAtomic);
            this.components.forEach(element =>
            {
                element.setRenderState(this, renderAtomic);
            });

            if (this._isInvalid)
            {
                this.generateParticles();
                this._isInvalid = false;
            }

            renderAtomic.instanceCount = this.main.maxParticles;
            //
            renderAtomic.uniforms.u_particleTime = this.time - this.main.startDelay;

            //
            renderAtomic.shaderMacro.HAS_PARTICLE_ANIMATOR = true;

            //
            for (const key in this.particleGlobal)
            {
                if (this.particleGlobal.hasOwnProperty(key))
                {
                    const element = this.particleGlobal[key];
                    if (element)
                    {
                        renderAtomic.uniforms["u_particle_" + key] = element;
                        renderAtomic.shaderMacro["D_u_particle_" + key] = true;
                    } else
                    {
                        renderAtomic.shaderMacro["D_u_particle_" + key] = false;
                    }
                }
            }

            //更新宏定义
            for (var attribute in this._attributes)
            {
                var vector3DData = this._attributes[attribute];

                var attributeRenderData = renderAtomic.attributes[attribute] = renderAtomic.attributes[attribute] || new Attribute(attribute, vector3DData);
                attributeRenderData.data = vector3DData;
                attributeRenderData.size = vector3DData.length / this.main.maxParticles;
                attributeRenderData.divisor = 1;

                renderAtomic.shaderMacro["D_" + attribute] = true;
            }
        }
    }

    Feng3dAssets.setAssets(Geometry.billboard = new PlaneGeometry().value({ name: "Billboard", assetsId: "Billboard-Geometry", yUp: false, hideFlags: HideFlags.NotEditable }));
}