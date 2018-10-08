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
         * 活跃粒子数量
         */
        get numActiveParticles()
        {
            return this.activeParticles.length;
        }

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
        private _attributes = {
            a_particle_birthTime: new Attribute("a_particle_birthTime", [], 1, 1),
            a_particle_position: new Attribute("a_particle_position", [], 3, 1),
            a_particle_velocity: new Attribute("a_particle_velocity", [], 3, 1),
            a_particle_acceleration: new Attribute("a_particle_acceleration", [], 3, 1),
            a_particle_lifetime: new Attribute("a_particle_lifetime", [], 1, 1),
            a_particle_color: new Attribute("a_particle_color", [], 4, 1),
        };
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

            this._isInvalid = true;
        }

        /**
         * 停止
         */
        stop()
        {
            this._isPlaying = false;
            this.time = 0;
            this._preEmitTime = 0;

            this.particlePool = this.particlePool.concat(this.activeParticles);
            this.activeParticles.length = 0;
        }

        /**
         * 播放
         */
        play()
        {
            this._isPlaying = true;
            this.time = 0;
            this._preEmitTime = 0;

            this.particlePool = this.particlePool.concat(this.activeParticles);
            this.activeParticles.length = 0;
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
            var bursts = this.emission.bursts;

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
                for (var i = singleStart; i < endTime; i += step)
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

            emits.sort((a, b) => { return a.time - b.time });;

            emits.forEach(v =>
            {
                this.emitParticles(v.time, v.num);
            });
        }

        /**
         * 发射粒子
         * @param realTime 真实时间，减去startDelay的时间
         * @param num 发射数量
         */
        private emitParticles(realTime: number, num: number)
        {
            for (let i = 0; i < num; i++)
            {
                if (this.activeParticles.length >= this.main.maxParticles) return;
                var startLifetime = this.main.startLifetime;
                if (startLifetime + realTime + this.main.startDelay > this.time)
                {
                    var particle = this.particlePool.pop() || new Particle(0);
                    particle.birthTime = realTime;
                    particle.lifetime = startLifetime;
                    particle.color = this.main.startColor;
                    this.activeParticles.push(particle);
                    this.initParticleState(particle);
                    this.updateParticleState(particle);
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
                if (particle.birthTime + particle.lifetime + this.main.startDelay < this.time)
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
         * 初始化粒子状态
         * @param particle 粒子
         */
        private initParticleState(particle: Particle)
        {
            this.main.initParticleState(particle);
            this.emission.initParticleState(particle);
            this.components.forEach(element =>
            {
                if (element.enabled)
                    element.initParticleState(particle);
            });
        }

        /**
         * 更新粒子状态
         * @param particle 粒子
         */
        private updateParticleState(particle: Particle)
        {
            this.main.updateParticleState(particle);
            this.emission.updateParticleState(particle);
            this.components.forEach(element =>
            {
                if (element.enabled)
                    element.updateParticleState(particle);
            });
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

            var cameraMatrix = lazy.getvalue(renderAtomic.uniforms.u_cameraMatrix)
            if (this.geometry == Geometry.billboard && cameraMatrix)
            {
                var gameObject = this.gameObject;
                var matrix = this.particleGlobal.billboardMatrix;
                matrix.copyFrom(gameObject.transform.localToWorldMatrix);
                matrix.lookAt(cameraMatrix.position, cameraMatrix.up);
                matrix.position = Vector3.ZERO;
            } else
            {
                this.particleGlobal.billboardMatrix.identity();
            }

            renderAtomic.instanceCount = this.activeParticles.length;
            //
            renderAtomic.shaderMacro.HAS_PARTICLE_ANIMATOR = true;

            if (this._isInvalid)
            {
                var birthTimes: number[] = [];
                var positions: number[] = [];
                var velocitys: number[] = [];
                var accelerations: number[] = [];
                var lifetimes: number[] = [];
                var colors: number[] = [];
                for (let i = 0, n = this.activeParticles.length; i < n; i++)
                {
                    var particle = this.activeParticles[i];
                    birthTimes.push(particle.birthTime);
                    positions.push(particle.position.x, particle.position.y, particle.position.z)
                    velocitys.push(particle.velocity.x, particle.velocity.y, particle.velocity.z)
                    accelerations.push(particle.acceleration.x, particle.acceleration.y, particle.acceleration.z)
                    lifetimes.push(particle.lifetime);
                    colors.push(particle.color.r, particle.color.g, particle.color.b, particle.color.a);
                }

                //
                this._attributes.a_particle_birthTime.data = birthTimes;
                this._attributes.a_particle_position.data = positions;
                this._attributes.a_particle_velocity.data = velocitys;
                this._attributes.a_particle_acceleration.data = accelerations;
                this._attributes.a_particle_lifetime.data = lifetimes;
                this._attributes.a_particle_color.data = colors;

                //
                this._isInvalid = false;
            }

            //
            renderAtomic.uniforms.u_particleTime = this.time - this.main.startDelay;
            renderAtomic.uniforms.u_particle_position = this.particleGlobal.position;
            renderAtomic.uniforms.u_particle_velocity = this.particleGlobal.velocity;
            renderAtomic.uniforms.u_particle_acceleration = this.particleGlobal.acceleration;
            renderAtomic.uniforms.u_particle_color = this.particleGlobal.color;
            renderAtomic.uniforms.u_particle_billboardMatrix = this.particleGlobal.billboardMatrix;

            for (const key in this._attributes)
            {
                renderAtomic.attributes[key] = this._attributes[key];
            }
        }
    }

    Feng3dAssets.setAssets(Geometry.billboard = new PlaneGeometry().value({ name: "Billboard", assetsId: "Billboard-Geometry", yUp: false, hideFlags: HideFlags.NotEditable }));
}