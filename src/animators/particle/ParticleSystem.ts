namespace feng3d
{

    /**
     * 粒子系统
     * @author feng 2017-01-09
     */
    export class ParticleSystem extends MeshRenderer
    {

        /**
         * 是否正在播放
         */
        @oav({ componentParam: { tooltip: "是否播放中" } })
        @serialize
        isPlaying = true;

        /**
         * 粒子时间
         */
        @oav({ componentParam: { tooltip: "当前粒子时间" } })
        time = 0;

        /**
         * 播放速度
         */
        @oav({ componentParam: { tooltip: "播放速度，可以为负值，-1表示反方向一倍速度播放" } })
        @serialize
        playspeed = 1;

        /**
         * 周期
         */
        @oav({ componentParam: { tooltip: "粒子系统周期，time=0与time=10000有相同效果" } })
        @serialize
        cycle = 10000;

        /**
         * 粒子数量
         */
        @watch("invalidate")
        @oav({ componentParam: { tooltip: "粒子系统拥有粒子的数量" } })
        @serialize
        numParticles = 1000;

        @oav({ component: "OAVDefault", componentParam: { dragparam: { accepttype: "geometry", datatype: "geometry" } } })
        @serialize
        geometry: Geometry = new PointGeometry();

        @oav({ component: "OAVDefault", componentParam: { dragparam: { accepttype: "material", datatype: "material" } } })
        @serialize
        material: Material = materialFactory.create("particle", { renderParams: { renderMode: RenderMode.POINTS } });

        /**
         * 粒子全局属性
         */
        @serialize
        @oav({ block: "全局属性", component: "OAVObjectView", componentParam: { tooltip: "粒子全局属性，作用与所有粒子。" } })
        readonly particleGlobal = new ParticleGlobal();

        /**
         * 粒子最大数量
         */
        @watch("numParticlesChanged")
        @oav({ componentParam: { tooltip: "粒子系统拥有粒子的数量" } })
        @serialize
        maxParticles = 1000;

        /**
         * 开始寿命，粒子发射器发射时赋予粒子寿命以s为单位，粒子的寿命将会随时间而流逝，等于0时将会消失
         */
        startLifetime = 5;

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

        private particleEmission = new ParticleEmission();

        /**
         * 粒子状态控制模块列表
         */
        @serialize
        @oav({ block: "粒子模块", component: "OAVParticleComponentList" })
        readonly components = [
            this.particleEmission,
            new ParticlePosition(),
            new ParticleVelocity(),
            new ParticleColor(),
            new ParticleBillboard(),
        ];

        /**
         * 属性数据列表
         */
        private _attributes: { [name: string]: number[] } = {};
        private _isDirty = true;

        get single() { return true; }

        init(gameObject: GameObject)
        {
            super.init(gameObject);
        }

        update(interval: number)
        {
            if (!this.isPlaying) return;

            this.time = (this.time + (interval * this.playspeed / 1000) + this.cycle) % this.cycle;

            this.particleEmission.emit(this.time, this.deathParticles, this.survivalParticles, this.changedParticles);
        }

        @oav({ componentParam: { tooltip: "修改粒子组件内数据后，可能需要调用该函数标记变化。" } })
        public invalidate()
        {
            this._isDirty = true;
        }

        private numParticlesChanged()
        {
            this.particles = [];
            //
            for (var i = 0; i < this.maxParticles; i++)
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
            for (var i = 0; i < this.numParticles; i++)
            {
                var particle = new Particle(i);
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

        preRender(renderAtomic: RenderAtomic)
        {
            super.preRender(renderAtomic);

            this.components.forEach(element =>
            {
                element.setRenderState(this, renderAtomic);
            });

            if (this._isDirty)
            {
                this.generateParticles();
                this._isDirty = false;
            }

            renderAtomic.instanceCount = () => this.numParticles;
            //
            renderAtomic.uniforms.u_particleTime = () => this.time;

            //
            for (const key in this.particleGlobal)
            {
                if (this.particleGlobal.hasOwnProperty(key))
                {
                    const element = this.particleGlobal[key];
                    if (element)
                    {
                        renderAtomic.uniforms["u_particle_" + key] = element;
                    }
                }
            }

            //更新宏定义
            for (var attribute in this._attributes)
            {
                var vector3DData = this._attributes[attribute];

                var attributeRenderData = renderAtomic.attributes[attribute] = renderAtomic.attributes[attribute] || new Attribute(attribute, vector3DData);
                attributeRenderData.data = vector3DData;
                attributeRenderData.size = vector3DData.length / this.numParticles;
                attributeRenderData.divisor = 1;
            }
        }
    }
}