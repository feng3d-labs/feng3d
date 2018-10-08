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
        emission: ParticleEmission;

        /**
         * 粒子全局属性
         */
        @serialize
        // @oav({ block: "全局属性", component: "OAVObjectView", tooltip: "粒子全局属性，作用与所有粒子。" })
        readonly particleGlobal = new ParticleGlobal();

        /**
         * 粒子池，用于存放未发射或者死亡粒子
         */
        private particlePool: Particle[] = [];
        /**
         * 活跃的粒子列表
         */
        private activeParticles: Particle[] = [];

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

            this.emission = this.emission || new ParticleEmission();
            this.emission.particleSystem = this;
        }

        update(interval: number)
        {
            if (!this.isPlaying) return;

            this.time = this.time + this.main.simulationSpeed * interval / 1000;

            this.updateActiveParticlesState();

            this.emit();

            this._preEmitTime = this.time;
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

        /**
         * 上次发射时间
         */
        private _preEmitTime = 0;

        /**
         * 发射粒子
         * @param time 当前粒子时间
         */
        emit()
        {
            // 判断是否达到最大粒子数量
            if (this.activeParticles.length >= this.main.maxParticles) return;

            // 判断是否开始发射
            if (this.time <= this.main.startDelay) return;

            var duration = this.main.duration;
            var preRealEmitTime = this._preEmitTime - this.main.startDelay;

            // 判断是否结束发射
            if (!this.main.loop && preRealEmitTime >= duration) return;

            // 计算最后发射时间
            var realEmitTime = this.time - this.main.startDelay;
            if (!this.main.loop) realEmitTime = Math.min(realEmitTime, duration + this.main.startDelay);

            // 
            var emits: { time: number, num: number }[] = [];
            // 单粒子发射周期
            var step = 1 / this.emission.rate;
            var bursts = this.emission.bursts.concat().sort((a, b) => { return a.time - b.time });;

            // 遍历所有发射周期
            var cycleEndIndex = Math.ceil(realEmitTime / duration);
            var cycleStartIndex = Math.floor(preRealEmitTime / duration);
            for (let k = cycleStartIndex; k < cycleEndIndex; k++)
            {
                var cycleStartTime = k * duration;
                var cycleEndTime = (k + 1) * duration;

                // 单个周期内的起始与结束时间
                var startTime = Math.max(preRealEmitTime, cycleStartTime);
                var endTime = Math.min(realEmitTime, cycleEndTime);

                // 处理稳定发射
                var singleStart = Math.ceil(startTime / step) * step;
                var singleEnd = Math.ceil(endTime / step) * step;
                for (var i = singleStart; i < singleEnd; i += step)
                {
                    emits.push({ time: i, num: 1 });
                }

                // 处理喷发
                var inCycleStart = startTime - cycleStartTime;
                var inCycleEnd = endTime - cycleStartTime;
                for (let i = 0; i < bursts.length; i++)
                {
                    const burst = bursts[i];
                    if (inCycleStart <= burst.time && burst.time <= inCycleEnd && burst.time <= realEmitTime)
                    {
                        emits.push({ time: cycleStartTime + burst.time, num: burst.num });
                    }
                }
            }


        }

        invalidate()
        {
            this._isInvalid = true;
        }

        /**
         * 更新活跃粒子状态
         */
        private updateActiveParticlesState()
        {
            for (let i = this.activeParticles.length - 1; i >= 0; i--)
            {
                var particle = this.activeParticles[i];
                if (particle.birthTime + particle.lifetime >= this.time)
                {
                    this.activeParticles.splice(i, 1);
                    this.particlePool.push(particle);
                } else
                {
                    this.updateParticleState(particle);
                }
            }
        }

        /**
         * 更新粒子状态
         * @param particle 粒子
         */
        private updateParticleState(particle: Particle)
        {

        }

        private numParticlesChanged(maxParticles: number)
        {
            this.particlePool = [];
            //
            for (var i = 0; i < maxParticles; i++)
            {
                this.particlePool.push(new Particle(i));
            }
            this._preEmitTime = 0;
            this.activeParticles = this.particlePool.concat();
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
                this.emission.generateParticle(particle, this);
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
            this.emission.setRenderState(this, renderAtomic);
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