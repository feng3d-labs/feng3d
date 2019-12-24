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
        @oav({ block: "main", component: "OAVObjectView" })
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
        @oav({ block: "emission", component: "OAVObjectView" })
        get emission() { return this._emission; }
        set emission(v)
        {
            Array.replace(this._modules, this._emission, v);
            v.particleSystem = this;
            this._emission = v;
        }
        private _emission: ParticleEmissionModule;

        @serialize
        @oav({ block: "shape", component: "OAVObjectView" })
        get shape() { return this._shape; }
        set shape(v)
        {
            Array.replace(this._modules, this._shape, v);
            v.particleSystem = this;
            this._shape = v;
        }
        private _shape: ParticleShapeModule;

        @serialize
        @oav({ block: "velocityOverLifetime", component: "OAVObjectView" })
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
        @oav({ tooltip: "基于时间轴限制速度模块。", block: "limitVelocityOverLifetime", component: "OAVObjectView" })
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
        @oav({ tooltip: "粒子系统速度继承模块。", block: "inheritVelocity", component: "OAVObjectView" })
        get inheritVelocity() { return this._inheritVelocity; }
        set inheritVelocity(v)
        {
            Array.replace(this._modules, this._inheritVelocity, v);
            v.particleSystem = this;
            this._inheritVelocity = v;
        }
        private _inheritVelocity: ParticleInheritVelocityModule;

        @serialize
        @oav({ block: "forceOverLifetime", component: "OAVObjectView" })
        get forceOverLifetime() { return this._forceOverLifetime; }
        set forceOverLifetime(v)
        {
            Array.replace(this._modules, this._forceOverLifetime, v);
            v.particleSystem = this;
            this._forceOverLifetime = v;
        }
        private _forceOverLifetime: ParticleForceOverLifetimeModule;

        @serialize
        @oav({ block: "colorOverLifetime", component: "OAVObjectView" })
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
        @oav({ block: "colorBySpeed", component: "OAVObjectView" })
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
        @oav({ block: "SizeBySpeed", component: "OAVObjectView" })
        get sizeBySpeed() { return this._sizeBySpeed; }
        set sizeBySpeed(v)
        {
            Array.replace(this._modules, this._sizeBySpeed, v);
            v.particleSystem = this;
            this._sizeBySpeed = v;
        }
        private _sizeBySpeed: ParticleSizeBySpeedModule;

        @serialize
        @oav({ block: "rotationOverLifetime", component: "OAVObjectView" })
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
        @oav({ block: "rotationBySpeed", component: "OAVObjectView" })
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
        @oav({ block: "noise", component: "OAVObjectView" })
        get noise() { return this._noise; }
        set noise(v)
        {
            Array.replace(this._modules, this._noise, v);
            v.particleSystem = this;
            this._noise = v;
        }
        private _noise: ParticleNoiseModule;

        /**
         * 粒子系统纹理表动画模块。
         */
        @serialize
        @oav({ tooltip: "粒子系统纹理表动画模块。", block: "textureSheetAnimation", component: "OAVObjectView" })
        get textureSheetAnimation() { return this._textureSheetAnimation; }
        set textureSheetAnimation(v)
        {
            Array.replace(this._modules, this._textureSheetAnimation, v);
            v.particleSystem = this;
            this._textureSheetAnimation = v;
        }
        private _textureSheetAnimation: ParticleTextureSheetAnimationModule;

        @oav({ block: "Renderer" })
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

        /**
         * Start delay in seconds.
         * 启动延迟(以秒为单位)。在调用.play()时初始化值。
         */
        startDelay = 0;

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
            this.textureSheetAnimation = new ParticleTextureSheetAnimationModule();

            this.main.enabled = true;
            this.emission.enabled = true;
            this.shape.enabled = true;
        }

        update(interval: number)
        {
            if (!this.isPlaying) return;

            this.time = this.time + this.main.simulationSpeed * interval / 1000;
            this._realTime = this.time - this.startDelay;
            // 粒子系统位置
            this.worldPos.copy(this.transform.worldPosition);
            // 粒子系统位移
            this.moveVec.copy(this.worldPos).sub(this._preworldPos);
            // 粒子系统速度
            this.speed.copy(this.moveVec).divideNumber(this.main.simulationSpeed * interval / 1000);

            this._updateActiveParticlesState();

            // 完成一个循环
            if (this.main.loop && Math.floor(this._preRealTime / this.main.duration) < Math.floor(this._realTime / this.main.duration))
            {
                // 重新计算喷发概率
                this.emission.bursts.forEach(element =>
                {
                    element.calculateProbability();
                });
            }

            this._emit();

            this._preRealTime = this._realTime;
            this._preworldPos.copy(this.worldPos);

            // 判断非循环的效果是否播放结束
            if (!this.main.loop && this._activeParticles.length == 0 && this._realTime > this.main.duration)
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
            this._startDelay_rate = Math.random();
            this.updateStartDelay();
            this._preRealTime = 0;

            this._particlePool = this._particlePool.concat(this._activeParticles);
            this._activeParticles.length = 0;

            // 重新计算喷发概率
            this.emission.bursts.forEach(element =>
            {
                element.calculateProbability();
            });
        }

        private _startDelay_rate = Math.random();

        /**
         * @private
         */
        updateStartDelay()
        {
            this.startDelay = this.main.startDelay.getValue(this._startDelay_rate);
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
                this._preRealTime = Math.max(0, this._realTime);
            }
        }

        beforeRender(gl: GL, renderAtomic: RenderAtomic, scene: Scene, camera: Camera)
        {
            super.beforeRender(gl, renderAtomic, scene, camera);

            if (Boolean(scene.runEnvironment & RunEnvironment.feng3d) && !this._awaked)
            {
                this._isPlaying = this._isPlaying || this.main.playOnAwake;
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
                var localCameraForward = cameraMatrix.forward;
                var localCameraUp = cameraMatrix.up;
                if (this.main.simulationSpace == ParticleSystemSimulationSpace.Local)
                {
                    localCameraForward = this.gameObject.transform.worldToLocalRotationMatrix.transformVector(localCameraForward);
                    localCameraUp = this.gameObject.transform.worldToLocalRotationMatrix.transformVector(localCameraUp);
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
         * 当前真实时间（time - startDelay）
         */
        private _realTime = 0;
        /**
         * 上次真实时间
         */
        private _preRealTime = 0;

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
         * 此时在周期中的位置
         */
        get rateAtDuration()
        {
            return (this._realTime % this.main.duration) / this.main.duration;
        }

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
            if (this._realTime <= 0) return;

            var loop = this.main.loop;
            var duration = this.main.duration;
            var rateAtDuration = this.rateAtDuration;
            var preRealTime = this._preRealTime;

            // 判断是否结束发射
            if (!loop && preRealTime >= duration) return;

            // 计算最后发射时间
            var realEmitTime = this._realTime;
            if (!loop) realEmitTime = Math.min(realEmitTime, duration);

            // 
            var emits: { time: number, num: number, position?: Vector3 }[] = [];
            // 单粒子发射周期
            var step = 1 / this.emission.rateOverTime.getValue(rateAtDuration);
            var bursts = this.emission.bursts;
            // 处理移动发射粒子
            if (this.main.simulationSpace == ParticleSystemSimulationSpace.World)
            {
                if (this._isRateOverDistance)
                {
                    var moveVec = this.moveVec;
                    var worldPos = this.worldPos;
                    // 本次移动距离
                    if (moveVec.lengthSquared > 0)
                    {
                        // 移动方向
                        var moveDir = moveVec.clone().normalize();
                        // 剩余移动量
                        var leftRateOverDistance = this._leftRateOverDistance + moveVec.length;
                        // 发射频率
                        var rateOverDistance = this.emission.rateOverDistance.getValue(rateAtDuration);
                        // 发射间隔距离
                        var invRateOverDistance = 1 / rateOverDistance;
                        // 发射间隔位移
                        var invRateOverDistanceVec = moveDir.scaleNumberTo(1 / rateOverDistance);
                        // 上次发射位置
                        var lastRateOverDistance = this._preworldPos.addTo(moveDir.negateTo().scaleNumber(this._leftRateOverDistance));
                        // 发射位置列表
                        var emitPosArr: Vector3[] = [];
                        while (invRateOverDistance < leftRateOverDistance)
                        {
                            emitPosArr.push(lastRateOverDistance.add(invRateOverDistanceVec).clone());
                            leftRateOverDistance -= invRateOverDistance;
                        }
                        this._leftRateOverDistance = leftRateOverDistance;
                        emitPosArr.forEach(p =>
                        {
                            emits.push({ time: this.time, num: 1, position: p.sub(worldPos) });
                        });
                    }
                }
                this._isRateOverDistance = true;
            } else
            {
                this._isRateOverDistance = false;
                this._leftRateOverDistance = 0;
            }

            // 遍历所有发射周期
            var cycleStartIndex = Math.floor(preRealTime / duration);
            var cycleEndIndex = Math.ceil(realEmitTime / duration);
            for (let k = cycleStartIndex; k < cycleEndIndex; k++)
            {
                var cycleStartTime = k * duration;
                var cycleEndTime = (k + 1) * duration;

                // 单个周期内的起始与结束时间
                var startTime = Math.max(preRealTime, cycleStartTime);
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
                    if (burst.isProbability && inCycleStart <= burst.time && burst.time < inCycleEnd)
                    {
                        emits.push({ time: cycleStartTime + burst.time, num: burst.count.getValue(rateAtDuration) });
                    }
                }
            }

            emits.sort((a, b) => { return a.time - b.time });;

            emits.forEach(v =>
            {
                this._emitParticles(v);
            });
        }

        /**
         * 发射粒子
         * @param birthTime 发射时间
         * @param num 发射数量
         */
        private _emitParticles(v: { time: number; num: number; position?: Vector3; })
        {
            var rateAtDuration = this.rateAtDuration;
            var num = v.num;
            var birthTime = v.time;
            var position = v.position || new Vector3();
            for (let i = 0; i < num; i++)
            {
                if (this._activeParticles.length >= this.main.maxParticles) return;
                var lifetime = this.main.startLifetime.getValue(rateAtDuration);
                var birthRateAtDuration = (birthTime - this.startDelay) / this.main.duration;
                var rateAtLifeTime = (this._realTime - birthTime) / lifetime;

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
                particle.rateAtLifeTime = (this._realTime - particle.birthTime) / particle.lifetime;
                if (particle.rateAtLifeTime < 0 || particle.rateAtLifeTime > 1)
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
            var preTime = Math.max(this._preRealTime, particle.birthTime);
            //
            this._modules.forEach(v => { v.updateParticleState(particle) });
            particle.updateState(preTime, this._realTime);
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
                    worldToLocalMatrix.transformVector(p.position, p.position);
                    worldToLocalMatrix.deltaTransformVector(p.velocity, p.velocity);
                    worldToLocalMatrix.deltaTransformVector(p.acceleration, p.acceleration);
                });
            } else
            {
                var localToWorldMatrix = this.transform.localToWorldMatrix;
                this._activeParticles.forEach(p =>
                {
                    localToWorldMatrix.transformVector(p.position, p.position);
                    localToWorldMatrix.deltaTransformVector(p.velocity, p.velocity);
                    localToWorldMatrix.deltaTransformVector(p.acceleration, p.acceleration);
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
                    this.transform.worldToLocalMatrix.transformVector(position, position);
                } else
                {
                    this.transform.localToWorldMatrix.transformVector(position, position);
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
                        this.transform.worldToLocalMatrix.transformVector(value, value);
                    } else
                    {
                        this.transform.localToWorldMatrix.transformVector(value, value);
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
                    this.transform.worldToLocalMatrix.deltaTransformVector(velocity, velocity);
                } else
                {
                    this.transform.localToWorldMatrix.deltaTransformVector(velocity, velocity);
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
                        this.transform.worldToLocalMatrix.deltaTransformVector(value, value);
                    } else
                    {
                        this.transform.localToWorldMatrix.deltaTransformVector(value, value);
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
                    this.transform.worldToLocalMatrix.deltaTransformVector(acceleration, acceleration);
                } else
                {
                    this.transform.localToWorldMatrix.deltaTransformVector(acceleration, acceleration);
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
                        this.transform.worldToLocalMatrix.deltaTransformVector(value, value);
                    } else
                    {
                        this.transform.localToWorldMatrix.deltaTransformVector(value, value);
                    }
                }
                //
                particle.acceleration.sub(value);
            }
        }

        /**
         * 上次移动发射的位置
         */
        private _preworldPos = new Vector3();
        private _isRateOverDistance = false;
        private _leftRateOverDistance = 0;
        //
        worldPos = new Vector3();
        moveVec = new Vector3();
        speed = new Vector3;
    }

    export interface DefaultGeometry
    {
        "Billboard-Geometry": QuadGeometry;
    }
    Geometry.setDefault("Billboard-Geometry", new QuadGeometry());
}