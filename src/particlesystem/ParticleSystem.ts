namespace feng3d
{
    export interface ComponentMap { ParticleSystem: ParticleSystem }

    export interface GameObjectEventMap
    {
        /**
         * 粒子系统播放完一个周期
         */
        particleCycled: ParticleSystem;

        /**
         * 粒子效果播放结束
         */
        particleCompleted: ParticleSystem;
    }

    /**
     * 粒子系统
     */
    @AddComponentMenu("Effects/ParticleSystem")
    @RegisterComponent()
    export class ParticleSystem extends Renderable
    {
        __class__: "feng3d.ParticleSystem";

        /**
         * Is the particle system playing right now ?
         * 
         * 粒子系统正在运行吗?
         */
        get isPlaying()
        {
            return this._isPlaying;
        }
        private _isPlaying = false;

        /**
         * Is the particle system stopped right now ?
         * 
         * 粒子系统现在停止了吗?
         */
        get isStopped()
        {
            return !this._isPlaying && this.time == 0;
        }

        /**
         * Is the particle system paused right now ?
         * 
         * 粒子系统现在暂停了吗?
         */
        get isPaused()
        {
            return !this._isPlaying && this.time != 0;
        }

        /**
         * The current number of particles (Read Only).
         * 
         * 当前粒子数(只读)。
         */
        get particleCount()
        {
            return this._activeParticles.length;
        }

        /**
         * Playback position in seconds.
         * 
         * 回放位置(秒)
         */
        time = 0;

        @serialize
        @oav({ block: "Main", component: "OAVObjectView" })
        get main() { return this._main; }
        set main(v)
        {
            if (this._main)
            {
                watcher.unwatch(this._main, "simulationSpace", this._simulationSpaceChanged, this);
            }
            Array.replace(this._modules, this._main, v);
            v.particleSystem = this;
            this._main = v;
            watcher.watch(this._main, "simulationSpace", this._simulationSpaceChanged, this);
        }
        private _main: ParticleMainModule;

        @serialize
        @oav({ block: "Emission", component: "OAVObjectView" })
        get emission() { return this._emission; }
        set emission(v)
        {
            Array.replace(this._modules, this._emission, v);
            v.particleSystem = this;
            this._emission = v;
        }
        private _emission: ParticleEmissionModule;

        @serialize
        @oav({ block: "Shape", component: "OAVObjectView" })
        get shape() { return this._shape; }
        set shape(v)
        {
            Array.replace(this._modules, this._shape, v);
            v.particleSystem = this;
            this._shape = v;
        }
        private _shape: ParticleShapeModule;

        @serialize
        @oav({ block: "Velocity Over Lifetime", component: "OAVObjectView" })
        get velocityOverLifetime() { return this._velocityOverLifetime; }
        set velocityOverLifetime(v)
        {
            Array.replace(this._modules, this._velocityOverLifetime, v);
            v.particleSystem = this;
            this._velocityOverLifetime = v;
        }
        private _velocityOverLifetime: ParticleVelocityOverLifetimeModule;

        @serialize
        // @oav({ tooltip: "limit velocity over lifetime module.", block: "limitVelocityOverLifetime", component: "OAVObjectView" })
        @oav({ tooltip: "基于时间轴限制速度模块。", block: "Limit Velocity Over Lifetime", component: "OAVObjectView" })
        get limitVelocityOverLifetime() { return this._limitVelocityOverLifetime; }
        set limitVelocityOverLifetime(v)
        {
            Array.replace(this._modules, this._limitVelocityOverLifetime, v);
            v.particleSystem = this;
            this._limitVelocityOverLifetime = v;
        }
        private _limitVelocityOverLifetime: ParticleLimitVelocityOverLifetimeModule;

        /**
         * Script interface for the Particle System velocity inheritance module.
         * 
         * 粒子系统速度继承模块。
         */
        @serialize
        @oav({ tooltip: "粒子系统速度继承模块。", block: "Inherit Velocity", component: "OAVObjectView" })
        get inheritVelocity() { return this._inheritVelocity; }
        set inheritVelocity(v)
        {
            Array.replace(this._modules, this._inheritVelocity, v);
            v.particleSystem = this;
            this._inheritVelocity = v;
        }
        private _inheritVelocity: ParticleInheritVelocityModule;

        @serialize
        @oav({ block: "Force Over Lifetime", component: "OAVObjectView" })
        get forceOverLifetime() { return this._forceOverLifetime; }
        set forceOverLifetime(v)
        {
            Array.replace(this._modules, this._forceOverLifetime, v);
            v.particleSystem = this;
            this._forceOverLifetime = v;
        }
        private _forceOverLifetime: ParticleForceOverLifetimeModule;

        @serialize
        @oav({ block: "Color Over Lifetime", component: "OAVObjectView" })
        get colorOverLifetime() { return this._colorOverLifetime; }
        set colorOverLifetime(v)
        {
            Array.replace(this._modules, this._colorOverLifetime, v);
            v.particleSystem = this;
            this._colorOverLifetime = v;
        }
        private _colorOverLifetime: ParticleColorOverLifetimeModule;

        /**
         * 颜色随速度变化模块。
         */
        @serialize
        @oav({ block: "Color By Speed", component: "OAVObjectView" })
        get colorBySpeed() { return this._colorBySpeed; }
        set colorBySpeed(v)
        {
            Array.replace(this._modules, this._colorBySpeed, v);
            v.particleSystem = this;
            this._colorBySpeed = v;
        }
        private _colorBySpeed: ParticleColorBySpeedModule;

        @serialize
        @oav({ block: "sizeOverLifetime", component: "OAVObjectView" })
        get sizeOverLifetime() { return this._sizeOverLifetime; }
        set sizeOverLifetime(v)
        {
            Array.replace(this._modules, this._sizeOverLifetime, v);
            v.particleSystem = this;
            this._sizeOverLifetime = v;
        }
        private _sizeOverLifetime: ParticleSizeOverLifetimeModule;

        /**
         * 缩放随速度变化模块
         */
        @serialize
        @oav({ block: "Size By Speed", component: "OAVObjectView" })
        get sizeBySpeed() { return this._sizeBySpeed; }
        set sizeBySpeed(v)
        {
            Array.replace(this._modules, this._sizeBySpeed, v);
            v.particleSystem = this;
            this._sizeBySpeed = v;
        }
        private _sizeBySpeed: ParticleSizeBySpeedModule;

        @serialize
        @oav({ block: "Rotation Over Lifetime", component: "OAVObjectView" })
        get rotationOverLifetime() { return this._rotationOverLifetime; }
        set rotationOverLifetime(v)
        {
            Array.replace(this._modules, this._rotationOverLifetime, v);
            v.particleSystem = this;
            this._rotationOverLifetime = v;
        }
        private _rotationOverLifetime: ParticleRotationOverLifetimeModule;

        /**
         * 旋转角度随速度变化模块
         */
        @serialize
        @oav({ block: "Rotation By Speed", component: "OAVObjectView" })
        get rotationBySpeed() { return this._rotationBySpeed; }
        set rotationBySpeed(v)
        {
            Array.replace(this._modules, this._rotationBySpeed, v);
            v.particleSystem = this;
            this._rotationBySpeed = v;
        }
        private _rotationBySpeed: ParticleRotationBySpeedModule;

        /**
         * 旋转角度随速度变化模块
         */
        @serialize
        @oav({ block: "Noise", component: "OAVObjectView" })
        get noise() { return this._noise; }
        set noise(v)
        {
            Array.replace(this._modules, this._noise, v);
            v.particleSystem = this;
            this._noise = v;
        }
        private _noise: ParticleNoiseModule;

        /**
         * 旋转角度随速度变化模块
         */
        @serialize
        @oav({ block: "Sub Emitters", component: "OAVObjectView" })
        get subEmitters() { return this._subEmitters; }
        set subEmitters(v)
        {
            Array.replace(this._modules, this._subEmitters, v);
            v.particleSystem = this;
            this._subEmitters = v;
        }
        private _subEmitters: ParticleSubEmittersModule;

        /**
         * 粒子系统纹理表动画模块。
         */
        @serialize
        @oav({ tooltip: "粒子系统纹理表动画模块。", block: "Texture Sheet Animation", component: "OAVObjectView" })
        get textureSheetAnimation() { return this._textureSheetAnimation; }
        set textureSheetAnimation(v)
        {
            Array.replace(this._modules, this._textureSheetAnimation, v);
            v.particleSystem = this;
            this._textureSheetAnimation = v;
        }
        private _textureSheetAnimation: ParticleTextureSheetAnimationModule;

        @oav({ tooltip: "粒子系统渲染模块。", block: "Renderer" })
        geometry = Geometry.getDefault("Billboard-Geometry");

        @oav({ block: "Renderer" })
        material = Material.getDefault("Particle-Material");

        @oav({ block: "Renderer" })
        @serialize
        castShadows = true;

        @oav({ block: "Renderer" })
        @serialize
        receiveShadows = true;

        get single() { return true; }

        constructor()
        {
            super();

            this.main = new ParticleMainModule();
            this.emission = new ParticleEmissionModule();
            this.shape = new ParticleShapeModule();
            this.velocityOverLifetime = new ParticleVelocityOverLifetimeModule();
            this.inheritVelocity = new ParticleInheritVelocityModule();
            this.forceOverLifetime = new ParticleForceOverLifetimeModule();
            this.limitVelocityOverLifetime = new ParticleLimitVelocityOverLifetimeModule();
            this.colorOverLifetime = new ParticleColorOverLifetimeModule();
            this.colorBySpeed = new ParticleColorBySpeedModule();
            this.sizeOverLifetime = new ParticleSizeOverLifetimeModule();
            this.sizeBySpeed = new ParticleSizeBySpeedModule();
            this.rotationOverLifetime = new ParticleRotationOverLifetimeModule();
            this.rotationBySpeed = new ParticleRotationBySpeedModule();
            this.noise = new ParticleNoiseModule();
            this.subEmitters = new ParticleSubEmittersModule();
            this.textureSheetAnimation = new ParticleTextureSheetAnimationModule();

            this.main.enabled = true;
            this.emission.enabled = true;
            this.shape.enabled = true;
        }

        update(interval: number)
        {
            if (!this.isPlaying) return;

            var deltaTime = this.main.simulationSpeed * interval / 1000;
            this.time = this.time + deltaTime;

            var emitInfo = this._emitInfo;

            emitInfo.preTime = emitInfo.currentTime;
            emitInfo.currentTime = this.time - emitInfo.startDelay;
            emitInfo.preWorldPos.copy(emitInfo.currentWorldPos);

            // 粒子系统位置
            emitInfo.currentWorldPos.copy(this.transform.worldPosition);

            // 粒子系统位移
            emitInfo.moveVec.copy(emitInfo.currentWorldPos).sub(emitInfo.preWorldPos);
            // 粒子系统速度
            emitInfo.speed.copy(emitInfo.moveVec).divideNumber(deltaTime);

            this._modules.forEach(m =>
            {
                m.update(deltaTime);
            });

            this._updateActiveParticlesState(deltaTime);

            // 完成一个循环
            if (this.main.loop && Math.floor(emitInfo.preTime / this.main.duration) < Math.floor(emitInfo.currentTime / this.main.duration))
            {
                // 重新计算喷发概率
                this.emission.bursts.forEach(element =>
                {
                    element.calculateProbability();
                });
                this.dispatch("particleCycled", this);
            }

            // 发射粒子
            if (!this._isSubParticleSystem) // 子粒子系统自身不会自动发射粒子
            {
                var emits = this._emit(emitInfo);

                emits.sort((a, b) => { return a.time - b.time });
                emits.forEach(v =>
                {
                    this._emitParticles(v);
                });
            }

            // 判断非循环的效果是否播放结束
            if (!this.main.loop && this._activeParticles.length == 0 && emitInfo.currentTime > this.main.duration)
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

            this._particlePool = this._particlePool.concat(this._activeParticles);
            this._activeParticles.length = 0;

            var startDelay = this.main.startDelay.getValue(Math.random());

            this._emitInfo =
            {
                preTime: -startDelay,
                currentTime: -startDelay,
                preWorldPos: new Vector3(),
                currentWorldPos: new Vector3(),
                rateAtDuration: 0,
                _leftRateOverDistance: 0,
                _isRateOverDistance: false,
                startDelay: startDelay,
                moveVec: new Vector3(),
                speed: new Vector3(),
                position: new Vector3(),
            };

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
                this._emitInfo.preTime = Math.max(0, this._emitInfo.currentTime);
            }
        }

        beforeRender(renderAtomic: RenderAtomic, scene: Scene, camera: Camera)
        {
            super.beforeRender(renderAtomic, scene, camera);

            if (Boolean(scene.runEnvironment & RunEnvironment.feng3d) && !this._awaked)
            {
                if (this.main.playOnAwake && !this._isPlaying)
                {
                    this.play();
                }
                this._awaked = true;
            }

            renderAtomic.instanceCount = this._activeParticles.length;
            //
            renderAtomic.shaderMacro.HAS_PARTICLE_ANIMATOR = true;

            renderAtomic.shaderMacro.ENABLED_PARTICLE_SYSTEM_textureSheetAnimation = this.textureSheetAnimation.enabled;

            // 计算公告牌矩阵
            var isbillboard = !this.shape.alignToDirection && this.geometry == Geometry.getDefault("Billboard-Geometry");
            var billboardMatrix = new Matrix3x3();
            if (isbillboard)
            {
                var cameraMatrix = camera.transform.localToWorldMatrix.clone();
                var localCameraForward = cameraMatrix.getAxisZ();
                var localCameraUp = cameraMatrix.getAxisY();
                if (this.main.simulationSpace == ParticleSystemSimulationSpace.Local)
                {
                    localCameraForward = this.gameObject.transform.worldToLocalRotationMatrix.transformPoint3(localCameraForward);
                    localCameraUp = this.gameObject.transform.worldToLocalRotationMatrix.transformPoint3(localCameraUp);
                }
                var matrix4x4 = new Matrix4x4();
                matrix4x4.lookAt(localCameraForward, localCameraUp);
                billboardMatrix.formMatrix4x4(matrix4x4);
            }

            var positions: number[] = [];
            var scales: number[] = [];
            var rotations: number[] = [];
            var colors: number[] = [];
            var tilingOffsets: number[] = [];
            var flipUVs: number[] = [];
            for (var i = 0, n = this._activeParticles.length; i < n; i++)
            {
                var particle = this._activeParticles[i];
                positions.push(particle.position.x, particle.position.y, particle.position.z);
                scales.push(particle.size.x, particle.size.y, particle.size.z);

                rotations.push(particle.rotation.x, particle.rotation.y, particle.rotation.z);
                colors.push(particle.color.r, particle.color.g, particle.color.b, particle.color.a);
                tilingOffsets.push(particle.tilingOffset.x, particle.tilingOffset.y, particle.tilingOffset.z, particle.tilingOffset.w);
                flipUVs.push(particle.flipUV.x, particle.flipUV.y);
            }

            if (isbillboard)
            {
                for (var i = 0, n = rotations.length; i < n; i += 3)
                {
                    rotations[i + 2] = -rotations[i + 2];
                }
            }

            //
            this._attributes.a_particle_position.data = positions;
            this._attributes.a_particle_scale.data = scales;
            this._attributes.a_particle_rotation.data = rotations;
            this._attributes.a_particle_color.data = colors;
            this._attributes.a_particle_tilingOffset.data = tilingOffsets;
            this._attributes.a_particle_flipUV.data = flipUVs;

            //
            renderAtomic.uniforms.u_particle_billboardMatrix = billboardMatrix;

            if (this.main.simulationSpace == ParticleSystemSimulationSpace.World)
            {
                renderAtomic.uniforms.u_modelMatrix = () => new Matrix4x4();
                renderAtomic.uniforms.u_ITModelMatrix = () => new Matrix4x4();
            }

            for (const key in this._attributes)
            {
                renderAtomic.attributes[key] = this._attributes[key];
            }
        }

        private _awaked = false;

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
         * 
         * @param startTime 发射起始时间
         * @param endTime 发射终止时间
         * @param startPos 发射起始位置
         * @param stopPos 发射终止位置
         */
        private _emit(emitInfo: ParticleSystemEmitInfo)
        {
            // 
            var emits: { time: number, num: number, position: Vector3, emitInfo: ParticleSystemEmitInfo }[] = [];

            var startTime = emitInfo.preTime;
            var endTime = emitInfo.currentTime;

            if (!this.emission.enabled) return emits;

            // 判断是否开始发射
            if (endTime <= 0) return emits;

            var loop = this.main.loop;
            var duration = this.main.duration;

            // 判断是否结束发射
            if (!loop && startTime >= duration) return emits;

            // 计算最后发射时间
            if (!loop) endTime = Math.min(endTime, duration);

            // 计算此处在发射周期的位置
            var rateAtDuration = (endTime % duration) / duration;
            if (rateAtDuration == 0 && endTime >= duration) rateAtDuration = 1;

            emitInfo.rateAtDuration = rateAtDuration;

            // 处理移动发射粒子
            var moveEmits = this._emitWithMove(emitInfo);
            emits = emits.concat(moveEmits);

            // 单粒子发射周期
            var timeEmits = this._emitWithTime(emitInfo, duration);
            emits = emits.concat(timeEmits);

            return emits;
        }

        /**
         * 计算在指定移动的位移线段中发射的粒子列表。
         * 
         * @param rateAtDuration 
         * @param prePos 
         * @param currentPos 
         */
        private _emitWithMove(emitInfo: ParticleSystemEmitInfo)
        {
            var emits: { time: number; num: number; position: Vector3; emitInfo: ParticleSystemEmitInfo; }[] = [];
            if (this.main.simulationSpace == ParticleSystemSimulationSpace.World)
            {
                if (emitInfo._isRateOverDistance)
                {
                    var moveVec = emitInfo.currentWorldPos.subTo(emitInfo.preWorldPos);
                    var moveDistance = moveVec.length;
                    var worldPos = emitInfo.currentWorldPos;
                    // 本次移动距离
                    if (moveDistance > 0)
                    {
                        // 移动方向
                        var moveDir = moveVec.clone().normalize();
                        // 剩余移动量
                        var leftRateOverDistance = emitInfo._leftRateOverDistance + moveDistance;
                        // 发射频率
                        var rateOverDistance = this.emission.rateOverDistance.getValue(emitInfo.rateAtDuration);
                        // 发射间隔距离
                        var invRateOverDistance = 1 / rateOverDistance;
                        // 发射间隔位移
                        var invRateOverDistanceVec = moveDir.scaleNumberTo(1 / rateOverDistance);
                        // 上次发射位置
                        var lastRateOverDistance = emitInfo.preWorldPos.addTo(moveDir.negateTo().scaleNumber(emitInfo._leftRateOverDistance));

                        while (invRateOverDistance < leftRateOverDistance)
                        {
                            emits.push({
                                position: lastRateOverDistance.add(invRateOverDistanceVec).clone().sub(worldPos),
                                time: emitInfo.preTime + (emitInfo.currentTime - emitInfo.preTime) * (1 - leftRateOverDistance / moveDistance),
                                num: 1,
                                emitInfo: emitInfo
                            });
                            leftRateOverDistance -= invRateOverDistance;
                        }
                        emitInfo._leftRateOverDistance = leftRateOverDistance;
                    }
                }
                emitInfo._isRateOverDistance = true;
            }
            else
            {
                emitInfo._isRateOverDistance = false;
                emitInfo._leftRateOverDistance = 0;
            }
            return emits;
        }

        /**
         * 计算在指定时间段内发射的粒子列表
         * 
         * @param rateAtDuration 
         * @param preRealTime 
         * @param duration 
         * @param realEmitTime 
         */
        private _emitWithTime(emitInfo: ParticleSystemEmitInfo, duration: number)
        {
            var rateAtDuration = emitInfo.rateAtDuration;
            var preTime = emitInfo.preTime;
            var currentTime = emitInfo.currentTime;

            var emits: { time: number; num: number; position: Vector3; emitInfo: ParticleSystemEmitInfo }[] = [];

            var step = 1 / this.emission.rateOverTime.getValue(rateAtDuration);
            var bursts = this.emission.bursts;
            // 遍历所有发射周期
            var cycleStartIndex = Math.floor(preTime / duration);
            var cycleEndIndex = Math.ceil(currentTime / duration);
            for (let k = cycleStartIndex; k < cycleEndIndex; k++)
            {
                var cycleStartTime = k * duration;
                var cycleEndTime = (k + 1) * duration;
                // 单个周期内的起始与结束时间
                var startTime = Math.max(preTime, cycleStartTime);
                var endTime = Math.min(currentTime, cycleEndTime);
                // 处理稳定发射
                var singleStart = Math.ceil(startTime / step) * step;
                for (var i = singleStart; i < endTime; i += step)
                {
                    emits.push({ time: i, num: 1, emitInfo: emitInfo, position: emitInfo.position.clone() });
                }
                // 处理喷发
                var inCycleStart = startTime - cycleStartTime;
                var inCycleEnd = endTime - cycleStartTime;
                for (let i = 0; i < bursts.length; i++)
                {
                    const burst = bursts[i];
                    if (burst.isProbability && inCycleStart <= burst.time && burst.time < inCycleEnd)
                    {
                        emits.push({ time: cycleStartTime + burst.time, num: burst.count.getValue(rateAtDuration), emitInfo: emitInfo, position: emitInfo.position.clone() });
                    }
                }
            }
            return emits;
        }

        /**
         * 发射粒子
         * @param birthTime 发射时间
         * @param num 发射数量
         */
        private _emitParticles(v: { time: number; num: number; position: Vector3; emitInfo: ParticleSystemEmitInfo })
        {
            var num = v.num;
            var birthTime = v.time;
            var position = v.position;
            var emitInfo = v.emitInfo;
            for (let i = 0; i < num; i++)
            {
                if (this._activeParticles.length >= this.main.maxParticles) return;
                var lifetime = this.main.startLifetime.getValue(emitInfo.rateAtDuration);
                var birthRateAtDuration = (birthTime - emitInfo.startDelay) / this.main.duration;
                var rateAtLifeTime = (emitInfo.currentTime - birthTime) / lifetime;

                if (rateAtLifeTime < 1)
                {
                    var particle = this._particlePool.pop() || new Particle();
                    particle.cache = {};
                    particle.position.copy(position);
                    particle.birthTime = birthTime;
                    particle.lifetime = lifetime;
                    particle.rateAtLifeTime = rateAtLifeTime;
                    //
                    particle.birthRateAtDuration = birthRateAtDuration - Math.floor(birthRateAtDuration);
                    //
                    particle.preTime = emitInfo.currentTime;
                    particle.curTime = emitInfo.currentTime;
                    particle.prePosition = position.clone();
                    particle.curPosition = position.clone();

                    //
                    this._activeParticles.push(particle);
                    this._initParticleState(particle);
                    this._updateParticleState(particle, 0);
                }
            }
        }

        /**
         * 更新活跃粒子状态
         */
        private _updateActiveParticlesState(deltaTime: number)
        {
            for (let i = this._activeParticles.length - 1; i >= 0; i--)
            {
                var particle = this._activeParticles[i];

                particle.rateAtLifeTime = (particle.curTime + deltaTime - particle.birthTime) / particle.lifetime;
                if (particle.rateAtLifeTime < 0 || particle.rateAtLifeTime > 1)
                {
                    this._activeParticles.splice(i, 1);
                    this._particlePool.push(particle);
                    particle.subEmitInfo = null;
                } else
                {
                    this._updateParticleState(particle, deltaTime);
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
        private _updateParticleState(particle: Particle, deltaTime: number)
        {
            //
            this._modules.forEach(v => { v.updateParticleState(particle) });
            particle.updateState(particle.curTime + deltaTime);
        }

        private _simulationSpaceChanged()
        {
            if (!this.transform) return;
            if (this._activeParticles.length == 0) return;

            if (this._main.simulationSpace == ParticleSystemSimulationSpace.Local)
            {
                var worldToLocalMatrix = this.transform.worldToLocalMatrix;
                this._activeParticles.forEach(p =>
                {
                    worldToLocalMatrix.transformPoint3(p.position, p.position);
                    worldToLocalMatrix.transformVector3(p.velocity, p.velocity);
                    worldToLocalMatrix.transformVector3(p.acceleration, p.acceleration);
                });
            } else
            {
                var localToWorldMatrix = this.transform.localToWorldMatrix;
                this._activeParticles.forEach(p =>
                {
                    localToWorldMatrix.transformPoint3(p.position, p.position);
                    localToWorldMatrix.transformVector3(p.velocity, p.velocity);
                    localToWorldMatrix.transformVector3(p.acceleration, p.acceleration);
                });
            }
        }

        /**
         * 给指定粒子添加指定空间的位移。
         * 
         * @param particle 粒子。
         * @param position 速度。
         * @param space 速度所在空间。
         * @param name  速度名称。如果不为 undefined 时保存，调用 removeParticleVelocity 可以移除该部分速度。
         */
        addParticlePosition(particle: Particle, position: Vector3, space: ParticleSystemSimulationSpace, name?: string)
        {
            if (name != undefined)
            {
                this.removeParticleVelocity(particle, name);
                particle.cache[name] = { value: position.clone(), space: space };
            }

            if (space != this.main.simulationSpace)
            {
                if (space == ParticleSystemSimulationSpace.World)
                {
                    this.transform.worldToLocalMatrix.transformPoint3(position, position);
                } else
                {
                    this.transform.localToWorldMatrix.transformPoint3(position, position);
                }
            }
            //
            particle.position.add(position);
        }

        /**
         * 移除指定粒子上的位移
         * 
         * @param particle 粒子。
         * @param name 位移名称。
         */
        removeParticlePosition(particle: Particle, name: string)
        {
            var obj: { value: Vector3, space: ParticleSystemSimulationSpace } = particle.cache[name];
            if (obj)
            {
                delete particle.cache[name];

                var space = obj.space;
                var value = obj.value;
                if (space != this.main.simulationSpace)
                {
                    if (space == ParticleSystemSimulationSpace.World)
                    {
                        this.transform.worldToLocalMatrix.transformPoint3(value, value);
                    } else
                    {
                        this.transform.localToWorldMatrix.transformPoint3(value, value);
                    }
                }
                //
                particle.position.sub(value);
            }
        }

        /**
         * 给指定粒子添加指定空间的速度。
         * 
         * @param particle 粒子。
         * @param velocity 速度。
         * @param space 速度所在空间。
         * @param name  速度名称。如果不为 undefined 时保存，调用 removeParticleVelocity 可以移除该部分速度。
         */
        addParticleVelocity(particle: Particle, velocity: Vector3, space: ParticleSystemSimulationSpace, name?: string)
        {
            if (name != undefined)
            {
                this.removeParticleVelocity(particle, name);
                particle.cache[name] = { value: velocity.clone(), space: space };
            }

            if (space != this.main.simulationSpace)
            {
                if (space == ParticleSystemSimulationSpace.World)
                {
                    this.transform.worldToLocalMatrix.transformVector3(velocity, velocity);
                } else
                {
                    this.transform.localToWorldMatrix.transformVector3(velocity, velocity);
                }
            }
            //
            particle.velocity.add(velocity);
        }

        /**
         * 移除指定粒子上的速度
         * 
         * @param particle 粒子。
         * @param name 速度名称。
         */
        removeParticleVelocity(particle: Particle, name: string)
        {
            var obj: { value: Vector3, space: ParticleSystemSimulationSpace } = particle.cache[name];
            if (obj)
            {
                delete particle.cache[name];

                var space = obj.space;
                var value = obj.value;
                if (space != this.main.simulationSpace)
                {
                    if (space == ParticleSystemSimulationSpace.World)
                    {
                        this.transform.worldToLocalMatrix.transformVector3(value, value);
                    } else
                    {
                        this.transform.localToWorldMatrix.transformVector3(value, value);
                    }
                }
                //
                particle.velocity.sub(value);
            }
        }

        /**
         * 给指定粒子添加指定空间的速度。
         * 
         * @param particle 粒子。
         * @param acceleration 加速度。
         * @param space 加速度所在空间。
         * @param name  加速度名称。如果不为 undefined 时保存，调用 removeParticleVelocity 可以移除该部分速度。
         */
        addParticleAcceleration(particle: Particle, acceleration: Vector3, space: ParticleSystemSimulationSpace, name?: string)
        {
            if (name != undefined)
            {
                this.removeParticleAcceleration(particle, name);
                particle.cache[name] = { value: acceleration.clone(), space: space };
            }

            if (space != this.main.simulationSpace)
            {
                if (space == ParticleSystemSimulationSpace.World)
                {
                    this.transform.worldToLocalMatrix.transformVector3(acceleration, acceleration);
                } else
                {
                    this.transform.localToWorldMatrix.transformVector3(acceleration, acceleration);
                }
            }
            //
            particle.acceleration.add(acceleration);
        }

        /**
         * 移除指定粒子上的加速度
         * 
         * @param particle 粒子。
         * @param name 加速度名称。
         */
        removeParticleAcceleration(particle: Particle, name: string)
        {
            var obj: { value: Vector3, space: ParticleSystemSimulationSpace } = particle.cache[name];
            if (obj)
            {
                delete particle.cache[name];

                var space = obj.space;
                var value = obj.value;
                if (space != this.main.simulationSpace)
                {
                    if (space == ParticleSystemSimulationSpace.World)
                    {
                        this.transform.worldToLocalMatrix.transformVector3(value, value);
                    } else
                    {
                        this.transform.localToWorldMatrix.transformVector3(value, value);
                    }
                }
                //
                particle.acceleration.sub(value);
            }
        }

        /**
         * 触发子发射器
         * 
         * @param subEmitterIndex 子发射器索引
         */
        TriggerSubEmitter(subEmitterIndex: number, particles: Particle[] = null)
        {
            if (!this.subEmitters.enabled) return;

            var subEmitter = this.subEmitters.GetSubEmitterSystem(subEmitterIndex);
            if (!subEmitter) return;

            if (!subEmitter.enabled) return;

            var probability = this.subEmitters.GetSubEmitterEmitProbability(subEmitterIndex);
            this.subEmitters.GetSubEmitterProperties(subEmitterIndex);
            this.subEmitters.GetSubEmitterType(subEmitterIndex);

            particles = particles || this._activeParticles;

            var emits: {
                time: number;
                num: number;
                position: Vector3;
                emitInfo: ParticleSystemEmitInfo;
            }[] = [];

            particles.forEach(particle =>
            {
                if (Math.random() > probability) return;

                // 粒子所在世界坐标
                var particleWoldPos = this.transform.localToWorldMatrix.transformPoint3(particle.position);
                // 粒子在子粒子系统的坐标
                var subEmitPos = subEmitter.transform.worldToLocalMatrix.transformPoint3(particleWoldPos);
                if (!particle.subEmitInfo)
                {
                    var startDelay = this.main.startDelay.getValue(Math.random());
                    particle.subEmitInfo = {
                        preTime: particle.preTime - particle.birthTime - startDelay,
                        currentTime: particle.preTime - particle.birthTime - startDelay,
                        preWorldPos: particleWoldPos.clone(),
                        currentWorldPos: particleWoldPos.clone(),
                        rateAtDuration: 0,
                        _leftRateOverDistance: 0,
                        _isRateOverDistance: false,
                        startDelay: startDelay,
                        moveVec: new Vector3(),
                        speed: new Vector3(),
                        position: subEmitPos,
                    };
                } else
                {
                    particle.subEmitInfo.preTime = particle.preTime - particle.birthTime - particle.subEmitInfo.startDelay;
                    particle.subEmitInfo.currentTime = particle.curTime - particle.birthTime - particle.subEmitInfo.startDelay;

                    particle.subEmitInfo.position.copy(subEmitPos);
                }

                var subEmits = subEmitter._emit(particle.subEmitInfo);

                emits = emits.concat(subEmits);
            });

            emits.sort((a, b) => { return a.time - b.time });
            emits.forEach(v =>
            {
                subEmitter._emitParticles(v);
            });
        }

        /**
         * 是否为被上级粒子系统引用的子粒子系统。
         */
        _isSubParticleSystem = false;

        /**
         * 发射信息
         */
        _emitInfo: ParticleSystemEmitInfo;
    }

    /**
     * 粒子系统发射器状态信息
     */
    export interface ParticleSystemEmitInfo
    {
        /**
         * 上次粒子系统时间
         */
        preTime: number;

        /**
         * 当前粒子系统时间
         */
        currentTime: number;

        /**
         * 上次世界坐标
         */
        preWorldPos: Vector3;

        /**
         * 当前世界坐标
         */
        currentWorldPos: Vector3;

        /**
         * 发射器本地位置
         */
        position: Vector3;

        /**
         * Start delay in seconds.
         * 启动延迟(以秒为单位)。在调用.play()时初始化值。
         */
        startDelay: number;

        /**
         * 此次位移
         */
        moveVec: Vector3;

        /**
         * 当前移动速度
         */
        speed: Vector3;

        /**
         * 此时在发射周期的位置
         */
        rateAtDuration: number;

        /**
         * 用于处理移动发射的剩余移动距离。
         */
        _leftRateOverDistance: number;

        /**
         * 是否已经执行位移发射。
         */
        _isRateOverDistance: boolean;
    }

    export interface DefaultGeometry
    {
        "Billboard-Geometry": QuadGeometry;
    }
    Geometry.setDefault("Billboard-Geometry", new QuadGeometry());

    GameObject.registerPrimitive("Particle System", (g) =>
    {
        g.addComponent("ParticleSystem");
        g.getComponent("Transform").rx = -90;
    });

    export interface PrimitiveGameObject
    {
        "Particle System": GameObject;
    }
}