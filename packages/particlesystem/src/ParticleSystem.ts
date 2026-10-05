// registerLogic/logic 直接从 @feng3d/reactivity 导入（不经 feng3d barrel）：
// feng3d barrel 在 particlesystem 之后才 re-export reactivity，node/vitest 下
// barrel 模块求值顺序会取到未初始化的绑定（浏览器/vite 不受影响）
import { AddComponentMenu, createRenderableLogicBase, Object3D, QuadGeometry, Renderable, RenderableLogic, RunEnvironment, StandardMaterial } from 'feng3d';
import { registerLogic } from '@feng3d/reactivity';
import type { RenderObject, VertexAttribute } from '@feng3d/webgpu';
import { logic } from '@feng3d/reactivity';
import { mat3FromMatrix4x4, mat3Identity, mat4GetAxisY, mat4GetAxisZ, mat4Identity, mat4LookAt, mat4TransformPoint3, mat4TransformVector3, Matrix3x3, Matrix4x4, vec3Add, vec3Copy, vec3DivideNumber, vec3Length, vec3Negate, vec3NormalizeThickness, vec3ScaleNumber, vec3Sub, Vector3, Vector3Like, WritableVector3Like } from '@feng3d/math';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        ParticleSystem: RenderableLogic;
    }
}
import { oav } from '@feng3d/objectview';
import { ArrayUtils, decoratorRegisterClass } from '@feng3d/polyfill';
import { serialize } from '@feng3d/serialization';
import { watcher } from '@feng3d/watcher';
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
import { isParticleBillboard } from './isParticleBillboard';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        ParticleSystem: ParticleSystem;
    }
}

/**
 * 粒子系统写入 renderObject.uniforms 的 uniform 集合。
 * 各字段值可为矩阵实例或返回矩阵的工厂函数（渲染管线按需求值）。
 */
interface ParticleUniforms
{
    /** 公告牌矩阵 */
    u_particle_billboardMatrix?: Matrix3x3 | (() => Matrix4x4);
    /** 模型矩阵（世界空间时由渲染管线按帧求值） */
    u_modelMatrix?: Matrix3x3 | (() => Matrix4x4);
    /** 模型矩阵的逆转置（世界空间时由渲染管线按帧求值） */
    u_ITModelMatrix?: Matrix3x3 | (() => Matrix4x4);
}

/**
 * 粒子系统
 */
@AddComponentMenu('Effects/ParticleSystem')
@decoratorRegisterClass()
export class ParticleSystem implements Renderable
{
    readonly __type__: 'ParticleSystem' = 'ParticleSystem';
    enabled = true;
    runEnvironment = RunEnvironment.all;
    __class__: 'ParticleSystem';

    /**
     * 获取附加的 Object3D（替代已移除的 object3D/transform getter）。
     * 粒子系统逻辑较多，暂保留为方法形式，后续可迁移到 particleSystemLogic。
     */
    _obj(): Object3D
    {
        // entity 类型上可为 null（组件未挂载），但下面二十来处调用都假定已挂载；
        // 未挂载时读它仍然与原来一样会崩，故用断言而不放宽带宽返回类型（否则调用点连锁报错）
        return logic(this).entity!;
    }

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

    @serialize
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

    @serialize
    @oav({ block: 'Emission', component: 'OAVObjectView' })
    get emission() { return this._emission; }
    set emission(v)
    {
        ArrayUtils.replace(this._modules, this._emission, v);
        v.particleSystem = this;
        this._emission = v;
    }
    private _emission: ParticleEmissionModule;

    @serialize
    @oav({ block: 'Shape', component: 'OAVObjectView' })
    get shape() { return this._shape; }
    set shape(v)
    {
        ArrayUtils.replace(this._modules, this._shape, v);
        v.particleSystem = this;
        this._shape = v;
    }
    private _shape: ParticleShapeModule;

    @serialize
    @oav({ block: 'Velocity Over Lifetime', component: 'OAVObjectView' })
    get velocityOverLifetime() { return this._velocityOverLifetime; }
    set velocityOverLifetime(v)
    {
        ArrayUtils.replace(this._modules, this._velocityOverLifetime, v);
        v.particleSystem = this;
        this._velocityOverLifetime = v;
    }
    private _velocityOverLifetime: ParticleVelocityOverLifetimeModule;

    @serialize
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
    @serialize
    @oav({ tooltip: '粒子系统速度继承模块。', block: 'Inherit Velocity', component: 'OAVObjectView' })
    get inheritVelocity() { return this._inheritVelocity; }
    set inheritVelocity(v)
    {
        ArrayUtils.replace(this._modules, this._inheritVelocity, v);
        v.particleSystem = this;
        this._inheritVelocity = v;
    }
    private _inheritVelocity: ParticleInheritVelocityModule;

    @serialize
    @oav({ block: 'Force Over Lifetime', component: 'OAVObjectView' })
    get forceOverLifetime() { return this._forceOverLifetime; }
    set forceOverLifetime(v)
    {
        ArrayUtils.replace(this._modules, this._forceOverLifetime, v);
        v.particleSystem = this;
        this._forceOverLifetime = v;
    }
    private _forceOverLifetime: ParticleForceOverLifetimeModule;

    @serialize
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
    @serialize
    @oav({ block: 'Color By Speed', component: 'OAVObjectView' })
    get colorBySpeed() { return this._colorBySpeed; }
    set colorBySpeed(v)
    {
        ArrayUtils.replace(this._modules, this._colorBySpeed, v);
        v.particleSystem = this;
        this._colorBySpeed = v;
    }
    private _colorBySpeed: ParticleColorBySpeedModule;

    @serialize
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
    @serialize
    @oav({ block: 'Size By Speed', component: 'OAVObjectView' })
    get sizeBySpeed() { return this._sizeBySpeed; }
    set sizeBySpeed(v)
    {
        ArrayUtils.replace(this._modules, this._sizeBySpeed, v);
        v.particleSystem = this;
        this._sizeBySpeed = v;
    }
    private _sizeBySpeed: ParticleSizeBySpeedModule;

    @serialize
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
    @serialize
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
    @serialize
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
    @serialize
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
    @serialize
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
    geometry = { __type__: 'QuadGeometry' } as unknown as QuadGeometry;

    @oav({ block: 'Renderer' })
    material = { __type__: 'StandardMaterial' } as unknown as StandardMaterial;

    @oav({ block: 'Renderer' })
    @serialize
    castShadows = true;

    @oav({ block: 'Renderer' })
    @serialize
    receiveShadows = true;

    get single() { return true; }

    constructor()
    {
        

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
        vec3Copy(emitInfo.currentWorldPos, emitInfo.preWorldPos);

        // 粒子系统位置
        vec3Copy(logic(this._obj()).worldPosition, emitInfo.currentWorldPos);

        // 粒子系统位移
        vec3Sub(emitInfo.currentWorldPos, emitInfo.preWorldPos, emitInfo.moveVec);
        // 粒子系统速度
        vec3DivideNumber(emitInfo.moveVec, deltaTime, emitInfo.speed);

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
            preWorldPos: { x: 0, y: 0, z: 0 },
            currentWorldPos: { x: 0, y: 0, z: 0 },
            rateAtDuration: 0,
            _leftRateOverDistance: 0,
            _isRateOverDistance: false,
            startDelay,
            moveVec: { x: 0, y: 0, z: 0 },
            speed: { x: 0, y: 0, z: 0 },
            position: { x: 0, y: 0, z: 0 } };

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

    beforeRender(renderObject: RenderObject)
    {
        logic(this).baseBeforeRender(renderObject);

        if (!this._awaked)
        {
            if (this.main.playOnAwake && !this._isPlaying)
            {
                this.play();
            }
            this._awaked = true;
        }

        // 计算公告牌矩阵
        // 阶段 C-e：`Matrix3x3` / `Matrix4x4` 的 class 已删除，改成「纯数据字面量 + 纯函数」
        const isbillboard = isParticleBillboard(this.geometry, this.shape.alignToDirection);
        const billboardMatrix: Matrix3x3 = { __type__: 'Matrix3x3', ...mat3Identity() };
        if (isbillboard)
        {
            // 相机矩阵从 cameraUniforms 获取（ForwardRenderer 在 beforeRender 前注入），
            // 不依赖渲染上下文中的 camera 参数；尚未注入时跳过公告牌计算。
            const cameraMatrix = renderObject.bindingResources?.cameraUniforms?.value?.u_cameraMatrix;
            if (cameraMatrix)
            {
                // 缺省 out 没有 Vector3 的方法，下面 `lookAt` 只读分量、`transformPoint3` 会就地写，
                // 所以显式传 Vector3 实例（与原 `getAxisZ()` 返回实例一致）
                let localCameraForward = { x: 0, y: 0, z: 0 };
                let localCameraUp = { x: 0, y: 0, z: 0 };

                mat4GetAxisZ(cameraMatrix, localCameraForward);
                mat4GetAxisY(cameraMatrix, localCameraUp);
                if (this.main.simulationSpace === ParticleSystemSimulationSpace.Local)
                {
                    mat4TransformPoint3(logic(this._obj()).world2localRotation, localCameraForward, localCameraForward);
                    mat4TransformPoint3(logic(this._obj()).world2localRotation, localCameraUp, localCameraUp);
                }
                const matrix4x4: Matrix4x4 = { __type__: 'Matrix4x4', ...mat4LookAt(mat4Identity(), localCameraForward, localCameraUp) };

                mat3FromMatrix4x4(matrix4x4, billboardMatrix);
            }
        }

        const positions: number[] = [];
        const scales: number[] = [];
        const rotations: number[] = [];
        const colors: number[] = [];
        const tilingOffsets: number[] = [];
        const flipUVs: number[] = [];
        for (let i = 0, n = this._activeParticles.length; i < n; i++)
        {
            const particle = this._activeParticles[i];
            positions.push(particle.position.x, particle.position.y, particle.position.z);
            scales.push(particle.size.x, particle.size.y, particle.size.z);

            rotations.push(particle.rotation.x, particle.rotation.y, particle.rotation.z);
            colors.push(particle.color.r, particle.color.g, particle.color.b, particle.color.a);
            tilingOffsets.push(particle.tilingOffset.x, particle.tilingOffset.y, particle.tilingOffset.z, particle.tilingOffset.w);
            flipUVs.push(particle.flipUV.x, particle.flipUV.y);
        }

        if (isbillboard)
        {
            for (let i = 0, n = rotations.length; i < n; i += 3)
            {
                rotations[i + 2] = -rotations[i + 2];
            }
        }

        //
        this._attributes.a_particle_position.data = new Float32Array(positions);
        this._attributes.a_particle_scale.data = new Float32Array(scales);
        this._attributes.a_particle_rotation.data = new Float32Array(rotations);
        this._attributes.a_particle_color.data = new Float32Array(colors);
        this._attributes.a_particle_tilingOffset.data = new Float32Array(tilingOffsets);
        this._attributes.a_particle_flipUV.data = new Float32Array(flipUVs);

        // 写入粒子系统相关 uniform（renderObject.uniforms 为渲染管线动态附加字段）
        const ro = renderObject as RenderObject & { uniforms: ParticleUniforms };
        ro.uniforms.u_particle_billboardMatrix = billboardMatrix;

        if (this.main.simulationSpace === ParticleSystemSimulationSpace.World)
        {
            ro.uniforms.u_modelMatrix = () => ({ __type__: 'Matrix4x4', ...mat4Identity() });
            ro.uniforms.u_ITModelMatrix = () => ({ __type__: 'Matrix4x4', ...mat4Identity() });
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
     * 属性数据列表（直接使用 webgpu VertexAttribute，data 为 Float32Array）。
     */
    private _attributes: Record<string, VertexAttribute> = {
        a_particle_position: { data: new Float32Array([]), format: 'float32x3', stepMode: 'instance' },
        a_particle_scale: { data: new Float32Array([]), format: 'float32x3', stepMode: 'instance' },
        a_particle_rotation: { data: new Float32Array([]), format: 'float32x3', stepMode: 'instance' },
        a_particle_color: { data: new Float32Array([]), format: 'float32x4', stepMode: 'instance' },
        a_particle_tilingOffset: { data: new Float32Array([]), format: 'float32x4', stepMode: 'instance' },
        a_particle_flipUV: { data: new Float32Array([]), format: 'float32x2', stepMode: 'instance' } };

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
        let emits: { time: number, num: number, position: Vector3Like, emitInfo: ParticleSystemEmitInfo }[] = [];

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
        const emits: { time: number; num: number; position: Vector3Like; emitInfo: ParticleSystemEmitInfo; }[] = [];
        if (this.main.simulationSpace === ParticleSystemSimulationSpace.World)
        {
            if (emitInfo._isRateOverDistance)
            {
                const moveVec = vec3Sub(emitInfo.currentWorldPos, emitInfo.preWorldPos);
                const moveDistance = vec3Length(moveVec);
                const worldPos = emitInfo.currentWorldPos;
                // 本次移动距离
                if (moveDistance > 0)
                {
                    // 移动方向
                    const moveDir = vec3NormalizeThickness(vec3Copy(moveVec), 1, vec3Copy(moveVec));
                    // 剩余移动量
                    let leftRateOverDistance = emitInfo._leftRateOverDistance + moveDistance;
                    // 发射频率
                    const rateOverDistance = this.emission.rateOverDistance.getValue(emitInfo.rateAtDuration);
                    // 发射间隔距离
                    const invRateOverDistance = 1 / rateOverDistance;
                    // 发射间隔位移
                    const invRateOverDistanceVec = vec3ScaleNumber(moveDir, 1 / rateOverDistance);
                    // 上次发射位置
                    const lastRateOverDistance = vec3Add(emitInfo.preWorldPos, vec3ScaleNumber(vec3Negate(moveDir), emitInfo._leftRateOverDistance));

                    while (invRateOverDistance < leftRateOverDistance)
                    {
                        emits.push({
                            position: vec3Sub(vec3Add(lastRateOverDistance, invRateOverDistanceVec, lastRateOverDistance), worldPos),
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

        const emits: { time: number; num: number; position: Vector3Like; emitInfo: ParticleSystemEmitInfo }[] = [];

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
                emits.push({ time: i, num: 1, emitInfo, position: vec3Copy(emitInfo.position) });
            }
            // 处理喷发
            const inCycleStart = startTime - cycleStartTime;
            const inCycleEnd = endTime - cycleStartTime;
            for (let i = 0; i < bursts.length; i++)
            {
                const burst = bursts[i];
                if (burst.isProbability && inCycleStart <= burst.time && burst.time < inCycleEnd)
                {
                    emits.push({ time: cycleStartTime + burst.time, num: burst.count.getValue(rateAtDuration), emitInfo, position: vec3Copy(emitInfo.position) });
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
    private _emitParticles(v: { time: number; num: number; position: Vector3Like; emitInfo: ParticleSystemEmitInfo })
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
                vec3Copy(position, particle.position);
                particle.birthTime = birthTime;
                particle.lifetime = lifetime;
                particle.rateAtLifeTime = rateAtLifeTime;
                //
                particle.birthRateAtDuration = birthRateAtDuration - Math.floor(birthRateAtDuration);
                //
                particle.preTime = emitInfo.currentTime;
                particle.curTime = emitInfo.currentTime;
                particle.prePosition = vec3Copy(position);
                particle.curPosition = vec3Copy(position);

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
                // 回收粒子时清空子发射信息（读取点有真值判断，会重新赋值；类型上保持非空故用 null!）
                particle.subEmitInfo = null!;
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
        if (!this._obj()) return;
        if (this._activeParticles.length === 0) return;

        if (this._main.simulationSpace === ParticleSystemSimulationSpace.Local)
        {
            const world2local = logic(this._obj()).world2local;
            this._activeParticles.forEach((p) =>
            {
                mat4TransformPoint3(world2local, p.position, p.position);
                mat4TransformVector3(world2local, p.velocity, p.velocity);
                mat4TransformVector3(world2local, p.acceleration, p.acceleration);
            });
        }
        else
        {
            const local2world = logic(this._obj()).local2world;
            this._activeParticles.forEach((p) =>
            {
                mat4TransformPoint3(local2world, p.position, p.position);
                mat4TransformVector3(local2world, p.velocity, p.velocity);
                mat4TransformVector3(local2world, p.acceleration, p.acceleration);
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
    addParticlePosition(particle: Particle, position: Vector3Like, space: ParticleSystemSimulationSpace, name?: string)
    {
        if (name !== undefined)
        {
            this.removeParticleVelocity(particle, name);
            particle.cache[name] = { value: vec3Copy(position), space };
        }

        if (space !== this.main.simulationSpace)
        {
            if (space === ParticleSystemSimulationSpace.World)
            {
                mat4TransformPoint3(logic(this._obj()).world2local, position, position);
            }
            else
            {
                mat4TransformPoint3(logic(this._obj()).local2world, position, position);
            }
        }
        //
        vec3Add(particle.position, position, particle.position);
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
                if (space === ParticleSystemSimulationSpace.World)
                {
                    mat4TransformPoint3(logic(this._obj()).world2local, value, value);
                }
                else
                {
                    mat4TransformPoint3(logic(this._obj()).local2world, value, value);
                }
            }
            //
            vec3Sub(particle.position, value, particle.position);
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
    addParticleVelocity(particle: Particle, velocity: Vector3Like, space: ParticleSystemSimulationSpace, name?: string)
    {
        if (name !== undefined)
        {
            this.removeParticleVelocity(particle, name);
            particle.cache[name] = { value: vec3Copy(velocity), space };
        }

        if (space !== this.main.simulationSpace)
        {
            if (space === ParticleSystemSimulationSpace.World)
            {
                mat4TransformVector3(logic(this._obj()).world2local, velocity, velocity);
            }
            else
            {
                mat4TransformVector3(logic(this._obj()).local2world, velocity, velocity);
            }
        }
        //
        vec3Add(particle.velocity, velocity, particle.velocity);
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
                if (space === ParticleSystemSimulationSpace.World)
                {
                    mat4TransformVector3(logic(this._obj()).world2local, value, value);
                }
                else
                {
                    mat4TransformVector3(logic(this._obj()).local2world, value, value);
                }
            }
            //
            vec3Sub(particle.velocity, value, particle.velocity);
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
    addParticleAcceleration(particle: Particle, acceleration: Vector3Like, space: ParticleSystemSimulationSpace, name?: string)
    {
        if (name !== undefined)
        {
            this.removeParticleAcceleration(particle, name);
            particle.cache[name] = { value: vec3Copy(acceleration), space };
        }

        if (space !== this.main.simulationSpace)
        {
            if (space === ParticleSystemSimulationSpace.World)
            {
                mat4TransformVector3(logic(this._obj()).world2local, acceleration, acceleration);
            }
            else
            {
                mat4TransformVector3(logic(this._obj()).local2world, acceleration, acceleration);
            }
        }
        //
        vec3Add(particle.acceleration, acceleration, particle.acceleration);
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
                if (space === ParticleSystemSimulationSpace.World)
                {
                    mat4TransformVector3(logic(this._obj()).world2local, value, value);
                }
                else
                {
                    mat4TransformVector3(logic(this._obj()).local2world, value, value);
                }
            }
            //
            vec3Sub(particle.acceleration, value, particle.acceleration);
        }
    }

    /**
     * 触发子发射器
     *
     * @param subEmitterIndex 子发射器索引
     */
    // 参数可为 null：函数体内有 `particles || this._activeParticles` 兜底，如实放宽以兼容现有调用
    TriggerSubEmitter(subEmitterIndex: number, particles: Particle[] | null = null)
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
            position: WritableVector3Like;
            emitInfo: ParticleSystemEmitInfo;
        }[] = [];

        particles.forEach((particle) =>
        {
            if (Math.random() > probability) return;

            // 粒子所在世界坐标
            // 阶段 C-e：下面要用 `clone()` / 赋给 `Vector3` 字段，所以 out 显式传 Vector3 实例
            const particleWoldPos = { x: 0, y: 0, z: 0 };

            mat4TransformPoint3(logic(this._obj()).local2world, particle.position, particleWoldPos);
            // 粒子在子粒子系统的坐标
            const subEmitPos = { x: 0, y: 0, z: 0 };

            mat4TransformPoint3(logic(subEmitter._obj()).world2local, particleWoldPos, subEmitPos);
            if (!particle.subEmitInfo)
            {
                const startDelay = this.main.startDelay.getValue(Math.random());
                particle.subEmitInfo = {
                    preTime: particle.preTime - particle.birthTime - startDelay,
                    currentTime: particle.preTime - particle.birthTime - startDelay,
                    preWorldPos: vec3Copy(particleWoldPos),
                    currentWorldPos: vec3Copy(particleWoldPos),
                    rateAtDuration: 0,
                    _leftRateOverDistance: 0,
                    _isRateOverDistance: false,
                    startDelay,
                    moveVec: { x: 0, y: 0, z: 0 },
                    speed: { x: 0, y: 0, z: 0 },
                    position: subEmitPos };
            }
            else
            {
                particle.subEmitInfo.preTime = particle.preTime - particle.birthTime - particle.subEmitInfo.startDelay;
                particle.subEmitInfo.currentTime = particle.curTime - particle.birthTime - particle.subEmitInfo.startDelay;

                vec3Copy(subEmitPos, particle.subEmitInfo.position);
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
     * 上次世界坐标
     */
    preWorldPos: WritableVector3Like;

    /**
     * 当前世界坐标
     */
    currentWorldPos: WritableVector3Like;

    /**
     * 发射器本地位置
     */
    position: WritableVector3Like;

    /**
     * Start delay in seconds.
     * 启动延迟(以秒为单位)。在调用.play()时初始化值。
     */
    startDelay: number;

    /**
     * 此次位移
     */
    moveVec: WritableVector3Like;

    /**
     * 当前移动速度
     */
    speed: WritableVector3Like;

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


/** ParticleSystem Logic 接口：复用 RenderableLogic，覆写 beforeRender 为 ParticleSystem 自身逻辑 */
interface ParticleSystemLogic extends RenderableLogic
{
}

/** 工厂函数：ParticleSystem Logic 的唯一创建入口 */
export function particleSystemLogic(data: ParticleSystem): ParticleSystemLogic
{
    const { members } = createRenderableLogicBase(data);

    const logic: ParticleSystemLogic = {
        /** 关联的组件数据（raw） */
        get component() { return members.component; },
        /** 所属 Object3D（覆写基类 getter，把 entity 收窄为 Object3D） */
        get entity() { return members.entity; },
        /** 是否可见且启用 */
        get isVisibleAndEnabled() { return members.isVisibleAndEnabled; },
        /** 光源拾取器（init 时创建，持有引用防止被 GC） */
        get lightPicker() { return members.lightPicker; },
        /** 渲染对象（computed，依赖 transform 与组件） */
        get renderObject() { return members.renderObject; },
        /** 自身局部包围盒 */
        get selfLocalBounds() { return members.selfLocalBounds; },
        /** 自身世界包围盒 */
        get selfWorldBounds() { return members.selfWorldBounds; },
        /** 是否加载完成（材质异步资源就绪） */
        get isLoaded() { return members.isLoaded; },
        /** 基类 beforeRender（子类 logic 可调用后再追加自身逻辑） */
        baseBeforeRender(renderObject) { members.baseBeforeRender(renderObject); },
        /** 渲染前回调：委托 ParticleSystem 自身逻辑 */
        beforeRender(ro)
        {
            (members.component as ParticleSystem).beforeRender(ro);
        },
        /** 初始化：注入所属 Object3D（幂等），并创建光源拾取器 */
        init(object3D) { members.init(object3D); },
        /** 每帧更新（委托 Behaviour 基类） */
        update(interval) { members.update(interval); },
        /** 与局部空间射线相交 */
        localRayIntersection(localRay) { return members.localRayIntersection(localRay); },
        /** 与世界空间射线相交 */
        worldRayIntersection(worldRay) { return members.worldRayIntersection(worldRay); },
        /** 释放 */
        dispose() { members.dispose(); },
    };

    return logic;
}
registerLogic('ParticleSystem', particleSystemLogic);

