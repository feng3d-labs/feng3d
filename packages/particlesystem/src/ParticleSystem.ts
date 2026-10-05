// registerLogic/logic 直接从 @feng3d/reactivity 导入（不经 feng3d barrel）：
// feng3d barrel 在 particlesystem 之后才 re-export reactivity，node/vitest 下
// barrel 模块求值顺序会取到未初始化的绑定（浏览器/vite 不受影响）
import { createRenderableLogicBase, Object3D, ParticleMaterial, QuadGeometry, registerComponentType, Renderable, RenderableLogic, RunEnvironment } from 'feng3d';
import { logic as getLogic, reactive, registerLogic, UnReadonly } from '@feng3d/reactivity';
import { serialization } from '@feng3d/serialization';
import { Buffer, BufferBinding, BindingResources, IDraw, RenderObject, VertexAttribute, VertexAttributes } from '@feng3d/webgpu';
import { mat3FromMatrix4x4, mat3Identity, mat4GetAxisY, mat4GetAxisZ, mat4Identity, mat4LookAt, mat4TransformPoint3, mat4TransformVector3, Matrix3x3, Matrix4x4, vec3Add, vec3Copy, vec3DivideNumber, vec3Length, vec3Negate, vec3NormalizeThickness, vec3ScaleNumber, vec3Sub, Vector3, Vector3Like, WritableVector3Like, minMaxCurveGetValue } from '@feng3d/math';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        ParticleSystem: RenderableLogic;
    }
}
import { particleEmissionBurstCalculateProbability } from './others/ParticleEmissionBurst';
import { ParticleSystemSimulationSpace } from './enums/ParticleSystemSimulationSpace';
import { particleColorBySpeedModuleDefault, particleColorBySpeedModuleInitParticleState, particleColorBySpeedModuleUpdateParticleState, type ParticleColorBySpeedModule } from './modules/ParticleColorBySpeedModule';
import { particleColorOverLifetimeModuleDefault, particleColorOverLifetimeModuleInitParticleState, particleColorOverLifetimeModuleUpdateParticleState, type ParticleColorOverLifetimeModule } from './modules/ParticleColorOverLifetimeModule';
import { particleEmissionModuleDefault, type ParticleEmissionModule } from './modules/ParticleEmissionModule';
import { particleForceOverLifetimeModuleDefault, particleForceOverLifetimeModuleInitParticleState, particleForceOverLifetimeModuleUpdateParticleState, type ParticleForceOverLifetimeModule } from './modules/ParticleForceOverLifetimeModule';
import { particleInheritVelocityModuleDefault, particleInheritVelocityModuleInitParticleState, particleInheritVelocityModuleUpdateParticleState, type ParticleInheritVelocityModule } from './modules/ParticleInheritVelocityModule';
import { particleLimitVelocityOverLifetimeModuleDefault, particleLimitVelocityOverLifetimeModuleInitParticleState, particleLimitVelocityOverLifetimeModuleUpdateParticleState, type ParticleLimitVelocityOverLifetimeModule } from './modules/ParticleLimitVelocityOverLifetimeModule';
import { particleMainModuleDefault, particleMainModuleInitParticleState, particleMainModuleUpdateParticleState, type ParticleMainModule } from './modules/ParticleMainModule';
import type { WritableParticleModuleLike } from './modules/ParticleModule';
import { particleNoiseModuleDefault, particleNoiseModuleInitParticleState, particleNoiseModuleUpdate, particleNoiseModuleUpdateParticleState, type ParticleNoiseModule } from './modules/ParticleNoiseModule';
import { particleRotationBySpeedModuleDefault, particleRotationBySpeedModuleInitParticleState, particleRotationBySpeedModuleUpdateParticleState, type ParticleRotationBySpeedModule } from './modules/ParticleRotationBySpeedModule';
import { particleRotationOverLifetimeModuleDefault, particleRotationOverLifetimeModuleInitParticleState, particleRotationOverLifetimeModuleUpdateParticleState, type ParticleRotationOverLifetimeModule } from './modules/ParticleRotationOverLifetimeModule';
import { particleShapeModuleDefault, particleShapeModuleInitParticleState, type ParticleShapeModule } from './modules/ParticleShapeModule';
import { particleSizeBySpeedModuleDefault, particleSizeBySpeedModuleInitParticleState, particleSizeBySpeedModuleUpdateParticleState, type ParticleSizeBySpeedModule } from './modules/ParticleSizeBySpeedModule';
import { particleSizeOverLifetimeModuleDefault, particleSizeOverLifetimeModuleInitParticleState, particleSizeOverLifetimeModuleUpdateParticleState, type ParticleSizeOverLifetimeModule } from './modules/ParticleSizeOverLifetimeModule';
import { particleSubEmittersModuleDefault, particleSubEmittersModuleGetSubEmitterEmitProbability, particleSubEmittersModuleGetSubEmitterProperties, particleSubEmittersModuleGetSubEmitterSystem, particleSubEmittersModuleGetSubEmitterType, particleSubEmittersModuleUpdateParticleState, type ParticleSubEmittersModule } from './modules/ParticleSubEmittersModule';
import { particleTextureSheetAnimationModuleDefault, particleTextureSheetAnimationModuleInitParticleState, particleTextureSheetAnimationModuleUpdateParticleState, type ParticleTextureSheetAnimationModule } from './modules/ParticleTextureSheetAnimationModule';
import { particleVelocityOverLifetimeModuleDefault, particleVelocityOverLifetimeModuleInitParticleState, particleVelocityOverLifetimeModuleUpdateParticleState, type ParticleVelocityOverLifetimeModule } from './modules/ParticleVelocityOverLifetimeModule';
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
 * 粒子系统组件（纯数据接口）。
 *
 * 行为在 {@link particleSystemLogic}（闭包工厂）；本接口只声明数据字段：16 个模块、渲染相关字段，
 * 以及三个**运行时字段**——`object3D`（宿主，由 logic.init 注入）、`emitInfo`（发射器状态，`play()` 时建立）、
 * `isSubParticleSystem`（作为子发射器时的标记）。
 */
export interface ParticleSystem extends Renderable
{
    readonly __type__: 'ParticleSystem';

    /** 是否启用 */
    readonly enabled: boolean;

    /** 运行环境 */
    readonly runEnvironment: RunEnvironment;

    /** 回放位置（秒） */
    readonly time: number;

    // ---- 16 个模块 ----

    /** 主模块 */
    readonly main: ParticleMainModule;

    /** 发射模块 */
    readonly emission: ParticleEmissionModule;

    /** 形状模块 */
    readonly shape: ParticleShapeModule;

    /** 速度随时间变化模块 */
    readonly velocityOverLifetime: ParticleVelocityOverLifetimeModule;

    /** 限速模块 */
    readonly limitVelocityOverLifetime: ParticleLimitVelocityOverLifetimeModule;

    /** 遗传速度模块 */
    readonly inheritVelocity: ParticleInheritVelocityModule;

    /** 力随时间变化模块 */
    readonly forceOverLifetime: ParticleForceOverLifetimeModule;

    /** 颜色随时间变化模块 */
    readonly colorOverLifetime: ParticleColorOverLifetimeModule;

    /** 颜色随速度变化模块 */
    readonly colorBySpeed: ParticleColorBySpeedModule;

    /** 缩放随时间变化模块 */
    readonly sizeOverLifetime: ParticleSizeOverLifetimeModule;

    /** 缩放随速度变化模块 */
    readonly sizeBySpeed: ParticleSizeBySpeedModule;

    /** 旋转随时间变化模块 */
    readonly rotationOverLifetime: ParticleRotationOverLifetimeModule;

    /** 旋转随速度变化模块 */
    readonly rotationBySpeed: ParticleRotationBySpeedModule;

    /** 噪声模块 */
    readonly noise: ParticleNoiseModule;

    /** 子发射器模块 */
    readonly subEmitters: ParticleSubEmittersModule;

    /** 纹理表动画模块 */
    readonly textureSheetAnimation: ParticleTextureSheetAnimationModule;

    // ---- 渲染相关 ----

    /** 几何体 */
    readonly geometry?: QuadGeometry;

    /** 材质 */
    readonly material?: ParticleMaterial;

    /** 是否投射阴影 */
    readonly castShadows?: boolean;

    /** 是否接收阴影 */
    readonly receiveShadows?: boolean;

    // ---- 运行时字段（不参与序列化）----

    /** 宿主 Object3D（由 logic.init 注入；替代原 class 的 `_owner` / `_obj()`） */
    readonly object3D?: Object3D;

    /** 发射器状态（`play()` 时建立；各模块行为函数会读它） */
    readonly emitInfo?: ParticleSystemEmitInfo;

    /** 是否作为子粒子系统（由 `particleSubEmittersModuleAddSubEmitter` 置位） */
    readonly isSubParticleSystem?: boolean;
}

/**
 * 粒子系统 Logic 接口：复用 RenderableLogic，另加粒子系统自己的公开面。
 *
 * 各模块的行为函数通过 `module.particleSystem` 反向引用调用这里的方法（加粒子加速度 / 速度 / 位置、
 * 触发子发射器）与 `emitInfo` / `object3D` / `main` 等 getter。
 */
export interface ParticleSystemLogic extends RenderableLogic
{
    /** 是否正在播放 */
    readonly isPlaying: boolean;

    /** 是否已停止（未播放且时间为 0） */
    readonly isStopped: boolean;

    /** 是否暂停（未播放但时间不为 0） */
    readonly isPaused: boolean;

    /** 当前粒子数 */
    readonly particleCount: number;

    /** 单实例渲染（粒子由实例属性驱动，恒 true） */
    readonly single: boolean;

    /** 宿主 Object3D */
    readonly object3D: Object3D;

    /** 关联的组件数据（主模块，供各模块行为函数读 `simulationSpace` 等） */
    readonly main: ParticleMainModule;

    /** 发射器状态（`play()` 之前访问会崩，与原 `_emitInfo` 语义一致） */
    readonly emitInfo: ParticleSystemEmitInfo;

    /** 播放 */
    play(): void;

    /** 停止 */
    stop(): void;

    /** 暂停 */
    pause(): void;

    /** 继续 */
    continue(): void;

    /** 按空间加位置 */
    addParticlePosition(particle: Particle, position: Vector3Like, space: ParticleSystemSimulationSpace, name?: string): void;

    /** 撤销上次加的位置 */
    removeParticlePosition(particle: Particle, name: string): void;

    /** 按空间加速度 */
    addParticleVelocity(particle: Particle, velocity: Vector3Like, space: ParticleSystemSimulationSpace, name?: string): void;

    /** 撤销上次加的速度 */
    removeParticleVelocity(particle: Particle, name: string): void;

    /** 按空间加加速度 */
    addParticleAcceleration(particle: Particle, acceleration: Vector3Like, space: ParticleSystemSimulationSpace, name?: string): void;

    /** 撤销上次加的加速度 */
    removeParticleAcceleration(particle: Particle, name: string): void;

    /**
     * 计算一次发射（内部机制；`TriggerSubEmitter` 会对**子发射器**调它）。
     *
     * @param emitInfo 发射器状态
     */
    emitInternal(emitInfo: ParticleSystemEmitInfo): { time: number; num: number; position: Vector3Like; emitInfo: ParticleSystemEmitInfo }[];

    /**
     * 按发射结果生成粒子（内部机制；`TriggerSubEmitter` 会对**子发射器**调它）。
     *
     * @param v 一条发射结果
     */
    emitParticles(v: { time: number; num: number; position: Vector3Like; emitInfo: ParticleSystemEmitInfo }): void;

    /** 触发子发射器 */
    TriggerSubEmitter(subEmitterIndex: number, particles?: Particle[] | null): void;
}

/**
 * 粒子系统组件的**默认数据**（纯数据组件的标准入口）。
 *
 * 16 个模块都按各自的 `*Default()` 建立（主模块 / 发射 / 形状默认开启），
 * 渲染字段与原来 class 的字段初始值一致。
 */
export function particleSystemDefault(): ParticleSystem
{
    return {
        __type__: 'ParticleSystem',
        enabled: true,
        runEnvironment: RunEnvironment.all,
        time: 0,
        main: { __type__: 'ParticleMainModule', ...particleMainModuleDefault() },
        emission: { __type__: 'ParticleEmissionModule', ...particleEmissionModuleDefault() },
        shape: { __type__: 'ParticleShapeModule', ...particleShapeModuleDefault() },
        velocityOverLifetime: { __type__: 'ParticleVelocityOverLifetimeModule', ...particleVelocityOverLifetimeModuleDefault() },
        limitVelocityOverLifetime: { __type__: 'ParticleLimitVelocityOverLifetimeModule', ...particleLimitVelocityOverLifetimeModuleDefault() },
        inheritVelocity: { __type__: 'ParticleInheritVelocityModule', ...particleInheritVelocityModuleDefault() },
        forceOverLifetime: { __type__: 'ParticleForceOverLifetimeModule', ...particleForceOverLifetimeModuleDefault() },
        colorOverLifetime: { __type__: 'ParticleColorOverLifetimeModule', ...particleColorOverLifetimeModuleDefault() },
        colorBySpeed: { __type__: 'ParticleColorBySpeedModule', ...particleColorBySpeedModuleDefault() },
        sizeOverLifetime: { __type__: 'ParticleSizeOverLifetimeModule', ...particleSizeOverLifetimeModuleDefault() },
        sizeBySpeed: { __type__: 'ParticleSizeBySpeedModule', ...particleSizeBySpeedModuleDefault() },
        rotationOverLifetime: { __type__: 'ParticleRotationOverLifetimeModule', ...particleRotationOverLifetimeModuleDefault() },
        rotationBySpeed: { __type__: 'ParticleRotationBySpeedModule', ...particleRotationBySpeedModuleDefault() },
        noise: { __type__: 'ParticleNoiseModule', ...particleNoiseModuleDefault() },
        subEmitters: { __type__: 'ParticleSubEmittersModule', ...particleSubEmittersModuleDefault() },
        textureSheetAnimation: { __type__: 'ParticleTextureSheetAnimationModule', ...particleTextureSheetAnimationModuleDefault() },
        geometry: { __type__: 'QuadGeometry' } as unknown as QuadGeometry,
        material: { __type__: 'ParticleMaterial' } as unknown as ParticleMaterial,
        castShadows: true,
        receiveShadows: true,
    };
}

/**
 * 用默认值补全用户数据的缺失字段（递归；原 class 过渡期兼容层 `mergeObjectInto` 的职责，
 * 去 class 后落在 logic 里——纯数据字面量因此仍可省略任意字段）。
 *
 * @param defaults 默认数据（各 `*Default()` 的产物）
 * @param data 用户数据（可为 undefined / 部分字段）
 */
function withDefaults<T>(defaults: T, data: unknown): T
{
    return serialization.setValue(defaults as never, (data ?? {}) as never) as T;
}

/**
 * 造一个空的发射器状态（字段与 `play()` 里建立的形状一致；`psEmitInfo` 因此无需可空断言）。
 */
function createEmptyEmitInfo(): ParticleSystemEmitInfo
{
    return {
        preTime: 0,
        currentTime: 0,
        preWorldPos: { x: 0, y: 0, z: 0 },
        currentWorldPos: { x: 0, y: 0, z: 0 },
        rateAtDuration: 0,
        _leftRateOverDistance: 0,
        _isRateOverDistance: false,
        startDelay: 0,
        moveVec: { x: 0, y: 0, z: 0 },
        speed: { x: 0, y: 0, z: 0 },
        position: { x: 0, y: 0, z: 0 },
    };
}

/**
 * ParticleSystem Logic 的唯一创建入口：闭包持有全部运行时状态（不暴露、不进响应式系统），
 * 行为是闭包函数；数据（16 个模块 / time / geometry / material）从 `data` 读写。
 *
 * @param data 粒子系统组件数据（纯数据字面量）
 */
export function particleSystemLogic(data: ParticleSystem): ParticleSystemLogic
{
    // ---- 运行时状态（闭包；不进响应式系统）----
    let isPlaying = false;
    let awaked = false;
    let particlePool: Particle[] = [];
    const activeParticles: Particle[] = [];
    const frameState = { version: 0 };
    let uploadedFrameVersion = -1;
    let particleData: Float32Array | null = null;
    let particleAttributes: Record<string, VertexAttribute> | null = null;
    let particleCapacity = -1;
    let renderVertices: VertexAttributes | null = null;
    let renderVerticesSource: VertexAttributes | null = null;
    let owner: Object3D | null = null;
    let psEmitInfo: ParticleSystemEmitInfo = createEmptyEmitInfo();
    let lastSimulationSpace: ParticleSystemSimulationSpace;

    // 模拟空间变化时重置粒子状态（替代原 class 的 watcher 监听）

    /** 数据侧的可写视图（纯数据接口字段只读，这里集中做写侧断言） */
    const w_data = data as UnReadonly<ParticleSystem>;

    // ---- 缺省字段补全（纯数据字面量只需写关心的字段，其余用各自默认工厂补齐）----
    w_data.main = withDefaults({ __type__: 'ParticleMainModule', ...particleMainModuleDefault() }, data.main);
    w_data.emission = withDefaults({ __type__: 'ParticleEmissionModule', ...particleEmissionModuleDefault() }, data.emission);
    w_data.shape = withDefaults({ __type__: 'ParticleShapeModule', ...particleShapeModuleDefault() }, data.shape);
    w_data.velocityOverLifetime = withDefaults({ __type__: 'ParticleVelocityOverLifetimeModule', ...particleVelocityOverLifetimeModuleDefault() }, data.velocityOverLifetime);
    w_data.limitVelocityOverLifetime = withDefaults({ __type__: 'ParticleLimitVelocityOverLifetimeModule', ...particleLimitVelocityOverLifetimeModuleDefault() }, data.limitVelocityOverLifetime);
    w_data.inheritVelocity = withDefaults({ __type__: 'ParticleInheritVelocityModule', ...particleInheritVelocityModuleDefault() }, data.inheritVelocity);
    w_data.forceOverLifetime = withDefaults({ __type__: 'ParticleForceOverLifetimeModule', ...particleForceOverLifetimeModuleDefault() }, data.forceOverLifetime);
    w_data.colorOverLifetime = withDefaults({ __type__: 'ParticleColorOverLifetimeModule', ...particleColorOverLifetimeModuleDefault() }, data.colorOverLifetime);
    w_data.colorBySpeed = withDefaults({ __type__: 'ParticleColorBySpeedModule', ...particleColorBySpeedModuleDefault() }, data.colorBySpeed);
    w_data.sizeOverLifetime = withDefaults({ __type__: 'ParticleSizeOverLifetimeModule', ...particleSizeOverLifetimeModuleDefault() }, data.sizeOverLifetime);
    w_data.sizeBySpeed = withDefaults({ __type__: 'ParticleSizeBySpeedModule', ...particleSizeBySpeedModuleDefault() }, data.sizeBySpeed);
    w_data.rotationOverLifetime = withDefaults({ __type__: 'ParticleRotationOverLifetimeModule', ...particleRotationOverLifetimeModuleDefault() }, data.rotationOverLifetime);
    w_data.rotationBySpeed = withDefaults({ __type__: 'ParticleRotationBySpeedModule', ...particleRotationBySpeedModuleDefault() }, data.rotationBySpeed);
    w_data.noise = withDefaults({ __type__: 'ParticleNoiseModule', ...particleNoiseModuleDefault() }, data.noise);
    w_data.subEmitters = withDefaults({ __type__: 'ParticleSubEmittersModule', ...particleSubEmittersModuleDefault() }, data.subEmitters);
    w_data.textureSheetAnimation = withDefaults({ __type__: 'ParticleTextureSheetAnimationModule', ...particleTextureSheetAnimationModuleDefault() }, data.textureSheetAnimation);
    w_data.geometry ??= { __type__: 'QuadGeometry' } as unknown as QuadGeometry;
    w_data.material ??= { __type__: 'ParticleMaterial' } as unknown as ParticleMaterial;
    w_data.castShadows ??= true;
    w_data.receiveShadows ??= true;

    lastSimulationSpace = w_data.main!.simulationSpace;

    /** 是否已停止（未播放且时间为 0） */
    function isStopped(): boolean { return !isPlaying && w_data.time === 0; }

    /** 是否暂停（未播放但时间不为 0） */
    function isPaused(): boolean { return !isPlaying && w_data.time !== 0; }

    /** 宿主 Object3D（与原 `_obj()` 一致：优先用 init 注入的值） */
    function object3D(): Object3D { return (owner ?? getLogic(data).entity)!; }

    /**
     * 停止
     */
    function stopInternal()
    {
        isPlaying = false;
        w_data.time = 0;

        particlePool = particlePool.concat(activeParticles);
        activeParticles.length = 0;
    }

    /**
     * 播放
     */
    function playInternal()
    {
        isPlaying = true;
        w_data.time = 0;

        particlePool = particlePool.concat(activeParticles);
        activeParticles.length = 0;

        const startDelay = minMaxCurveGetValue(w_data.main!.startDelay, Math.random());

        psEmitInfo
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
        w_data.emission!.bursts.forEach((element) =>
        {
            particleEmissionBurstCalculateProbability(element);
        });
    }

    /**
     * 暂停
     */
    function pauseInternal()
    {
        isPlaying = false;
    }

    /**
     * 继续
     */
    function continueInternal()
    {
        if (w_data.time === 0)
        {
            playInternal();
        }
        else
        {
            isPlaying = true;
            psEmitInfo.preTime = Math.max(0, psEmitInfo.currentTime);
        }
    }

    function updateInternal(interval: number)
    {
        if (!isPlaying) return;

        // 模拟空间变化 → 重置粒子状态（原来由 watcher 触发）
        if (lastSimulationSpace !== w_data.main!.simulationSpace)
        {
            lastSimulationSpace = w_data.main!.simulationSpace;
            simulationSpaceChanged();
        }

        // 每帧递增响应式版本：粒子的模拟状态（位置 / 寿命 / 活跃数）不在响应式系统里，
        // ForwardRenderer.draw 与 Renderable.renderObject 这些 computed 不会被它们失效，
        // 于是渲染只会停在第 0 帧。这个版本号被 _syncRenderData 读取而成为渲染 computed 的
        // 依赖，使粒子每帧重新求值并把最新实例数据写入 renderObject。
        //
        // 只在播放中递增：未播放的粒子不该让整条渲染链每帧重算。首帧的 playOnAwake 不依赖
        // 这里——组件已登记为 Renderable，渲染 computed 的首次求值就会调到 beforeRender。
        const frame = frameState;
        reactive(frame).version = frame.version + 1;

        const deltaTime = w_data.main!.simulationSpeed * interval / 1000;
        w_data.time = w_data.time + deltaTime;

        const emitInfo = psEmitInfo;

        emitInfo.preTime = emitInfo.currentTime;
        emitInfo.currentTime = w_data.time - emitInfo.startDelay;
        vec3Copy(emitInfo.currentWorldPos, emitInfo.preWorldPos);

        // 粒子系统位置
        vec3Copy(getLogic(object3D()).worldPosition, emitInfo.currentWorldPos);

        // 粒子系统位移
        vec3Sub(emitInfo.currentWorldPos, emitInfo.preWorldPos, emitInfo.moveVec);
        // 粒子系统速度
        vec3DivideNumber(emitInfo.moveVec, deltaTime, emitInfo.speed);

        particleNoiseModuleUpdate(w_data.noise!, deltaTime);

        updateActiveParticlesState(deltaTime);

        // 完成一个循环
        if (w_data.main!.loop && Math.floor(emitInfo.preTime / w_data.main!.duration) < Math.floor(emitInfo.currentTime / w_data.main!.duration))
        {
            // 重新计算喷发概率
            w_data.emission!.bursts.forEach((element) =>
            {
                particleEmissionBurstCalculateProbability(element);
            });
            
        }

        // 发射粒子
        if (!w_data.isSubParticleSystem) // 子粒子系统自身不会自动发射粒子
        {
            const emits = emitInternal(emitInfo);

            emits.sort((a, b) => a.time - b.time);
            emits.forEach((v) =>
            {
                emitParticles(v);
            });
        }

        // 判断非循环的效果是否播放结束
        if (!w_data.main!.loop && activeParticles.length === 0 && emitInfo.currentTime > w_data.main!.duration)
        {
            stopInternal();
            
        }
    }

    function beforeRenderInternal(renderObject: RenderObject)
    {
        // 基类分发（transform / 同宿主其它组件）由 particleSystemLogic.beforeRender 负责：
        // class 侧再调一次会在过渡期形成「字面量 logic → 实例 → 字面量 logic」的回环。
        if (!awaked)
        {
            if (w_data.main!.playOnAwake && !isPlaying)
            {
                playInternal();
            }
            awaked = true;
        }

        // 计算公告牌矩阵
        // 阶段 C-e：`Matrix3x3` / `Matrix4x4` 的 class 已删除，改成「纯数据字面量 + 纯函数」
        const isbillboard = isParticleBillboard(w_data.geometry!, w_data.shape!.alignToDirection);
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
                if (w_data.main!.simulationSpace === ParticleSystemSimulationSpace.Local)
                {
                    mat4TransformPoint3(getLogic(object3D()).world2localRotation, localCameraForward, localCameraForward);
                    mat4TransformPoint3(getLogic(object3D()).world2localRotation, localCameraUp, localCameraUp);
                }
                const matrix4x4: Matrix4x4 = { __type__: 'Matrix4x4', ...mat4LookAt(mat4Identity(), localCameraForward, localCameraUp) };

                mat3FromMatrix4x4(matrix4x4, billboardMatrix);
            }
        }

        syncRenderData(renderObject, billboardMatrix, isbillboard);
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
    function syncRenderData(renderObject: RenderObject, billboardMatrix: Matrix3x3, isbillboard: boolean): void
    {
        // 建立对帧版本的响应式依赖（让渲染 computed 每帧失效），并去掉同一帧内的重复调用
        const frame = frameState;
        const frameVersion = reactive(frame).version;

        if (uploadedFrameVersion === frameVersion) return;

        uploadedFrameVersion = frameVersion;

        const particles = activeParticles;
        const count = particles.length;
        // 容量至少为 1：0 容量的 Float32Array 无法作为顶点缓冲（且引擎会按 0 推断顶点数）
        const capacity = Math.max(1, w_data.main!.maxParticles | 0);

        ensureParticleBuffer(capacity);

        const data = particleData!;
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

        if (!renderVertices || renderVerticesSource !== geometryVertices)
        {
            renderVerticesSource = geometryVertices;
            renderVertices = { ...geometryVertices, ...particleAttributes! };
        }
        r_renderObject.vertices = renderVertices;

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
            const u_modelMatrix: Matrix4x4 = w_data.main!.simulationSpace === ParticleSystemSimulationSpace.World
                ? { __type__: 'Matrix4x4', ...mat4Identity() }
                : getLogic(object3D()).local2world;

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
    function ensureParticleBuffer(capacity: number): void
    {
        if (particleData && particleCapacity === capacity) return;

        particleCapacity = capacity;
        particleData = new Float32Array(capacity * PARTICLE_STRIDE_FLOATS);
        particleAttributes = createParticleAttributes(particleData);
        // 属性对象已换新，强制重建合并后的顶点属性表；并允许同帧重新写入数据
        renderVertices = null;
        renderVerticesSource = null;
        uploadedFrameVersion = -1;
    }

    /**
     * 发射粒子
     *
     * @param startTime 发射起始时间
     * @param endTime 发射终止时间
     * @param startPos 发射起始位置
     * @param stopPos 发射终止位置
     */
    function emitInternal(emitInfo: ParticleSystemEmitInfo)
    {
        //
        let emits: { time: number, num: number, position: Vector3Like, emitInfo: ParticleSystemEmitInfo }[] = [];

        const startTime = emitInfo.preTime;
        let endTime = emitInfo.currentTime;

        if (!w_data.emission!.enabled) return emits;

        // 判断是否开始发射
        if (endTime <= 0) return emits;

        const loop = w_data.main!.loop;
        const duration = w_data.main!.duration;

        // 判断是否结束发射
        if (!loop && startTime >= duration) return emits;

        // 计算最后发射时间
        if (!loop) endTime = Math.min(endTime, duration);

        // 计算此处在发射周期的位置
        let rateAtDuration = (endTime % duration) / duration;
        if (rateAtDuration === 0 && endTime >= duration) rateAtDuration = 1;

        emitInfo.rateAtDuration = rateAtDuration;

        // 处理移动发射粒子
        const moveEmits = emitWithMove(emitInfo);
        emits = emits.concat(moveEmits);

        // 单粒子发射周期
        const timeEmits = emitWithTime(emitInfo, duration);
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
    function emitWithMove(emitInfo: ParticleSystemEmitInfo)
    {
        const emits: { time: number; num: number; position: Vector3Like; emitInfo: ParticleSystemEmitInfo; }[] = [];
        if (w_data.main!.simulationSpace === ParticleSystemSimulationSpace.World)
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
                    const rateOverDistance = minMaxCurveGetValue(w_data.emission!.rateOverDistance, emitInfo.rateAtDuration);
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
    function emitWithTime(emitInfo: ParticleSystemEmitInfo, duration: number)
    {
        const rateAtDuration = emitInfo.rateAtDuration;
        const preTime = emitInfo.preTime;
        const currentTime = emitInfo.currentTime;

        const emits: { time: number; num: number; position: Vector3Like; emitInfo: ParticleSystemEmitInfo }[] = [];

        const step = 1 / minMaxCurveGetValue(w_data.emission!.rateOverTime, rateAtDuration);
        const bursts = w_data.emission!.bursts;
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
    function emitParticles(v: { time: number; num: number; position: Vector3Like; emitInfo: ParticleSystemEmitInfo })
    {
        const num = v.num;
        const birthTime = v.time;
        const position = v.position;
        const emitInfo = v.emitInfo;
        for (let i = 0; i < num; i++)
        {
            if (activeParticles.length >= w_data.main!.maxParticles) return;
            const lifetime = minMaxCurveGetValue(w_data.main!.startLifetime, emitInfo.rateAtDuration);
            const birthRateAtDuration = (birthTime - emitInfo.startDelay) / w_data.main!.duration;
            const rateAtLifeTime = (emitInfo.currentTime - birthTime) / lifetime;

            if (rateAtLifeTime < 1)
            {
                const particle = particlePool.pop() || new Particle();
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
                activeParticles.push(particle);
                initParticleStateInternal(particle);
                updateParticleStateInternal(particle, 0);
            }
        }
    }

    /**
     * 更新活跃粒子状态
     */
    function updateActiveParticlesState(deltaTime: number)
    {
        for (let i = activeParticles.length - 1; i >= 0; i--)
        {
            const particle = activeParticles[i];

            particle.rateAtLifeTime = (particle.curTime + deltaTime - particle.birthTime) / particle.lifetime;
            if (particle.rateAtLifeTime < 0 || particle.rateAtLifeTime > 1)
            {
                activeParticles.splice(i, 1);
                particlePool.push(particle);
                // 回收粒子时清空子发射信息（读取点有真值判断，会重新赋值；类型上保持非空故用 null!）
                particle.subEmitInfo = null!;
            }
            else
            {
                updateParticleStateInternal(particle, deltaTime);
            }
        }
    }

    /**
     * 初始化粒子状态
     * @param particle 粒子
     */
    function initParticleStateInternal(particle: Particle)
    {
        particleMainModuleInitParticleState(w_data.main!, particle);

        particleColorOverLifetimeModuleInitParticleState(w_data.colorOverLifetime!, particle);
        particleColorBySpeedModuleInitParticleState(w_data.colorBySpeed!, particle);
        particleInheritVelocityModuleInitParticleState(w_data.inheritVelocity!, particle);
        particleForceOverLifetimeModuleInitParticleState(w_data.forceOverLifetime!, particle);
        particleLimitVelocityOverLifetimeModuleInitParticleState(w_data.limitVelocityOverLifetime!, particle);
        particleSizeOverLifetimeModuleInitParticleState(w_data.sizeOverLifetime!, particle);
        particleSizeBySpeedModuleInitParticleState(w_data.sizeBySpeed!, particle);
        particleRotationOverLifetimeModuleInitParticleState(w_data.rotationOverLifetime!, particle);
        particleRotationBySpeedModuleInitParticleState(w_data.rotationBySpeed!, particle);
        particleVelocityOverLifetimeModuleInitParticleState(w_data.velocityOverLifetime!, particle);
        particleTextureSheetAnimationModuleInitParticleState(w_data.textureSheetAnimation!, particle);
        particleNoiseModuleInitParticleState(w_data.noise!, particle);
        particleShapeModuleInitParticleState(w_data.shape!, particle);
    }

    /**
     * 更新粒子状态
     * @param particle 粒子
     */
    function updateParticleStateInternal(particle: Particle, deltaTime: number)
    {
        //
        particleMainModuleUpdateParticleState(w_data.main!, particle);

        particleColorOverLifetimeModuleUpdateParticleState(w_data.colorOverLifetime!, particle);
        particleColorBySpeedModuleUpdateParticleState(w_data.colorBySpeed!, particle);
        particleInheritVelocityModuleUpdateParticleState(w_data.inheritVelocity!, particle);
        particleForceOverLifetimeModuleUpdateParticleState(w_data.forceOverLifetime!, particle);
        particleLimitVelocityOverLifetimeModuleUpdateParticleState(w_data.limitVelocityOverLifetime!, particle);
        particleVelocityOverLifetimeModuleUpdateParticleState(w_data.velocityOverLifetime!, particle);
        particleTextureSheetAnimationModuleUpdateParticleState(w_data.textureSheetAnimation!, particle);
        particleNoiseModuleUpdateParticleState(w_data.noise!, particle);
        particleSubEmittersModuleUpdateParticleState(w_data.subEmitters!, particle);
        particleRotationBySpeedModuleUpdateParticleState(w_data.rotationBySpeed!, particle);
        particleRotationOverLifetimeModuleUpdateParticleState(w_data.rotationOverLifetime!, particle);
        particleSizeBySpeedModuleUpdateParticleState(w_data.sizeBySpeed!, particle);
        particleSizeOverLifetimeModuleUpdateParticleState(w_data.sizeOverLifetime!, particle);

        particle.updateState(particle.curTime + deltaTime);
    }

    function simulationSpaceChanged()
    {
        if (!object3D()) return;
        if (activeParticles.length === 0) return;

        if (w_data.main!.simulationSpace === ParticleSystemSimulationSpace.Local)
        {
            const world2local = getLogic(object3D()).world2local;
            activeParticles.forEach((p) =>
            {
                mat4TransformPoint3(world2local, p.position, p.position);
                mat4TransformVector3(world2local, p.velocity, p.velocity);
                mat4TransformVector3(world2local, p.acceleration, p.acceleration);
            });
        }
        else
        {
            const local2world = getLogic(object3D()).local2world;
            activeParticles.forEach((p) =>
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
    function addParticlePosition(particle: Particle, position: Vector3Like, space: ParticleSystemSimulationSpace, name?: string)
    {
        if (name !== undefined)
        {
            removeParticleVelocity(particle, name);
            particle.cache[name] = { value: vec3Copy(position), space };
        }

        if (space !== w_data.main!.simulationSpace)
        {
            if (space === ParticleSystemSimulationSpace.World)
            {
                mat4TransformPoint3(getLogic(object3D()).world2local, position, position);
            }
            else
            {
                mat4TransformPoint3(getLogic(object3D()).local2world, position, position);
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
    function removeParticlePosition(particle: Particle, name: string)
    {
        const obj: { value: Vector3, space: ParticleSystemSimulationSpace } = particle.cache[name];
        if (obj)
        {
            delete particle.cache[name];

            const space = obj.space;
            const value = obj.value;
            if (space !== w_data.main!.simulationSpace)
            {
                if (space === ParticleSystemSimulationSpace.World)
                {
                    mat4TransformPoint3(getLogic(object3D()).world2local, value, value);
                }
                else
                {
                    mat4TransformPoint3(getLogic(object3D()).local2world, value, value);
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
    function addParticleVelocity(particle: Particle, velocity: Vector3Like, space: ParticleSystemSimulationSpace, name?: string)
    {
        if (name !== undefined)
        {
            removeParticleVelocity(particle, name);
            particle.cache[name] = { value: vec3Copy(velocity), space };
        }

        if (space !== w_data.main!.simulationSpace)
        {
            if (space === ParticleSystemSimulationSpace.World)
            {
                mat4TransformVector3(getLogic(object3D()).world2local, velocity, velocity);
            }
            else
            {
                mat4TransformVector3(getLogic(object3D()).local2world, velocity, velocity);
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
    function removeParticleVelocity(particle: Particle, name: string)
    {
        const obj: { value: Vector3, space: ParticleSystemSimulationSpace } = particle.cache[name];
        if (obj)
        {
            delete particle.cache[name];

            const space = obj.space;
            const value = obj.value;
            if (space !== w_data.main!.simulationSpace)
            {
                if (space === ParticleSystemSimulationSpace.World)
                {
                    mat4TransformVector3(getLogic(object3D()).world2local, value, value);
                }
                else
                {
                    mat4TransformVector3(getLogic(object3D()).local2world, value, value);
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
    function addParticleAcceleration(particle: Particle, acceleration: Vector3Like, space: ParticleSystemSimulationSpace, name?: string)
    {
        if (name !== undefined)
        {
            removeParticleAcceleration(particle, name);
            particle.cache[name] = { value: vec3Copy(acceleration), space };
        }

        if (space !== w_data.main!.simulationSpace)
        {
            if (space === ParticleSystemSimulationSpace.World)
            {
                mat4TransformVector3(getLogic(object3D()).world2local, acceleration, acceleration);
            }
            else
            {
                mat4TransformVector3(getLogic(object3D()).local2world, acceleration, acceleration);
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
    function removeParticleAcceleration(particle: Particle, name: string)
    {
        const obj: { value: Vector3, space: ParticleSystemSimulationSpace } = particle.cache[name];
        if (obj)
        {
            delete particle.cache[name];

            const space = obj.space;
            const value = obj.value;
            if (space !== w_data.main!.simulationSpace)
            {
                if (space === ParticleSystemSimulationSpace.World)
                {
                    mat4TransformVector3(getLogic(object3D()).world2local, value, value);
                }
                else
                {
                    mat4TransformVector3(getLogic(object3D()).local2world, value, value);
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
    // 参数可为 null：函数体内有 `particles || activeParticles` 兜底，如实放宽以兼容现有调用
    function TriggerSubEmitter(subEmitterIndex: number, particles: Particle[] | null = null)
    {
        if (!w_data.subEmitters!.enabled) return;

        const subEmitter = particleSubEmittersModuleGetSubEmitterSystem(w_data.subEmitters!, subEmitterIndex);
        if (!subEmitter) return;

        if (!subEmitter.enabled) return;

        const probability = particleSubEmittersModuleGetSubEmitterEmitProbability(w_data.subEmitters!, subEmitterIndex);
        particleSubEmittersModuleGetSubEmitterProperties(w_data.subEmitters!, subEmitterIndex);
        particleSubEmittersModuleGetSubEmitterType(w_data.subEmitters!, subEmitterIndex);

        particles = particles || activeParticles;

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

            mat4TransformPoint3(getLogic(object3D()).local2world, particle.position, particleWoldPos);
            // 粒子在子粒子系统的坐标
            const subEmitPos = { x: 0, y: 0, z: 0 };

            mat4TransformPoint3(getLogic((getLogic(subEmitter) as ParticleSystemLogic).object3D).world2local, particleWoldPos, subEmitPos);
            if (!particle.subEmitInfo)
            {
                const startDelay = minMaxCurveGetValue(w_data.main!.startDelay, Math.random());
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

            const subEmits = (getLogic(subEmitter) as ParticleSystemLogic).emitInternal(particle.subEmitInfo);

            emits = emits.concat(subEmits);
        });

        emits.sort((a, b) => a.time - b.time);
        emits.forEach((v) =>
        {
            (getLogic(subEmitter) as ParticleSystemLogic).emitParticles(v);
        });
    }

    const { members } = createRenderableLogicBase(data);

    const logic: ParticleSystemLogic = {
        get component() { return members.component; },
        get entity() { return members.entity; },
        get isVisibleAndEnabled() { return members.isVisibleAndEnabled; },
        get lightPicker() { return members.lightPicker; },
        get renderObject() { return members.renderObject; },
        get selfLocalBounds() { return members.selfLocalBounds; },
        get selfWorldBounds() { return members.selfWorldBounds; },
        get isLoaded() { return members.isLoaded; },
        get isPlaying() { return isPlaying; },
        get isStopped() { return isStopped(); },
        get isPaused() { return isPaused(); },
        get particleCount() { return activeParticles.length; },
        get single() { return true; },
        get main() { return data.main!; },
        get object3D() { return object3D(); },
        get emitInfo() { return psEmitInfo!; },
        play() { playInternal(); },
        stop() { stopInternal(); },
        pause() { pauseInternal(); },
        continue() { continueInternal(); },
        addParticlePosition(particle, position, space, name) { addParticlePosition(particle, position, space, name); },
        removeParticlePosition(particle, name) { removeParticlePosition(particle, name); },
        addParticleVelocity(particle, velocity, space, name) { addParticleVelocity(particle, velocity, space, name); },
        removeParticleVelocity(particle, name) { removeParticleVelocity(particle, name); },
        addParticleAcceleration(particle, acceleration, space, name) { addParticleAcceleration(particle, acceleration, space, name); },
        removeParticleAcceleration(particle, name) { removeParticleAcceleration(particle, name); },
        emitInternal(emitInfo) { return emitInternal(emitInfo); },
        emitParticles(v) { emitParticles(v); },
        TriggerSubEmitter(subEmitterIndex, particles) { TriggerSubEmitter(subEmitterIndex, particles); },
        baseBeforeRender(renderObject) { members.baseBeforeRender(renderObject); },
        beforeRender(ro)
        {
            members.baseBeforeRender(ro);
            beforeRenderInternal(ro);
        },
        init(object3D)
        {
            members.init(object3D);
            owner = (object3D ?? members.entity) as Object3D | null;
        },
        update(interval) { updateInternal(interval); },
        localRayIntersection(localRay) { return members.localRayIntersection(localRay); },
        worldRayIntersection(worldRay) { return members.worldRayIntersection(worldRay); },
        dispose() { members.dispose(); },
    };

    // ---- 各模块的反向引用注入（替换原 class setter 里的注入）----
    (w_data.main! as WritableParticleModuleLike).particleSystem = logic;
    (w_data.emission! as WritableParticleModuleLike).particleSystem = logic;
    (w_data.shape! as WritableParticleModuleLike).particleSystem = logic;
    (w_data.velocityOverLifetime! as WritableParticleModuleLike).particleSystem = logic;
    (w_data.limitVelocityOverLifetime! as WritableParticleModuleLike).particleSystem = logic;
    (w_data.inheritVelocity! as WritableParticleModuleLike).particleSystem = logic;
    (w_data.forceOverLifetime! as WritableParticleModuleLike).particleSystem = logic;
    (w_data.colorOverLifetime! as WritableParticleModuleLike).particleSystem = logic;
    (w_data.colorBySpeed! as WritableParticleModuleLike).particleSystem = logic;
    (w_data.sizeOverLifetime! as WritableParticleModuleLike).particleSystem = logic;
    (w_data.sizeBySpeed! as WritableParticleModuleLike).particleSystem = logic;
    (w_data.rotationOverLifetime! as WritableParticleModuleLike).particleSystem = logic;
    (w_data.rotationBySpeed! as WritableParticleModuleLike).particleSystem = logic;
    (w_data.noise! as WritableParticleModuleLike).particleSystem = logic;
    (w_data.subEmitters! as WritableParticleModuleLike).particleSystem = logic;
    (w_data.textureSheetAnimation! as WritableParticleModuleLike).particleSystem = logic;
    (w_data.main! as WritableParticleModuleLike).enabled = true;
    (w_data.emission! as WritableParticleModuleLike).enabled = true;
    (w_data.shape! as WritableParticleModuleLike).enabled = true;

    return logic;
}
registerLogic('ParticleSystem', particleSystemLogic);

// 登记组件类型：ScenePickCache 用 isRenderable 筛选渲染列表，未登记的上层包组件只会命中
// matchType 的拾取列表、进不了渲染列表——表现是「粒子永远不渲染」。
registerComponentType('ParticleSystem', { baseTypes: ['Renderable'] });

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
