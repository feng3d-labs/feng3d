// registerLogic/logic 直接从 @feng3d/reactivity 导入（不经 feng3d barrel）：
// feng3d barrel 在 particlesystem 之后才 re-export reactivity，node/vitest 下
// barrel 模块求值顺序会取到未初始化的绑定（浏览器/vite 不受影响）
import { AddComponentMenu, createRenderableLogicBase, Object3D, ParticleMaterial, QuadGeometry, registerComponentType, Renderable, RenderableLogic, RunEnvironment } from 'feng3d';
import { logic, logic as getLogic, reactive, registerLogic, UnReadonly } from '@feng3d/reactivity';
import { Buffer, BufferBinding, BindingResources, IDraw, RenderObject, VertexAttribute, VertexAttributes } from '@feng3d/webgpu';
import { mat3FromMatrix4x4, mat3Identity, mat4GetAxisY, mat4GetAxisZ, mat4Identity, mat4LookAt, mat4TransformPoint3, mat4TransformVector3, Matrix3x3, Matrix4x4, vec3Add, vec3Copy, vec3DivideNumber, vec3Length, vec3Negate, vec3NormalizeThickness, vec3ScaleNumber, vec3Sub, Vector3, Vector3Like, WritableVector3Like, minMaxCurveGetValue } from '@feng3d/math';

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
 * 粒子系统写入 renderObject.bindingResources.particle_uniforms 的 uniform 值。
 *
 * 与着色器里的 ParticleUniforms 结构一一对应（见 feng3d 的 shaders/particleMaterial.ts）。
 */
interface ParticleSystemUniforms
{
    /** 公告牌矩阵（把粒子面片朝向相机） */
    u_particle_billboardMatrix: Matrix3x3;
    /** 模型矩阵（World 模拟空间时为单位矩阵——粒子位置已是世界坐标；Local 时为宿主 local2world） */
    u_modelMatrix: Matrix4x4;
}

declare module '@feng3d/webgpu'
{
    interface BindingResources
    {
        /** 粒子系统 per renderObject uniform（公告牌 / 模型矩阵） */
        particle_uniforms?: BufferBinding;
    }
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
        // 未挂载时读它仍然与原来一样会崩，故用断言而不放宽带宽返回类型（否则调用点连锁报错）。
        //
        // 优先用 logic.init 注入的宿主：过渡期里 logic 由**字面量**创建、行为落在实例上，
        // 此时 logic(this) 会按实例再取一份 logic（宿主 components 已被替换为实例），
        // 那份 logic 的 entity 未注入；直接读注入值可避开这层歧义。
        return (this._owner ?? logic(this).entity)!;
    }

    /**
     * 宿主 Object3D（由 particleSystemLogic.init 注入）。
     */
    _owner: Object3D | null = null;

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
    material = { __type__: 'ParticleMaterial' } as unknown as ParticleMaterial;

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

        // 每帧递增响应式版本：粒子的模拟状态（位置 / 寿命 / 活跃数）不在响应式系统里，
        // ForwardRenderer.draw 与 Renderable.renderObject 这些 computed 不会被它们失效，
        // 于是渲染只会停在第 0 帧。这个版本号被 _syncRenderData 读取而成为渲染 computed 的
        // 依赖，使粒子每帧重新求值并把最新实例数据写入 renderObject。
        //
        // 只在播放中递增：未播放的粒子不该让整条渲染链每帧重算。首帧的 playOnAwake 不依赖
        // 这里——组件已登记为 Renderable，渲染 computed 的首次求值就会调到 beforeRender。
        const frame = this._frame;
        reactive(frame).version = frame.version + 1;

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

        const startDelay = minMaxCurveGetValue(this.main.startDelay, Math.random());

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
        // 基类分发（transform / 同宿主其它组件）由 particleSystemLogic.beforeRender 负责：
        // class 侧再调一次会在过渡期形成「字面量 logic → 实例 → 字面量 logic」的回环。
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

        this._syncRenderData(renderObject, billboardMatrix, isbillboard);
    }

    /**
     * 把当前活跃粒子写入渲染对象：交错实例属性 + 实例数 + 粒子 uniform（公告牌 / 模型矩阵）。
     *
     * 每帧由 ForwardRenderer 调用（renderObject computed 重算时也会调用，写入幂等）。
     * 实例缓冲容量固定为 `main.maxParticles`，每帧原地写入后用 `Buffer.writeBuffers` 增量上传
     * （复用同一 ArrayBuffer，不每帧新建 GPU 缓冲）。
     *
     * @param renderObject 渲染对象（几何体已写入 vertices / indices / draw）
     * @param billboardMatrix 公告牌矩阵（非公告牌模式为单位矩阵）
     * @param isbillboard 是否公告牌模式（公告牌下绕 z 旋转取反，与原先 CPU 侧处理等价）
     */
    private _syncRenderData(renderObject: RenderObject, billboardMatrix: Matrix3x3, isbillboard: boolean): void
    {
        // 建立对帧版本的响应式依赖（让渲染 computed 每帧失效），并去掉同一帧内的重复调用
        const frame = this._frame;
        const frameVersion = reactive(frame).version;

        if (this._uploadedFrameVersion === frameVersion) return;

        this._uploadedFrameVersion = frameVersion;

        const particles = this._activeParticles;
        const count = particles.length;
        // 容量至少为 1：0 容量的 Float32Array 无法作为顶点缓冲（且引擎会按 0 推断顶点数）
        const capacity = Math.max(1, this.main.maxParticles | 0);

        this._ensureParticleBuffer(capacity);

        const data = this._particleData!;
        const stride = PARTICLE_STRIDE_FLOATS;

        // 原地写入前 count 个实例（不新建 TypedArray，避免每帧重建 GPU 缓冲与顶点布局）
        for (let i = 0; i < count; i++)
        {
            const particle = particles[i];
            const offset = i * stride;

            const position = particle.position;
            data[offset] = position.x;
            data[offset + 1] = position.y;
            data[offset + 2] = position.z;

            const size = particle.size;
            data[offset + 3] = size.x;
            data[offset + 4] = size.y;
            data[offset + 5] = size.z;

            const rotation = particle.rotation;
            data[offset + 6] = rotation.x;
            data[offset + 7] = rotation.y;
            data[offset + 8] = isbillboard ? -rotation.z : rotation.z;

            const color = particle.color;
            data[offset + 9] = color.r;
            data[offset + 10] = color.g;
            data[offset + 11] = color.b;
            data[offset + 12] = color.a;

            const tilingOffset = particle.tilingOffset;
            data[offset + 13] = tilingOffset.x;
            data[offset + 14] = tilingOffset.y;
            data[offset + 15] = tilingOffset.z;
            data[offset + 16] = tilingOffset.w;

            const flipUV = particle.flipUV;
            data[offset + 17] = flipUV.x;
            data[offset + 18] = flipUV.y;
        }

        // 增量上传：Buffer 按 ArrayBuffer 身份缓存，同一缓冲只提交本帧前 count 个实例的区间
        if (count > 0)
        {
            const buffer = Buffer.getBuffer(data.buffer);

            reactive(buffer).writeBuffers = [{ data: data.subarray(0, count * stride) }];
        }

        const r_renderObject = reactive(renderObject) as UnReadonly<RenderObject>;
        const ro = renderObject as { vertices?: VertexAttributes; draw?: IDraw };

        // 顶点属性：几何体属性 + 粒子实例属性（稳定引用；几何体属性表未换时复用合并结果）
        const geometryVertices = ro.vertices ?? {};

        if (!this._renderVertices || this._renderVerticesSource !== geometryVertices)
        {
            this._renderVerticesSource = geometryVertices;
            this._renderVertices = { ...geometryVertices, ...this._particleAttributes! };
        }
        r_renderObject.vertices = this._renderVertices;

        // 实例数：几何体 draw 暴露的是自身（instanceCount 恒为 1），这里覆盖为活跃粒子数。
        // 没有活跃粒子时把 draw 清空（而不是画 instanceCount=0）——后者会被 WebGPU 判为
        // "Draw with an instance count of 0 is unusual"，且白白走一次 draw 调用。
        const draw = ro.draw;

        if (draw)
        {
            r_renderObject.draw = count > 0 ? ({ ...draw, instanceCount: count } as IDraw) : undefined;
        }

        // 粒子 uniform：公告牌矩阵（per renderObject）+ 模型矩阵
        const bindingResources = renderObject.bindingResources as BindingResources | undefined;

        if (bindingResources)
        {
            if (!bindingResources.particle_uniforms)
            {
                reactive(bindingResources).particle_uniforms = { value: undefined } as BufferBinding;
            }

            const binding = bindingResources.particle_uniforms as BufferBinding<ParticleSystemUniforms>;
            const u_modelMatrix: Matrix4x4 = this.main.simulationSpace === ParticleSystemSimulationSpace.World
                ? { __type__: 'Matrix4x4', ...mat4Identity() }
                : logic(this._obj()).local2world;

            reactive(binding).value = {
                u_particle_billboardMatrix: billboardMatrix,
                u_modelMatrix,
            };
        }
    }

    /**
     * 保证交错实例缓冲容量足够（容量变化时重建缓冲与属性表）。
     *
     * @param capacity 实例容量（粒子数）
     */
    private _ensureParticleBuffer(capacity: number): void
    {
        if (this._particleData && this._particleCapacity === capacity) return;

        this._particleCapacity = capacity;
        this._particleData = new Float32Array(capacity * PARTICLE_STRIDE_FLOATS);
        this._particleAttributes = createParticleAttributes(this._particleData);
        // 属性对象已换新，强制重建合并后的顶点属性表；并允许同帧重新写入数据
        this._renderVertices = null;
        this._renderVerticesSource = null;
        this._uploadedFrameVersion = -1;
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
     * 每帧递增的渲染版本（响应式）：驱动渲染 computed 每帧重算（见 update 注释）。
     */
    private _frame = { version: 0 };

    /**
     * 已写入 renderObject 的帧版本（同一帧内 computed 与 ForwardRenderer 各调一次 beforeRender 时去重）。
     */
    private _uploadedFrameVersion = -1;

    /**
     * 交错实例缓冲（容量 = 粒子容量 × PARTICLE_STRIDE_FLOATS），每帧原地写入前 N 个实例。
     */
    private _particleData: Float32Array | null = null;

    /**
     * 粒子实例属性表（6 个属性共享同一交错缓冲，稳定引用）。
     */
    private _particleAttributes: Record<string, VertexAttribute> | null = null;

    /**
     * 当前实例缓冲容量（粒子数）。
     */
    private _particleCapacity = -1;

    /**
     * 合并后的顶点属性表（几何体属性 + 粒子实例属性，稳定引用）。
     */
    private _renderVertices: VertexAttributes | null = null;

    /**
     * 合并表的几何体来源（引用比较；几何体属性表变化时重建合并表）。
     */
    private _renderVerticesSource: VertexAttributes | null = null;

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
                    const rateOverDistance = minMaxCurveGetValue(this.emission.rateOverDistance, emitInfo.rateAtDuration);
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

        const step = 1 / minMaxCurveGetValue(this.emission.rateOverTime, rateAtDuration);
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
                    emits.push({ time: cycleStartTime + burst.time, num: minMaxCurveGetValue(burst.count, rateAtDuration), emitInfo, position: vec3Copy(emitInfo.position) });
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
            const lifetime = minMaxCurveGetValue(this.main.startLifetime, emitInfo.rateAtDuration);
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
                const startDelay = minMaxCurveGetValue(this.main.startDelay, Math.random());
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
 * 粒子实例属性交错缓冲的浮点步长。
 *
 * 布局（与粒子着色器的 location 4–9 一一对应）：
 * position(3) + scale(3) + rotation(3) + color(4) + tilingOffset(4) + flipUV(2)。
 */
const PARTICLE_STRIDE_FLOATS = 19;

/**
 * 创建粒子实例属性表。
 *
 * 6 个属性共享**同一个** TypedArray 对象：引擎的 WGPUVertexBufferLayout 按"属性数据对象"分组建
 * 顶点缓冲，共享对象只占 1 个 maxVertexBuffers 名额（WebGPU 默认上限 8），靠 offset / arrayStride 区分。
 *
 * @param data 交错实例缓冲
 * @returns 粒子实例属性表
 */
function createParticleAttributes(data: Float32Array): Record<string, VertexAttribute>
{
    const stride = PARTICLE_STRIDE_FLOATS * 4;

    return {
        a_particle_position: { data, format: 'float32x3', offset: 0, arrayStride: stride, stepMode: 'instance' },
        a_particle_scale: { data, format: 'float32x3', offset: 3 * 4, arrayStride: stride, stepMode: 'instance' },
        a_particle_rotation: { data, format: 'float32x3', offset: 6 * 4, arrayStride: stride, stepMode: 'instance' },
        a_particle_color: { data, format: 'float32x4', offset: 9 * 4, arrayStride: stride, stepMode: 'instance' },
        a_particle_tilingOffset: { data, format: 'float32x4', offset: 13 * 4, arrayStride: stride, stepMode: 'instance' },
        a_particle_flipUV: { data, format: 'float32x2', offset: 17 * 4, arrayStride: stride, stepMode: 'instance' },
    };
}

/**
 * 把「纯数据字面量」提升为 ParticleSystem 实例（过渡期兼容层）。
 *
 * 已经是实例时原样返回；否则基于默认实例把字面量字段**递归合并**进去：目标是保留 class 上的
 * 行为与各模块默认值（构造函数建立模块与 particleSystem 的反向引用），只覆盖调用方显式声明的字段。
 *
 * 背景：场景数据按规范 §2 用纯数据字面量声明，而 ParticleSystem 目前仍是 class（纯数据化欠账，
 * 见 issue）。合并规则对"默认值是 class 实例"的字段（MinMaxCurve / AnimationCurve / 各模块）
 * 递归合并到实例上，从而保住它们的 getValue / initParticleState 等方法。
 *
 * @param data 组件数据（实例或字面量）
 * @returns 可用的 ParticleSystem 实例
 */
function instantiateParticleSystem(data: ParticleSystem): ParticleSystem
{
    if (data instanceof ParticleSystem) return data;

    const system = new ParticleSystem();

    mergeObjectInto(system as unknown as Record<string, unknown>, data as unknown as Record<string, unknown>);

    return system;
}

/**
 * 递归合并 source 的字段到 target：目标上已是 class 实例的对象走递归，保住其方法；
 * 其余（标量 / 数组 / 纯对象）整体替换。
 *
 * @param target 合并目标（默认实例）
 * @param source 合并来源（字面量）
 */
function mergeObjectInto(target: Record<string, unknown>, source: Record<string, unknown>): void
{
    for (const key of Object.keys(source))
    {
        const value = source[key];

        if (value === undefined) continue;

        const current = target[key];

        // 目标已有对象（class 实例，或曲线族纯数据化后的纯数据对象）→ 递归合并，保留其默认值；
        // 目标缺失 / 是数组 / 是标量时整体赋值。
        if (current !== null && typeof current === 'object' && !Array.isArray(current)
            && value !== null && typeof value === 'object' && !Array.isArray(value))
        {
            mergeObjectInto(current as Record<string, unknown>, value as Record<string, unknown>);
            continue;
        }

        target[key] = value;
    }
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

/** 工厂函数：ParticleSystem Logic 的唯一创建入口（字面量与实例两种输入都接受） */
export function particleSystemLogic(data: ParticleSystem): ParticleSystemLogic
{
    // 过渡期兼容层：场景数据是纯数据声明，而 ParticleSystem 仍是 class。
    // 这里把字面量提升为实例（行为、模块默认值都在实例上），随后把宿主 components 里的
    // 字面量替换成实例——必须替换，否则基类的「跳过自身」判断（element !== state.component）
    // 认不出同一个组件，组件分发会形成回环。
    const system = instantiateParticleSystem(data);
    const { members } = createRenderableLogicBase(system);

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
        /** 渲染前回调：先做基类分发（transform / 同宿主其它组件），再执行粒子自身逻辑 */
        beforeRender(ro)
        {
            members.baseBeforeRender(ro);
            system.beforeRender(ro);
        },
        /**
         * 初始化：注入所属 Object3D（幂等），创建光源拾取器，并把宿主 components 里的
         * 原始字面量替换为实例（保证同一组件只有一个对象身份）。
         */
        init(object3D)
        {
            members.init(object3D);

            const owner = (object3D ?? members.entity) as Object3D | null;

            system._owner = owner;

            const components = owner?.components;

            if (components && data !== system)
            {
                const index = components.indexOf(data as never);

                if (index >= 0)
                {
                    (reactive(components) as unknown[]).splice(index, 1, system);

                    // effect 的重跑不保证同步，而宿主接下来的渲染 / 拾取都按新身份（system）
                    // 取 logic——这里显式把实例的 logic 初始化一次，否则它拿不到 entity。
                    // 注意用 getLogic 别名：本工厂的返回值就叫 logic（局部变量遮蔽了同名函数）。
                    getLogic(system).init(owner);
                }
            }
        },
        /**
         * 每帧更新。
         *
         * 模拟逻辑在 ParticleSystem 实例上（发射 / 生命周期 / 各模块），这里必须转发过去——
         * 委托 Behaviour 基座的空实现会让粒子永不发射（SceneLogic 只调 logic 的 update）。
         */
        update(interval) { system.update(interval); },
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

// 登记组件类型：ScenePickCache 用 isRenderable（内置表 {Renderable, MeshRenderer,
// SkinnedMeshRenderer} + 登记表）筛选渲染列表，未登记的上层包组件只会命中 matchType 的
// 拾取列表、进不了渲染列表——表现是"粒子永远不渲染"。
registerComponentType('ParticleSystem', { baseTypes: ['Renderable'] });

