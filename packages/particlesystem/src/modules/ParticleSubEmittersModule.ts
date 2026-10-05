import { ParticleSystemSubEmitterProperties } from '../enums/ParticleSystemSubEmitterProperties';
import { ParticleSystemSubEmitterType } from '../enums/ParticleSystemSubEmitterType';
import type { Particle } from '../Particle';
import type { ParticleSystem } from '../ParticleSystem';
import type { ParticleModuleLike, WritableParticleModuleLike } from './ParticleModule';

/** 一个子发射器条目 */
export interface ParticleSubEmitterEntry
{
    /** 子粒子系统 */
    readonly subEmitter: ParticleSystem;

    /** 触发时机（出生 / 死亡 / 碰撞） */
    readonly type: ParticleSystemSubEmitterType;

    /** 继承属性 */
    readonly properties: ParticleSystemSubEmitterProperties;

    /** 发射概率 */
    readonly emitProbability: number;
}

/** 可写出的子发射器条目（写侧形状：`SetSubEmitter*` 要就地改这些字段）。 */
export interface WritableParticleSubEmitterEntry
{
    subEmitter: ParticleSystem;
    type: ParticleSystemSubEmitterType;
    properties: ParticleSystemSubEmitterProperties;
    emitProbability: number;
}

/**
 * 子发射器模块（纯数据接口 + 模块级行为函数）。
 *
 * 原 class 的 12 个 API 方法（`AddSubEmitter` / `GetSubEmitter*` / `SetSubEmitter*` / `RemoveSubEmitter`）
 * 与 `subEmittersCount` getter 都改成 `particleSubEmittersModule*` 模块级函数；私有数组 `subEmitters` 变成公开的只读字段。
 */
export interface ParticleSubEmittersModuleLike extends ParticleModuleLike
{
    /** 子发射器列表 */
    readonly subEmitters: readonly ParticleSubEmitterEntry[];
}

/** 可写出的子发射器模块（写侧形状）。 */
export interface WritableParticleSubEmittersModuleLike extends WritableParticleModuleLike
{
    subEmitters: WritableParticleSubEmitterEntry[];
}

/** 纯数据「子发射器模块」（带判别字段）。 */
export interface ParticleSubEmittersModule extends ParticleSubEmittersModuleLike
{
    readonly __type__: 'ParticleSubEmittersModule';
}

/**
 * `new ParticleSubEmittersModule()` 的纯函数版：字段默认值与原 class 逐字一致。
 *
 * @param out 结果写出目标（缺省时新建）
 */
export function particleSubEmittersModuleDefault(out: WritableParticleSubEmittersModuleLike = { enabled: false, subEmitters: [] }): WritableParticleSubEmittersModuleLike
{
    out.enabled = false;
    out.subEmitters = [];

    return out;
}

/**
 * 子发射器数量（原 `subEmittersCount` getter）。
 *
 * @param module 模块数据
 */
export function particleSubEmittersModuleSubEmittersCount(module: ParticleSubEmittersModuleLike): number
{
    return module.subEmitters.length;
}

/**
 * 添加一个子发射器（原 `AddSubEmitter`）。
 *
 * @param module 模块数据
 * @param subEmitter 子粒子系统
 * @param type 触发时机
 * @param properties 继承属性
 * @param emitProbability 发射概率
 */
export function particleSubEmittersModuleAddSubEmitter(module: WritableParticleSubEmittersModuleLike, subEmitter: ParticleSystem, type: ParticleSystemSubEmitterType, properties: ParticleSystemSubEmitterProperties, emitProbability: number): void
{
    (subEmitter as { isSubParticleSystem?: boolean }).isSubParticleSystem = true;

    module.subEmitters.push({ subEmitter, type, properties, emitProbability });
}

/**
 * 取子发射器的发射概率（原 `GetSubEmitterEmitProbability`；越界返回 0）。
 *
 * @param module 模块数据
 * @param index 索引
 */
export function particleSubEmittersModuleGetSubEmitterEmitProbability(module: ParticleSubEmittersModuleLike, index: number): number
{
    if (!module.subEmitters[index]) return 0;

    return module.subEmitters[index].emitProbability;
}

/**
 * 取子发射器的继承属性（原 `GetSubEmitterProperties`；越界返回 null）。
 *
 * @param module 模块数据
 * @param index 索引
 */
export function particleSubEmittersModuleGetSubEmitterProperties(module: ParticleSubEmittersModuleLike, index: number): ParticleSystemSubEmitterProperties | null
{
    if (!module.subEmitters[index]) return null;

    return module.subEmitters[index].properties;
}

/**
 * 取子发射器粒子系统（原 `GetSubEmitterSystem`；越界返回 null）。
 *
 * @param module 模块数据
 * @param index 索引
 */
export function particleSubEmittersModuleGetSubEmitterSystem(module: ParticleSubEmittersModuleLike, index: number): ParticleSystem | null
{
    if (!module.subEmitters[index]) return null;

    return module.subEmitters[index].subEmitter;
}

/**
 * 取子发射器的触发时机（原 `GetSubEmitterType`；越界返回 null）。
 *
 * @param module 模块数据
 * @param index 索引
 */
export function particleSubEmittersModuleGetSubEmitterType(module: ParticleSubEmittersModuleLike, index: number): ParticleSystemSubEmitterType | null
{
    if (!module.subEmitters[index]) return null;

    return module.subEmitters[index].type;
}

/**
 * 移除指定索引的子发射器（原 `RemoveSubEmitter`）。
 *
 * @param module 模块数据
 * @param index 索引
 */
export function particleSubEmittersModuleRemoveSubEmitter(module: WritableParticleSubEmittersModuleLike, index: number): void
{
    if (!module.subEmitters[index]) return;
    module.subEmitters.splice(index, 1);
}

/**
 * 设置子发射器的发射概率（原 `SetSubEmitterEmitProbability`）。
 *
 * @param module 模块数据
 * @param index 索引
 * @param emitProbability 发射概率
 */
export function particleSubEmittersModuleSetSubEmitterEmitProbability(module: WritableParticleSubEmittersModuleLike, index: number, emitProbability: number): void
{
    if (!module.subEmitters[index]) return;
    module.subEmitters[index].emitProbability = emitProbability;
}

/**
 * 设置子发射器的继承属性（原 `SetSubEmitterProperties`）。
 *
 * @param module 模块数据
 * @param index 索引
 * @param properties 继承属性
 */
export function particleSubEmittersModuleSetSubEmitterProperties(module: WritableParticleSubEmittersModuleLike, index: number, properties: ParticleSystemSubEmitterProperties): void
{
    if (!module.subEmitters[index]) return;
    module.subEmitters[index].properties = properties;
}

/**
 * 设置子发射器的粒子系统（原 `SetSubEmitterSystem`）。
 *
 * @param module 模块数据
 * @param index 索引
 * @param subEmitter 子粒子系统
 */
export function particleSubEmittersModuleSetSubEmitterSystem(module: WritableParticleSubEmittersModuleLike, index: number, subEmitter: ParticleSystem): void
{
    if (!module.subEmitters[index]) return;
    module.subEmitters[index].subEmitter = subEmitter;
}

/**
 * 设置子发射器的触发时机（原 `SetSubEmitterType`）。
 *
 * @param module 模块数据
 * @param index 索引
 * @param type 触发时机
 */
export function particleSubEmittersModuleSetSubEmitterType(module: WritableParticleSubEmittersModuleLike, index: number, type: ParticleSystemSubEmitterType): void
{
    if (!module.subEmitters[index]) return;
    module.subEmitters[index].type = type;
}

/**
 * 更新粒子状态（原 `ParticleSubEmittersModule.updateParticleState`）。
 *
 * @param module 模块数据
 * @param particle 粒子
 */
export function particleSubEmittersModuleUpdateParticleState(module: ParticleSubEmittersModuleLike, particle: Particle): void
{
    for (let i = 0, n = particleSubEmittersModuleSubEmittersCount(module); i < n; i++)
    {
        const emitterType = particleSubEmittersModuleGetSubEmitterType(module, i);
        if (emitterType === ParticleSystemSubEmitterType.Birth)
        {
            module.particleSystem!.TriggerSubEmitter(i, [particle]);
        }
    }
}
