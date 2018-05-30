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
         * 粒子状态控制模块列表
         */
        @serialize
        @oav({ block: "粒子模块", component: "OAVParticleComponentList" })
        readonly components = [
            new ParticleEmission(),
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
        }

        @oav({ componentParam: { tooltip: "修改粒子组件内数据后，可能需要调用该函数标记变化。" } })
        public invalidate()
        {
            this._isDirty = true;
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
                var particle = new Particle();
                particle.index = i;
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