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
        get main() { return this._main; }
        set main(v)
        {
            this._modules.replace(this._main, v);
            v.particleSystem = this;
            this._main = v;
        }
        private _main: ParticleMainModule;

        @serialize
        @oav({ block: "emission", component: "OAVObjectView" })
        get emission() { return this._emission; }
        set emission(v)
        {
            this._modules.replace(this._emission, v);
            v.particleSystem = this;
            this._emission = v;
        }
        private _emission: ParticleEmissionModule;

        @serialize
        @oav({ block: "shape", component: "OAVObjectView" })
        get shape() { return this._shape; }
        set shape(v)
        {
            this._modules.replace(this._shape, v);
            v.particleSystem = this;
            this._shape = v;
        }
        private _shape: ParticleShapeModule;

        @serialize
        @oav({ block: "velocityOverLifetime", component: "OAVObjectView" })
        get velocityOverLifetime() { return this._velocityOverLifetime; }
        set velocityOverLifetime(v)
        {
            this._modules.replace(this._velocityOverLifetime, v);
            v.particleSystem = this;
            this._velocityOverLifetime = v;
        }
        private _velocityOverLifetime: ParticleVelocityOverLifetimeModule;

        @serialize
        // @oav({ tooltip: "limit velocity over lifetime module.", block: "limitVelocityOverLifetime", component: "OAVObjectView" })
        @oav({ tooltip: "基于时间轴限制速度模块。", block: "limitVelocityOverLifetime", component: "OAVObjectView" })
        get limitVelocityOverLifetime() { return this._limitVelocityOverLifetime; }
        set limitVelocityOverLifetime(v)
        {
            this._modules.replace(this._limitVelocityOverLifetime, v);
            v.particleSystem = this;
            this._limitVelocityOverLifetime = v;
        }
        private _limitVelocityOverLifetime: ParticleLimitVelocityOverLifetimeModule;

        @serialize
        @oav({ block: "forceOverLifetime", component: "OAVObjectView" })
        get forceOverLifetime() { return this._forceOverLifetime; }
        set forceOverLifetime(v)
        {
            this._modules.replace(this._forceOverLifetime, v);
            v.particleSystem = this;
            this._forceOverLifetime = v;
        }
        private _forceOverLifetime: ParticleForceOverLifetimeModule;

        @serialize
        @oav({ block: "colorOverLifetime", component: "OAVObjectView" })
        get colorOverLifetime() { return this._colorOverLifetime; }
        set colorOverLifetime(v)
        {
            this._modules.replace(this._colorOverLifetime, v);
            v.particleSystem = this;
            this._colorOverLifetime = v;
        }
        private _colorOverLifetime: ParticleColorOverLifetimeModule;

        @serialize
        @oav({ block: "sizeOverLifetime", component: "OAVObjectView" })
        get sizeOverLifetime() { return this._sizeOverLifetime; }
        set sizeOverLifetime(v)
        {
            this._modules.replace(this._sizeOverLifetime, v);
            v.particleSystem = this;
            this._sizeOverLifetime = v;
        }
        private _sizeOverLifetime: ParticleSizeOverLifetimeModule;

        @serialize
        @oav({ block: "rotationOverLifetime", component: "OAVObjectView" })
        get rotationOverLifetime() { return this._rotationOverLifetime; }
        set rotationOverLifetime(v)
        {
            this._modules.replace(this._rotationOverLifetime, v);
            v.particleSystem = this;
            this._rotationOverLifetime = v;
        }
        private _rotationOverLifetime: ParticleRotationOverLifetimeModule;

        /**
         * 粒子系统纹理表动画模块。
         */
        @serialize
        @oav({ tooltip: "粒子系统纹理表动画模块。", block: "textureSheetAnimation", component: "OAVObjectView" })
        get textureSheetAnimation() { return this._textureSheetAnimation; }
        set textureSheetAnimation(v)
        {
            this._modules.replace(this._textureSheetAnimation, v);
            v.particleSystem = this;
            this._textureSheetAnimation = v;
        }
        private _textureSheetAnimation: ParticleTextureSheetAnimationModule;

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

        constructor()
        {
            super();

            this.main = new ParticleMainModule();
            this.emission = new ParticleEmissionModule();
            this.shape = new ParticleShapeModule();
            this.velocityOverLifetime = new ParticleVelocityOverLifetimeModule();
            this.forceOverLifetime = new ParticleForceOverLifetimeModule();
            this.colorOverLifetime = new ParticleColorOverLifetimeModule();
            this.sizeOverLifetime = new ParticleSizeOverLifetimeModule();
            this.rotationOverLifetime = new ParticleRotationOverLifetimeModule();
            this.textureSheetAnimation = new ParticleTextureSheetAnimationModule();
            this.limitVelocityOverLifetime = new ParticleLimitVelocityOverLifetimeModule();

            this.main.enabled = true;
            this.emission.enabled = true;
            this.shape.enabled = true;
        }

        update(interval: number)
        {
            if (!this.isPlaying) return;

            this.time = this.time + this.main.simulationSpeed * interval / 1000;
            this._realEmitTime = this.time - this.main.startDelay;

            this._updateActiveParticlesState();

            // 完成一个循环
            if (this.main.loop && Math.floor(this._preRealEmitTime / this.main.duration) < Math.floor(this._realEmitTime / this.main.duration))
            {
                // 重新计算喷发概率
                this.emission.bursts.forEach(element =>
                {
                    element.calculateProbability();
                });
            }

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
            this._preRealEmitTime = 0;

            this._particlePool = this._particlePool.concat(this._activeParticles);
            this._activeParticles.length = 0;

            // 重新计算喷发概率
            this.emission.bursts.forEach(element =>
            {
                element.calculateProbability();
            });
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
            if (this.time == 0)
            {
                this.play();
            } else
            {
                this._isPlaying = true;
                this._preEmitTime = this.time;
                this._preRealEmitTime = Math.max(0, this.time - this.main.startDelay);
            }
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

            renderAtomic.shaderMacro.ENABLED_PARTICLE_SYSTEM_textureSheetAnimation = this.textureSheetAnimation.enabled;

            var cameraMatrix = camera.transform.localToWorldMatrix.clone();
            var localCameraPos = this.gameObject.transform.worldToLocalMatrix.transformVector(cameraMatrix.position);
            var localCameraUp = this.gameObject.transform.worldToLocalRotationMatrix.transformVector(cameraMatrix.up);
            // 计算公告牌矩阵
            var billboardMatrix = new Matrix4x4();
            billboardMatrix.lookAt(localCameraPos, localCameraUp);

            var positions: number[] = [];
            var scales: number[] = [];
            var rotations: number[] = [];
            var colors: number[] = [];
            var tilingOffsets: number[] = [];
            var flipUVs: number[] = [];
            for (let i = 0, n = this._activeParticles.length; i < n; i++)
            {
                var particle = this._activeParticles[i];
                positions.push(particle.position.x, particle.position.y, particle.position.z);
                scales.push(particle.size.x, particle.size.y, particle.size.z);

                // 计算旋转
                var rotation = particle.rotation;
                if (!this.shape.alignToDirection && this.geometry == Geometry.billboard && cameraMatrix)
                {
                    // 应用公告牌矩阵
                    var matrix = Matrix4x4.fromRotation(particle.rotation.x, particle.rotation.y, particle.rotation.z);
                    matrix.append(billboardMatrix);
                    //
                    rotation = matrix.rotation;
                }
                rotations.push(rotation.x, rotation.y, rotation.z);
                colors.push(particle.color.r, particle.color.g, particle.color.b, particle.color.a);
                tilingOffsets.push(particle.tilingOffset.x, particle.tilingOffset.y, particle.tilingOffset.z, particle.tilingOffset.w);
                flipUVs.push(particle.flipUV.x, particle.flipUV.y);
            }

            //
            this._attributes.a_particle_position.data = positions;
            this._attributes.a_particle_scale.data = scales;
            this._attributes.a_particle_rotation.data = rotations;
            this._attributes.a_particle_color.data = colors;
            this._attributes.a_particle_tilingOffset.data = tilingOffsets;
            this._attributes.a_particle_flipUV.data = flipUVs;

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
            a_particle_tilingOffset: new Attribute("a_particle_tilingOffset", [], 4, 1),
            a_particle_flipUV: new Attribute("a_particle_flipUV", [], 2, 1),
        };

        private readonly _modules: ParticleModule[] = [];

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

            var loop = this.main.loop;
            var startDelay = this.main.startDelay;
            var duration = this.main.duration;
            var rateAtDuration = this.main.rateAtDuration;
            var preRealEmitTime = this._preEmitTime - startDelay;

            // 判断是否结束发射
            if (!loop && preRealEmitTime >= duration) return;

            // 计算最后发射时间
            var realEmitTime = this.time - startDelay;
            if (!loop) realEmitTime = Math.min(realEmitTime, duration + startDelay);

            // 
            var emits: { time: number, num: number }[] = [];
            // 单粒子发射周期
            var step = 1 / this.emission.rateOverTime.getValue(rateAtDuration);
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
                    if (burst.isProbability && inCycleStart <= burst.time && burst.time <= inCycleEnd && burst.time <= realEmitTime)
                    {
                        emits.push({ time: cycleStartTime + burst.time, num: burst.count.getValue(rateAtDuration) });
                    }
                }
            }

            emits.sort((a, b) => { return a.time - b.time });;

            emits.forEach(v =>
            {
                this._emitParticles(v.time, v.num, rateAtDuration);
            });
        }

        /**
         * 发射粒子
         * @param birthTime 发射时间
         * @param num 发射数量
         */
        private _emitParticles(birthTime: number, num: number, rateAtDuration: number)
        {
            for (let i = 0; i < num; i++)
            {
                if (this._activeParticles.length >= this.main.maxParticles) return;
                var lifetime = this.main.startLifetime.getValue(rateAtDuration);
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
            this._modules.forEach(v => { v.initParticleState(particle) });
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
            this._modules.forEach(v => { v.updateParticleState(particle, preTime, this._realEmitTime, rateAtLifeTime) });
            particle.updateState(preTime, this._realEmitTime);
        }
    }

    AssetData.addAssetData("Billboard-Geometry", Geometry.billboard = serialization.setValue(new PlaneGeometry(), { name: "Billboard-Geometry", assetId: "Billboard-Geometry", yUp: false, hideFlags: HideFlags.NotEditable }));
}