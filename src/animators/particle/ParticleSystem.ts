namespace feng3d
{
    export interface ComponentMap { ParticleSystem: ParticleSystem }

    export interface GameObjectEventMap
    {
        /**
         * 粒子效果播放结束
         */
        particleCompleted: ParticleSystem;
    }

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
        emission: ParticleEmissionModule;

        @serialize
        @oav({ block: "shape", component: "OAVObjectView" })
        shape: ParticleShapeModule;

        @serialize
        @oav({ block: "velocityOverLifetime", component: "OAVObjectView" })
        velocityOverLifetime: ParticleVelocityOverLifetimeModule;

        @serialize
        @oav({ block: "accelerationOverLifetime", component: "OAVObjectView" })
        accelerationOverLifetime: ParticleAccelerationOverLifetimeModule;

        @serialize
        @oav({ block: "colorOverLifetime", component: "OAVObjectView" })
        colorOverLifetime: ParticleColorOverLifetimeModule;

        @serialize
        @oav({ block: "scaleOverLifetime", component: "OAVObjectView" })
        scaleOverLifetime: ParticleScaleOverLifetimeModule;

        @serialize
        @oav({ block: "palstanceOverLifetime", component: "OAVObjectView" })
        palstanceOverLifetime: ParticlePalstanceOverLifetimeModule;

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

        /**
         * 活跃粒子数量
         */
        get numActiveParticles()
        {
            return this._activeParticles.length;
        }

        get single() { return true; }

        init(gameObject: GameObject)
        {
            super.init(gameObject);

            this._modules = [
                this.main = this.main || new ParticleMainModule(),
                this.emission = this.emission || new ParticleEmissionModule(),
                this.shape = this.shape || new ParticleShapeModule(),
                this.velocityOverLifetime = this.velocityOverLifetime || new ParticleVelocityOverLifetimeModule(),
                this.accelerationOverLifetime = this.accelerationOverLifetime || new ParticleAccelerationOverLifetimeModule(),
                this.colorOverLifetime = this.colorOverLifetime || new ParticleColorOverLifetimeModule(),
                this.scaleOverLifetime = this.scaleOverLifetime || new ParticleScaleOverLifetimeModule(),
                this.palstanceOverLifetime = this.palstanceOverLifetime || new ParticlePalstanceOverLifetimeModule(),
            ];
            this._modules.forEach(v => v.particleSystem = this);
        }

        update(interval: number)
        {
            if (!this.isPlaying) return;

            this.time = this.time + this.main.simulationSpeed * interval / 1000;
            this._realEmitTime = this.time - this.main.startDelay;

            this._updateActiveParticlesState();

            this._emit();

            this._preEmitTime = this.time;
            this._preRealEmitTime = this.time - this.main.startDelay;

            // 判断非循环的效果是否播放结束
            if (!this.main.loop && this._activeParticles.length == 0 && this.time > this.main.startDelay + this.main.duration)
            {
                this.stop();
                this.dispatch("particleCompleted", this);
            }
        }

        /**
         * 停止
         */
        stop()
        {
            this._isPlaying = false;
            this.time = 0;
            this._preEmitTime = 0;

            this._particlePool = this._particlePool.concat(this._activeParticles);
            this._activeParticles.length = 0;
        }

        /**
         * 播放
         */
        play()
        {
            this._isPlaying = true;
            this.time = 0;
            this._preEmitTime = 0;

            this._particlePool = this._particlePool.concat(this._activeParticles);
            this._activeParticles.length = 0;
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

        beforeRender(gl: GL, renderAtomic: RenderAtomic, scene3d: Scene3D, camera: Camera)
        {
            super.beforeRender(gl, renderAtomic, scene3d, camera);

            if (Boolean(scene3d.runEnvironment & RunEnvironment.feng3d) && !this._awaked)
            {
                this._isPlaying = this.main.playOnAwake;
                this._awaked = true;
            }

            renderAtomic.instanceCount = this._activeParticles.length;
            //
            renderAtomic.shaderMacro.HAS_PARTICLE_ANIMATOR = true;

            var cameraMatrix = lazy.getvalue(renderAtomic.uniforms.u_cameraMatrix)
            var localCameraPos = this.gameObject.transform.worldToLocalMatrix.transformVector(cameraMatrix.position);
            var localCameraUp = this.gameObject.transform.worldToLocalRotationMatrix.transformVector(cameraMatrix.up);

            var positions: number[] = [];
            var scales: number[] = [];
            var rotations: number[] = [];
            var colors: number[] = [];
            for (let i = 0, n = this._activeParticles.length; i < n; i++)
            {
                var particle = this._activeParticles[i];

                if (this.geometry == Geometry.billboard && cameraMatrix)
                {
                    var matrix = new Matrix4x4().recompose([particle.position, particle.rotation.scaleNumberTo(FMath.DEG2RAD), particle.scale]);
                    matrix.lookAt(localCameraPos, localCameraUp);

                    particle.rotation = matrix.decompose()[1].scaleNumber(FMath.RAD2DEG);
                }

                positions.push(particle.position.x, particle.position.y, particle.position.z);
                scales.push(particle.scale.x, particle.scale.y, particle.scale.z);
                rotations.push(particle.rotation.x, particle.rotation.y, particle.rotation.z);
                colors.push(particle.color.r, particle.color.g, particle.color.b, particle.color.a);
            }

            //
            this._attributes.a_particle_position.data = positions;
            this._attributes.a_particle_scale.data = scales;
            this._attributes.a_particle_rotation.data = rotations;
            this._attributes.a_particle_color.data = colors;

            //
            renderAtomic.uniforms.u_particleTime = this.time - this.main.startDelay;

            for (const key in this._attributes)
            {
                renderAtomic.attributes[key] = this._attributes[key];
            }
        }

        private _awaked = false;

        /**
         * 上次发射时间
         */
        private _preEmitTime = 0;
        /**
         * 当前真实发射时间
         */
        private _realEmitTime = 0;
        /**
         * 上次真实发射时间
         */
        private _preRealEmitTime = 0;

        /**
         * 粒子池，用于存放未发射或者死亡粒子
         */
        private _particlePool: Particle[] = [];
        /**
         * 活跃的粒子列表
         */
        private _activeParticles: Particle[] = [];

        /**
         * 属性数据列表
         */
        private _attributes = {
            a_particle_position: new Attribute("a_particle_position", [], 3, 1),
            a_particle_scale: new Attribute("a_particle_scale", [], 3, 1),
            a_particle_rotation: new Attribute("a_particle_rotation", [], 3, 1),
            a_particle_color: new Attribute("a_particle_color", [], 4, 1),
        };

        private _modules: ParticleModule[];

        /**
         * 发射粒子
         * @param time 当前粒子时间
         */
        private _emit()
        {
            if (!this.emission.enabled) return;

            // 判断是否达到最大粒子数量
            if (this._activeParticles.length >= this.main.maxParticles) return;

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
            var step = 1 / this.emission.rate.getValue(this.main.rateAtDuration);
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
                this._emitParticles(v.time, v.num);
            });
        }

        /**
         * 发射粒子
         * @param birthTime 发射时间
         * @param num 发射数量
         */
        private _emitParticles(birthTime: number, num: number)
        {
            for (let i = 0; i < num; i++)
            {
                if (this._activeParticles.length >= this.main.maxParticles) return;
                var lifetime = this.main.startLifetime.getValue(((birthTime - this.main.startDelay) % this.main.duration) / this.main.duration);
                if (lifetime + birthTime + this.main.startDelay > this.time)
                {
                    var particle = this._particlePool.pop() || new Particle();
                    particle.birthTime = birthTime;
                    particle.lifetime = lifetime;
                    this._activeParticles.push(particle);
                    this._initParticleState(particle);
                    this._updateParticleState(particle);
                }
            }
        }

        /**
         * 更新活跃粒子状态
         */
        private _updateActiveParticlesState()
        {
            for (let i = this._activeParticles.length - 1; i >= 0; i--)
            {
                var particle = this._activeParticles[i];
                if (particle.birthTime + particle.lifetime + this.main.startDelay < this.time)
                {
                    this._activeParticles.splice(i, 1);
                    this._particlePool.push(particle);
                } else
                {
                    this._updateParticleState(particle);
                }
            }
        }

        /**
         * 初始化粒子状态
         * @param particle 粒子
         */
        private _initParticleState(particle: Particle)
        {
            this._modules.forEach(v => { v.enabled && v.initParticleState(particle) });
        }

        /**
         * 更新粒子状态
         * @param particle 粒子
         */
        private _updateParticleState(particle: Particle)
        {
            var preTime = this._preRealEmitTime < particle.birthTime ? particle.birthTime : this._preRealEmitTime;

            var rateAtLifeTime = (this.time - this.main.startDelay - particle.birthTime) / particle.lifetime;
            //
            this._modules.forEach(v => { v.enabled && v.updateParticleState(particle, preTime, this._realEmitTime, rateAtLifeTime) });
            particle.updateState(preTime, this._realEmitTime);
        }
    }

    Feng3dAssets.setAssets(Geometry.billboard = Object.setValue(new PlaneGeometry(), { name: "Billboard", assetsId: "Billboard-Geometry", yUp: false, hideFlags: HideFlags.NotEditable }));
}