namespace feng3d
{

    /**
     * 粒子动画
     * @author feng 2017-01-09
     */
    export class ParticleAnimator extends Component
    {
        /**
         * 是否正在播放
         */
        @oav()
        @serialize
        get isPlaying()
        {
            return this._isPlaying;
        }
        set isPlaying(value)
        {
            if (this._isPlaying == value)
                return;
            if (this._isPlaying)
            {
                ticker.offframe(this.update, this);
            }
            this._isPlaying = value;
            if (this._isPlaying)
            {
                this.preTime = Date.now();
                ticker.onframe(this.update, this);
            }
        }
        private _isPlaying = true;

        /**
         * 粒子时间
         */
        @oav()
        @serialize
        time = 0;

        /**
         * 起始时间
         */
        preTime = 0;

        /**
         * 播放速度
         */
        @oav()
        @serialize
        playspeed = 1;

        /**
         * 周期
         */
        @oav()
        @serialize
        cycle = 10000;

        /**
         * 生成粒子函数列表，优先级越高先执行
         */
        @serialize
        generateFunctions: ({ generate: (particle: Particle) => void, priority: number })[] = [];

        /**
         * 属性数据列表
         */
        private _attributes: { [name: string]: number[] } = {};

        @serialize
        @oav()
        readonly animations = {
            emission: new ParticleEmission(),
            position: new ParticlePosition(),
            velocity: new ParticleVelocity(),
            color: new ParticleColor(),
            billboard: new ParticleBillboard(),
        };

        /**
         * 粒子全局属性
         */
        @serialize
        @oav()
        readonly particleGlobal = new ParticleGlobal();

        /**
         * 粒子数量
         */
        @watch("invalidate")
        @oav()
        @serialize
        numParticles = 1000;

        private _isDirty = true;

        get single() { return true; }

        init(gameObject: GameObject)
        {
            super.init(gameObject);

            if (this._isPlaying)
            {
                this.preTime = Date.now();
                ticker.onframe(this.update, this);
            }

            this.updateRenderState();
        }

        private update()
        {
            this.time = (this.time + ((Date.now() - this.preTime) * this.playspeed / 1000) + this.cycle) % this.cycle;
            this.preTime = Date.now();

            this.updateRenderState();
        }

        private updateRenderState()
        {
            for (const key in this.animations)
            {
                if (this.animations.hasOwnProperty(key))
                {
                    const element: ParticleComponent = this.animations[key];
                    element.setRenderState(this);
                }
            }

            if (this._isDirty)
            {
                this.generateParticles();
                this._isDirty = false;
            }
        }

        public invalidate()
        {
            this._isDirty = true;
        }

        /**
         * 生成粒子
         */
        private generateParticles()
        {
            var generateFunctions = this.generateFunctions.concat();

            this._attributes = {};

            for (const key in this.animations)
            {
                if (this.animations.hasOwnProperty(key))
                {
                    const element: ParticleComponent = this.animations[key];
                    if (element.enable)
                        generateFunctions.push({ generate: element.generateParticle.bind(element), priority: element.priority });
                }
            }

            //按优先级排序，优先级越高先执行
            generateFunctions.sort((a: { priority: number; }, b: { priority: number; }) => { return b.priority - a.priority; })
            //
            for (var i = 0; i < this.numParticles; i++)
            {
                var particle = <Particle>{};
                particle.index = i;
                particle.total = this.numParticles;
                generateFunctions.forEach(element =>
                {
                    element.generate(particle);
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
            var numParticles = particle.total;
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
                throw new Error(`无法处理${ClassUtils.getQualifiedClassName(data)}粒子属性`);
            }
        }

        preRender(renderAtomic: RenderAtomic)
        {
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

                var attributeRenderData = renderAtomic.attributes[name] = renderAtomic.attributes[name] || new Attribute(name, vector3DData);
                attributeRenderData.data = vector3DData;
                attributeRenderData.size = vector3DData.length / this.numParticles;
                attributeRenderData.divisor = 1;
            }
        }
    }
}