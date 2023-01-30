import { createNodeMenu } from '../../core/CreateNodeMenu';
import { Material } from '../../core/Material';
import { RunEnvironment } from '../../core/RunEnvironment';
import { RegisterComponent } from '../../ecs/Component';
import { Matrix3x3 } from '../../math/geom/Matrix3x3';
import { Matrix4x4 } from '../../math/geom/Matrix4x4';
import { Vector3 } from '../../math/geom/Vector3';
import { oav } from '../../objectview/ObjectView';
import { ArrayUtils } from '../../polyfill/ArrayUtils';
import { AttributeBuffer } from '../../renderer/data/AttributeBuffer';
import { RenderAtomic } from '../../renderer/data/RenderAtomic';
import { Uniforms } from '../../renderer/data/Uniforms';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { watcher } from '../../watcher/watcher';
import { Camera3D } from '../cameras/Camera3D';
import { Component3D } from '../core/Component3D';
import { Node3D } from '../core/Node3D';
import { Scene3D } from '../core/Scene3D';
import { Geometry } from '../geometrys/Geometry';
import { QuadGeometry } from '../geometrys/QuadGeometry';
import { ParticleSystemSimulationSpace } from './enums/ParticleSystemSimulationSpace';
import { ParticleColorBySpeedModule } from './modules/ParticleColorBySpeedModule';
import { ParticleColorOverLifetimeModule } from './modules/ParticleColorOverLifetimeModule';
import { ParticleEmissionModule } from './modules/ParticleEmissionModule';
import { ParticleForceOverLifetimeModule } from './modules/ParticleForceOverLifetimeModule';
import { ParticleInheritVelocityModule } from './modules/ParticleInheritVelocityModule';
import { ParticleLimitVelocityOverLifetimeModule } from './modules/ParticleLimitVelocityOverLifetimeModule';
import { ParticleMainModule } from './modules/ParticleMainModule';
import { ParticleModule } from './modules/ParticleModule';
import { ParticleNoiseModule } from './modules/ParticleNoiseModule';
import { ParticleRotationBySpeedModule } from './modules/ParticleRotationBySpeedModule';
import { ParticleRotationOverLifetimeModule } from './modules/ParticleRotationOverLifetimeModule';
import { ParticleShapeModule } from './modules/ParticleShapeModule';
import { ParticleSizeBySpeedModule } from './modules/ParticleSizeBySpeedModule';
import { ParticleSizeOverLifetimeModule } from './modules/ParticleSizeOverLifetimeModule';
import { ParticleSubEmittersModule } from './modules/ParticleSubEmittersModule';
import { ParticleTextureSheetAnimationModule } from './modules/ParticleTextureSheetAnimationModule';
import { ParticleVelocityOverLifetimeModule } from './modules/ParticleVelocityOverLifetimeModule';
import { Particle } from './Particle';

declare module '../../ecs/Component' { interface ComponentMap { ParticleSystem3D: ParticleSystem3D } }

declare module '../geometrys/Geometry' { interface DefaultGeometryMap { 'Billboard-Geometry': QuadGeometry; } }

declare module '../core/Node3D' { interface PrimitiveNode3D { 'Particle System': Node3D; } }

declare module '../core/Node3D'
{
    interface Node3DEventMap
    {
        /**
         * 粒子系统播放完一个周期
         */
        particleCycled: ParticleSystem3D;

        /**
         * 粒子效果播放结束
         */
        particleCompleted: ParticleSystem3D;
    }
}

declare module '../../renderer/data/Uniforms'
{
    interface Uniforms
    {
        /**
         * 粒子公告牌矩阵
         */
        u_particle_billboardMatrix: Matrix3x3;
    }
}

/**
 * 粒子系统
 */
@RegisterComponent({ name: 'ParticleSystem3D', dependencies: ['Mesh3D'], single: true, menu: 'Effects/ParticleSystem' })
export class ParticleSystem3D extends Component3D
{
    declare __class__: 'ParticleSystem3D';

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
        return !this._isPlaying && this.time === 0;
    }

    /**
     * Is the particle system paused right now ?
     *
     * 粒子系统现在暂停了吗?
     */
    get isPaused()
    {
        return !this._isPlaying && this.time !== 0;
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

    @SerializeProperty()
    @oav({ block: 'Main', component: 'OAVObjectView' })
    get main() { return this._main; }
    set main(v)
    {
        if (this._main)
        {
            watcher.unwatch(this._main, 'simulationSpace', this._simulationSpaceChanged, this);
        }
        ArrayUtils.replace(this._modules, this._main, v);
        v.particleSystem = this;
        this._main = v;
        watcher.watch(this._main, 'simulationSpace', this._simulationSpaceChanged, this);
    }
    private _main: ParticleMainModule;

    @SerializeProperty()
    @oav({ block: 'Emission', component: 'OAVObjectView' })
    get emission() { return this._emission; }
    set emission(v)
    {
        ArrayUtils.replace(this._modules, this._emission, v);
        v.particleSystem = this;
        this._emission = v;
    }
    private _emission: ParticleEmissionModule;

    @SerializeProperty()
    @oav({ block: 'Shape', component: 'OAVObjectView' })
    get shape() { return this._shape; }
    set shape(v)
    {
        ArrayUtils.replace(this._modules, this._shape, v);
        v.particleSystem = this;
        this._shape = v;
    }
    private _shape: ParticleShapeModule;

    @SerializeProperty()
    @oav({ block: 'Velocity Over Lifetime', component: 'OAVObjectView' })
    get velocityOverLifetime() { return this._velocityOverLifetime; }
    set velocityOverLifetime(v)
    {
        ArrayUtils.replace(this._modules, this._velocityOverLifetime, v);
        v.particleSystem = this;
        this._velocityOverLifetime = v;
    }
    private _velocityOverLifetime: ParticleVelocityOverLifetimeModule;

    @SerializeProperty()
    // @oav({ tooltip: "limit velocity over lifetime module.", block: "limitVelocityOverLifetime", component: "OAVObjectView" })
    @oav({ tooltip: '基于时间轴限制速度模块。', block: 'Limit Velocity Over Lifetime', component: 'OAVObjectView' })
    get limitVelocityOverLifetime() { return this._limitVelocityOverLifetime; }
    set limitVelocityOverLifetime(v)
    {
        ArrayUtils.replace(this._modules, this._limitVelocityOverLifetime, v);
        v.particleSystem = this;
        this._limitVelocityOverLifetime = v;
    }
    private _limitVelocityOverLifetime: ParticleLimitVelocityOverLifetimeModule;

    /**
     * Script interface for the Particle System velocity inheritance module.
     *
     * 粒子系统速度继承模块。
     */
    @SerializeProperty()
    @oav({ tooltip: '粒子系统速度继承模块。', block: 'Inherit Velocity', component: 'OAVObjectView' })
    get inheritVelocity() { return this._inheritVelocity; }
    set inheritVelocity(v)
    {
        ArrayUtils.replace(this._modules, this._inheritVelocity, v);
        v.particleSystem = this;
        this._inheritVelocity = v;
    }
    private _inheritVelocity: ParticleInheritVelocityModule;

    @SerializeProperty()
    @oav({ block: 'Force Over Lifetime', component: 'OAVObjectView' })
    get forceOverLifetime() { return this._forceOverLifetime; }
    set forceOverLifetime(v)
    {
        ArrayUtils.replace(this._modules, this._forceOverLifetime, v);
        v.particleSystem = this;
        this._forceOverLifetime = v;
    }
    private _forceOverLifetime: ParticleForceOverLifetimeModule;

    @SerializeProperty()
    @oav({ block: 'Color Over Lifetime', component: 'OAVObjectView' })
    get colorOverLifetime() { return this._colorOverLifetime; }
    set colorOverLifetime(v)
    {
        ArrayUtils.replace(this._modules, this._colorOverLifetime, v);
        v.particleSystem = this;
        this._colorOverLifetime = v;
    }
    private _colorOverLifetime: ParticleColorOverLifetimeModule;

    /**
     * 颜色随速度变化模块。
     */
    @SerializeProperty()
    @oav({ block: 'Color By Speed', component: 'OAVObjectView' })
    get colorBySpeed() { return this._colorBySpeed; }
    set colorBySpeed(v)
    {
        ArrayUtils.replace(this._modules, this._colorBySpeed, v);
        v.particleSystem = this;
        this._colorBySpeed = v;
    }
    private _colorBySpeed: ParticleColorBySpeedModule;

    @SerializeProperty()
    @oav({ block: 'sizeOverLifetime', component: 'OAVObjectView' })
    get sizeOverLifetime() { return this._sizeOverLifetime; }
    set sizeOverLifetime(v)
    {
        ArrayUtils.replace(this._modules, this._sizeOverLifetime, v);
        v.particleSystem = this;
        this._sizeOverLifetime = v;
    }
    private _sizeOverLifetime: ParticleSizeOverLifetimeModule;

    /**
     * 缩放随速度变化模块
     */
    @SerializeProperty()
    @oav({ block: 'Size By Speed', component: 'OAVObjectView' })
    get sizeBySpeed() { return this._sizeBySpeed; }
    set sizeBySpeed(v)
    {
        ArrayUtils.replace(this._modules, this._sizeBySpeed, v);
        v.particleSystem = this;
        this._sizeBySpeed = v;
    }
    private _sizeBySpeed: ParticleSizeBySpeedModule;

    @SerializeProperty()
    @oav({ block: 'Rotation Over Lifetime', component: 'OAVObjectView' })
    get rotationOverLifetime() { return this._rotationOverLifetime; }
    set rotationOverLifetime(v)
    {
        ArrayUtils.replace(this._modules, this._rotationOverLifetime, v);
        v.particleSystem = this;
        this._rotationOverLifetime = v;
    }
    private _rotationOverLifetime: ParticleRotationOverLifetimeModule;

    /**
     * 旋转角度随速度变化模块
     */
    @SerializeProperty()
    @oav({ block: 'Rotation By Speed', component: 'OAVObjectView' })
    get rotationBySpeed() { return this._rotationBySpeed; }
    set rotationBySpeed(v)
    {
        ArrayUtils.replace(this._modules, this._rotationBySpeed, v);
        v.particleSystem = this;
        this._rotationBySpeed = v;
    }
    private _rotationBySpeed: ParticleRotationBySpeedModule;

    /**
     * 旋转角度随速度变化模块
     */
    @SerializeProperty()
    @oav({ block: 'Noise', component: 'OAVObjectView' })
    get noise() { return this._noise; }
    set noise(v)
    {
        ArrayUtils.replace(this._modules, this._noise, v);
        v.particleSystem = this;
        this._noise = v;
    }
    private _noise: ParticleNoiseModule;

    /**
     * 旋转角度随速度变化模块
     */
    @SerializeProperty()
    @oav({ block: 'Sub Emitters', component: 'OAVObjectView' })
    get subEmitters() { return this._subEmitters; }
    set subEmitters(v)
    {
        ArrayUtils.replace(this._modules, this._subEmitters, v);
        v.particleSystem = this;
        this._subEmitters = v;
    }
    private _subEmitters: ParticleSubEmittersModule;

    /**
     * 粒子系统纹理表动画模块。
     */
    @SerializeProperty()
    @oav({ tooltip: '粒子系统纹理表动画模块。', block: 'Texture Sheet Animation', component: 'OAVObjectView' })
    get textureSheetAnimation() { return this._textureSheetAnimation; }
    set textureSheetAnimation(v)
    {
        ArrayUtils.replace(this._modules, this._textureSheetAnimation, v);
        v.particleSystem = this;
        this._textureSheetAnimation = v;
    }
    private _textureSheetAnimation: ParticleTextureSheetAnimationModule;

    @oav({ tooltip: '粒子系统渲染模块。', block: 'Renderer' })
    geometry = Geometry.getDefault('Billboard-Geometry');

    @oav({ block: 'Renderer' })
    material = Material.getDefault('Particle-Material');

    @oav({ block: 'Renderer' })
    @SerializeProperty()
    castShadows = true;

    @oav({ block: 'Renderer' })
    @SerializeProperty()
    receiveShadows = true;

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

        const deltaTime = this.main.simulationSpeed * interval / 1000;
        this.time = this.time + deltaTime;

        const emitInfo = this._emitInfo;

        emitInfo.preTime = emitInfo.currentTime;
        emitInfo.currentTime = this.time - emitInfo.startDelay;
        emitInfo.preGlobalPos.copy(emitInfo.currentGlobalPos);

        // 粒子系统位置
        emitInfo.currentGlobalPos.copy(this.node3d.globalPosition);

        // 粒子系统位移
        emitInfo.moveVec.copy(emitInfo.currentGlobalPos).sub(emitInfo.preGlobalPos);
        // 粒子系统速度
        emitInfo.speed.copy(emitInfo.moveVec).divideNumber(deltaTime);

        this._modules.forEach((m) =>
        {
            m.update(deltaTime);
        });

        this._updateActiveParticlesState(deltaTime);

        // 完成一个循环
        if (this.main.loop && Math.floor(emitInfo.preTime / this.main.duration) < Math.floor(emitInfo.currentTime / this.main.duration))
        {
            // 重新计算喷发概率
            this.emission.bursts.forEach((element) =>
            {
                element.calculateProbability();
            });
            this.emitter.emit('particleCycled', this);
        }

        // 发射粒子
        if (!this._isSubParticleSystem) // 子粒子系统自身不会自动发射粒子
        {
            const emits = this._emit(emitInfo);

            emits.sort((a, b) => a.time - b.time);
            emits.forEach((v) =>
            {
                this._emitParticles(v);
            });
        }

        // 判断非循环的效果是否播放结束
        if (!this.main.loop && this._activeParticles.length === 0 && emitInfo.currentTime > this.main.duration)
        {
            this.stop();
            this.emitter.emit('particleCompleted', this);
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

        const startDelay = this.main.startDelay.getValue(Math.random());

        this._emitInfo
            = {
            preTime: -startDelay,
            currentTime: -startDelay,
            preGlobalPos: new Vector3(),
            currentGlobalPos: new Vector3(),
            rateAtDuration: 0,
            _leftRateOverDistance: 0,
            _isRateOverDistance: false,
            startDelay,
            moveVec: new Vector3(),
            speed: new Vector3(),
            position: new Vector3(),
        };

        // 重新计算喷发概率
        this.emission.bursts.forEach((element) =>
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
        if (this.time === 0)
        {
            this.play();
        }
        else
        {
            this._isPlaying = true;
            this._emitInfo.preTime = Math.max(0, this._emitInfo.currentTime);
        }
    }

    beforeRender(renderAtomic: RenderAtomic, scene: Scene3D, camera: Camera3D)
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
        const isBillboard = !this.shape.alignToDirection && this.geometry === Geometry.getDefault('Billboard-Geometry');
        const billboardMatrix = new Matrix3x3();
        if (isBillboard)
        {
            const cameraMatrix = camera.node3d.globalMatrix.clone();
            let localCameraForward = cameraMatrix.getAxisZ();
            let localCameraUp = cameraMatrix.getAxisY();
            if (this.main.simulationSpace === ParticleSystemSimulationSpace.Local)
            {
                localCameraForward = this.node3d.globalRotationInvertMatrix.transformPoint3(localCameraForward);
                localCameraUp = this.node3d.globalRotationInvertMatrix.transformPoint3(localCameraUp);
            }
            const matrix4x4 = new Matrix4x4();
            matrix4x4.lookAt(localCameraForward, localCameraUp);
            billboardMatrix.formMatrix4x4(matrix4x4);
        }

        const maxParticles = this.main.maxParticles;

        const positions = new Float32Array(maxParticles * 3);
        let positionIndex = 0;
        const scales = new Float32Array(maxParticles * 3);
        let scaleIndex = 0;
        const rotations = new Float32Array(maxParticles * 3);
        let rotationIndex = 0;
        const colors = new Float32Array(maxParticles * 4);
        let colorIndex = 0;
        const tilingOffsets = new Float32Array(maxParticles * 4);
        let tilingOffsetIndex = 0;
        const flipUVs = new Float32Array(maxParticles * 2);
        let flipUVIndex = 0;
        for (let i = 0, n = this._activeParticles.length; i < n; i++)
        {
            const particle = this._activeParticles[i];
            positions[positionIndex++] = particle.position.x;
            positions[positionIndex++] = particle.position.y;
            positions[positionIndex++] = particle.position.z;
            scales[scaleIndex++] = particle.size.x;
            scales[scaleIndex++] = particle.size.y;
            scales[scaleIndex++] = particle.size.z;

            rotations[rotationIndex++] = particle.rotation.x;
            rotations[rotationIndex++] = particle.rotation.y;
            rotations[rotationIndex++] = particle.rotation.z;
            colors[colorIndex++] = particle.color.r;
            colors[colorIndex++] = particle.color.g;
            colors[colorIndex++] = particle.color.b;
            colors[colorIndex++] = particle.color.a;
            tilingOffsets[tilingOffsetIndex++] = particle.tilingOffset.x;
            tilingOffsets[tilingOffsetIndex++] = particle.tilingOffset.y;
            tilingOffsets[tilingOffsetIndex++] = particle.tilingOffset.z;
            tilingOffsets[tilingOffsetIndex++] = particle.tilingOffset.w;
            flipUVs[flipUVIndex++] = particle.flipUV.x;
            flipUVs[flipUVIndex++] = particle.flipUV.y;
        }

        if (isBillboard)
        {
            for (let i = 0, n = rotations.length; i < n; i += 3)
            {
                rotations[i + 2] = -rotations[i + 2];
            }
        }

        //
        this._attributes.a_particle_position.array = positions;
        this._attributes.a_particle_scale.array = scales;
        this._attributes.a_particle_rotation.array = rotations;
        this._attributes.a_particle_color.array = colors;
        this._attributes.a_particle_tilingOffset.array = tilingOffsets;
        this._attributes.a_particle_flipUV.array = flipUVs;

        //
        renderAtomic.uniforms.u_particle_billboardMatrix = billboardMatrix;

        if (this.main.simulationSpace === ParticleSystemSimulationSpace.Global)
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
        a_particle_position: { array: [], itemSize: 3, divisor: 1, usage: 'DYNAMIC_DRAW' } as AttributeBuffer,
        a_particle_scale: { array: [], itemSize: 3, divisor: 1, usage: 'DYNAMIC_DRAW' } as AttributeBuffer,
        a_particle_rotation: { array: [], itemSize: 3, divisor: 1, usage: 'DYNAMIC_DRAW' } as AttributeBuffer,
        a_particle_color: { array: [], itemSize: 4, divisor: 1, usage: 'DYNAMIC_DRAW' } as AttributeBuffer,
        a_particle_tilingOffset: { array: [], itemSize: 4, divisor: 1, usage: 'DYNAMIC_DRAW' } as AttributeBuffer,
        a_particle_flipUV: { array: [], itemSize: 4, divisor: 1, usage: 'DYNAMIC_DRAW' } as AttributeBuffer,
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
        let emits: { time: number, num: number, position: Vector3, emitInfo: ParticleSystemEmitInfo }[] = [];

        const startTime = emitInfo.preTime;
        let endTime = emitInfo.currentTime;

        if (!this.emission.enabled) return emits;

        // 判断是否开始发射
        if (endTime <= 0) return emits;

        const loop = this.main.loop;
        const duration = this.main.duration;

        // 判断是否结束发射
        if (!loop && startTime >= duration) return emits;

        // 计算最后发射时间
        if (!loop) endTime = Math.min(endTime, duration);

        // 计算此处在发射周期的位置
        let rateAtDuration = (endTime % duration) / duration;
        if (rateAtDuration === 0 && endTime >= duration) rateAtDuration = 1;

        emitInfo.rateAtDuration = rateAtDuration;

        // 处理移动发射粒子
        const moveEmits = this._emitWithMove(emitInfo);
        emits = emits.concat(moveEmits);

        // 单粒子发射周期
        const timeEmits = this._emitWithTime(emitInfo, duration);
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
        const emits: { time: number; num: number; position: Vector3; emitInfo: ParticleSystemEmitInfo; }[] = [];
        if (this.main.simulationSpace === ParticleSystemSimulationSpace.Global)
        {
            if (emitInfo._isRateOverDistance)
            {
                const moveVec = emitInfo.currentGlobalPos.subTo(emitInfo.preGlobalPos);
                const moveDistance = moveVec.length;
                const globalPos = emitInfo.currentGlobalPos;
                // 本次移动距离
                if (moveDistance > 0)
                {
                    // 移动方向
                    const moveDir = moveVec.clone().normalize();
                    // 剩余移动量
                    let leftRateOverDistance = emitInfo._leftRateOverDistance + moveDistance;
                    // 发射频率
                    const rateOverDistance = this.emission.rateOverDistance.getValue(emitInfo.rateAtDuration);
                    // 发射间隔距离
                    const invRateOverDistance = 1 / rateOverDistance;
                    // 发射间隔位移
                    const invRateOverDistanceVec = moveDir.scaleNumberTo(1 / rateOverDistance);
                    // 上次发射位置
                    const lastRateOverDistance = emitInfo.preGlobalPos.addTo(moveDir.negateTo().scaleNumber(emitInfo._leftRateOverDistance));

                    while (invRateOverDistance < leftRateOverDistance)
                    {
                        emits.push({
                            position: lastRateOverDistance.add(invRateOverDistanceVec).clone().sub(globalPos),
                            time: emitInfo.preTime + (emitInfo.currentTime - emitInfo.preTime) * (1 - leftRateOverDistance / moveDistance),
                            num: 1,
                            emitInfo
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
        const rateAtDuration = emitInfo.rateAtDuration;
        const preTime = emitInfo.preTime;
        const currentTime = emitInfo.currentTime;

        const emits: { time: number; num: number; position: Vector3; emitInfo: ParticleSystemEmitInfo }[] = [];

        const step = 1 / this.emission.rateOverTime.getValue(rateAtDuration);
        const bursts = this.emission.bursts;
        // 遍历所有发射周期
        const cycleStartIndex = Math.floor(preTime / duration);
        const cycleEndIndex = Math.ceil(currentTime / duration);
        for (let k = cycleStartIndex; k < cycleEndIndex; k++)
        {
            const cycleStartTime = k * duration;
            const cycleEndTime = (k + 1) * duration;
            // 单个周期内的起始与结束时间
            const startTime = Math.max(preTime, cycleStartTime);
            const endTime = Math.min(currentTime, cycleEndTime);
            // 处理稳定发射
            const singleStart = Math.ceil(startTime / step) * step;
            for (let i = singleStart; i < endTime; i += step)
            {
                emits.push({ time: i, num: 1, emitInfo, position: emitInfo.position.clone() });
            }
            // 处理喷发
            const inCycleStart = startTime - cycleStartTime;
            const inCycleEnd = endTime - cycleStartTime;
            for (let i = 0; i < bursts.length; i++)
            {
                const burst = bursts[i];
                if (burst.isProbability && inCycleStart <= burst.time && burst.time < inCycleEnd)
                {
                    emits.push({ time: cycleStartTime + burst.time, num: burst.count.getValue(rateAtDuration), emitInfo, position: emitInfo.position.clone() });
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
        const num = v.num;
        const birthTime = v.time;
        const position = v.position;
        const emitInfo = v.emitInfo;
        for (let i = 0; i < num; i++)
        {
            if (this._activeParticles.length >= this.main.maxParticles) return;
            const lifetime = this.main.startLifetime.getValue(emitInfo.rateAtDuration);
            const birthRateAtDuration = (birthTime - emitInfo.startDelay) / this.main.duration;
            const rateAtLifeTime = (emitInfo.currentTime - birthTime) / lifetime;

            if (rateAtLifeTime < 1)
            {
                const particle = this._particlePool.pop() || new Particle();
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
            const particle = this._activeParticles[i];

            particle.rateAtLifeTime = (particle.curTime + deltaTime - particle.birthTime) / particle.lifetime;
            if (particle.rateAtLifeTime < 0 || particle.rateAtLifeTime > 1)
            {
                this._activeParticles.splice(i, 1);
                this._particlePool.push(particle);
                particle.subEmitInfo = null;
            }
            else
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
        this._modules.forEach((v) => { v.initParticleState(particle); });
    }

    /**
     * 更新粒子状态
     * @param particle 粒子
     */
    private _updateParticleState(particle: Particle, deltaTime: number)
    {
        //
        this._modules.forEach((v) => { v.updateParticleState(particle); });
        particle.updateState(particle.curTime + deltaTime);
    }

    private _simulationSpaceChanged()
    {
        if (this._activeParticles.length === 0) return;

        if (this._main.simulationSpace === ParticleSystemSimulationSpace.Local)
        {
            const globalInvertMatrix = this.node3d.invertGlobalMatrix;
            this._activeParticles.forEach((p) =>
            {
                globalInvertMatrix.transformPoint3(p.position, p.position);
                globalInvertMatrix.transformVector3(p.velocity, p.velocity);
                globalInvertMatrix.transformVector3(p.acceleration, p.acceleration);
            });
        }
        else
        {
            const globalMatrix = this.node3d.globalMatrix;
            this._activeParticles.forEach((p) =>
            {
                globalMatrix.transformPoint3(p.position, p.position);
                globalMatrix.transformVector3(p.velocity, p.velocity);
                globalMatrix.transformVector3(p.acceleration, p.acceleration);
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
        if (name !== undefined)
        {
            this.removeParticleVelocity(particle, name);
            particle.cache[name] = { value: position.clone(), space };
        }

        if (space !== this.main.simulationSpace)
        {
            if (space === ParticleSystemSimulationSpace.Global)
            {
                this.node3d.invertGlobalMatrix.transformPoint3(position, position);
            }
            else
            {
                this.node3d.globalMatrix.transformPoint3(position, position);
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
        const obj: { value: Vector3, space: ParticleSystemSimulationSpace } = particle.cache[name];
        if (obj)
        {
            delete particle.cache[name];

            const space = obj.space;
            const value = obj.value;
            if (space !== this.main.simulationSpace)
            {
                if (space === ParticleSystemSimulationSpace.Global)
                {
                    this.node3d.invertGlobalMatrix.transformPoint3(value, value);
                }
                else
                {
                    this.node3d.globalMatrix.transformPoint3(value, value);
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
        if (name !== undefined)
        {
            this.removeParticleVelocity(particle, name);
            particle.cache[name] = { value: velocity.clone(), space };
        }

        if (space !== this.main.simulationSpace)
        {
            if (space === ParticleSystemSimulationSpace.Global)
            {
                this.node3d.invertGlobalMatrix.transformVector3(velocity, velocity);
            }
            else
            {
                this.node3d.globalMatrix.transformVector3(velocity, velocity);
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
        const obj: { value: Vector3, space: ParticleSystemSimulationSpace } = particle.cache[name];
        if (obj)
        {
            delete particle.cache[name];

            const space = obj.space;
            const value = obj.value;
            if (space !== this.main.simulationSpace)
            {
                if (space === ParticleSystemSimulationSpace.Global)
                {
                    this.node3d.invertGlobalMatrix.transformVector3(value, value);
                }
                else
                {
                    this.node3d.globalMatrix.transformVector3(value, value);
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
        if (name !== undefined)
        {
            this.removeParticleAcceleration(particle, name);
            particle.cache[name] = { value: acceleration.clone(), space };
        }

        if (space !== this.main.simulationSpace)
        {
            if (space === ParticleSystemSimulationSpace.Global)
            {
                this.node3d.invertGlobalMatrix.transformVector3(acceleration, acceleration);
            }
            else
            {
                this.node3d.globalMatrix.transformVector3(acceleration, acceleration);
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
        const obj: { value: Vector3, space: ParticleSystemSimulationSpace } = particle.cache[name];
        if (obj)
        {
            delete particle.cache[name];

            const space = obj.space;
            const value = obj.value;
            if (space !== this.main.simulationSpace)
            {
                if (space === ParticleSystemSimulationSpace.Global)
                {
                    this.node3d.invertGlobalMatrix.transformVector3(value, value);
                }
                else
                {
                    this.node3d.globalMatrix.transformVector3(value, value);
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

        const subEmitter = this.subEmitters.GetSubEmitterSystem(subEmitterIndex);
        if (!subEmitter) return;

        if (!subEmitter.enabled) return;

        const probability = this.subEmitters.GetSubEmitterEmitProbability(subEmitterIndex);
        this.subEmitters.GetSubEmitterProperties(subEmitterIndex);
        this.subEmitters.GetSubEmitterType(subEmitterIndex);

        particles = particles || this._activeParticles;

        let emits: {
            time: number;
            num: number;
            position: Vector3;
            emitInfo: ParticleSystemEmitInfo;
        }[] = [];

        particles.forEach((particle) =>
        {
            if (Math.random() > probability) return;

            // 粒子所在全局坐标
            const particleWoldPos = this.node3d.globalMatrix.transformPoint3(particle.position);
            // 粒子在子粒子系统的坐标
            const subEmitPos = subEmitter.node3d.invertGlobalMatrix.transformPoint3(particleWoldPos);
            if (!particle.subEmitInfo)
            {
                const startDelay = this.main.startDelay.getValue(Math.random());
                particle.subEmitInfo = {
                    preTime: particle.preTime - particle.birthTime - startDelay,
                    currentTime: particle.preTime - particle.birthTime - startDelay,
                    preGlobalPos: particleWoldPos.clone(),
                    currentGlobalPos: particleWoldPos.clone(),
                    rateAtDuration: 0,
                    _leftRateOverDistance: 0,
                    _isRateOverDistance: false,
                    startDelay,
                    moveVec: new Vector3(),
                    speed: new Vector3(),
                    position: subEmitPos,
                };
            }
            else
            {
                particle.subEmitInfo.preTime = particle.preTime - particle.birthTime - particle.subEmitInfo.startDelay;
                particle.subEmitInfo.currentTime = particle.curTime - particle.birthTime - particle.subEmitInfo.startDelay;

                particle.subEmitInfo.position.copy(subEmitPos);
            }

            const subEmits = subEmitter._emit(particle.subEmitInfo);

            emits = emits.concat(subEmits);
        });

        emits.sort((a, b) => a.time - b.time);
        emits.forEach((v) =>
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
     * 上次全局坐标
     */
    preGlobalPos: Vector3;

    /**
     * 当前全局坐标
     */
    currentGlobalPos: Vector3;

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

Geometry.setDefault('Billboard-Geometry', new QuadGeometry());

Node3D.registerPrimitive('Particle System', (g) =>
{
    g.addComponent('ParticleSystem3D');
    g.rx = -90;
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: 'Effects/Particle System',
        priority: -1,
        click: () =>
            Node3D.createPrimitive('Particle System')
    }
);

