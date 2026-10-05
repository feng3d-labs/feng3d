import { Geometry, logic, MeshRenderer, SkinnedMeshRenderer } from 'feng3d';
import { mat4Append, mat4FromRotation, mat4GetRotation, mat4Identity, mat4LookAt, mat4TransformPoint3, mat4TransformVector3, minMaxCurveDefault, minMaxCurveGetValue, vec3Add, vec3Copy, vec3From, vec3LerpNumber, vec3Length, vec3NormalizeThickness, vec3Random, vec3ScaleNumber, vec3SubNumber } from '@feng3d/math';
import type { Matrix4x4, MinMaxCurve, Vector3Like } from '@feng3d/math';
import { ParticleSystemMeshShapeType } from '../enums/ParticleSystemMeshShapeType';
import { ParticleSystemShapeMultiModeValue } from '../enums/ParticleSystemShapeMultiModeValue';
import { ParticleSystemShapeType } from '../enums/ParticleSystemShapeType';
import { ParticleSystemSimulationSpace } from '../enums/ParticleSystemSimulationSpace';
import { particleSystemShapeBoxCalcParticlePosDir } from '../shapes/ParticleSystemShapeBox';
import { particleSystemShapeCircleCalcParticlePosDir } from '../shapes/ParticleSystemShapeCircle';
import { particleSystemShapeConeCalcParticlePosDir } from '../shapes/ParticleSystemShapeCone';
import { particleSystemShapeEdgeCalcParticlePosDir } from '../shapes/ParticleSystemShapeEdge';
import { particleSystemShapeHemisphereCalcParticlePosDir } from '../shapes/ParticleSystemShapeHemisphere';
import { particleSystemShapeSphereCalcParticlePosDir } from '../shapes/ParticleSystemShapeSphere';
import type { Particle } from '../Particle';
import type { ParticleModuleLike, WritableParticleModuleLike } from './ParticleModule';

/**
 * 粒子系统形状模块（纯数据接口 + 模块级行为函数）。
 *
 * 与原 class 的三点结构差异：
 * 1. **`shapeType` 是唯一权威**——原来的 `shape`（`ParticleSystemShapeType1` 镜像枚举）与
 *    `activeShape`（策略实例）都是它的派生物，watcher 双向同步整段删除；
 * 2. **策略类删除**：六个 shape 的 `calcParticlePosDir` 变成 `particleSystemShape*CalcParticlePosDir(module, ...)`
 *    纯函数，原来挂在策略上的开关（`emitFromShell` / `emitFrom` / `emitFromEdge`）全部由 `shapeType` 推导；
 * 3. 转发型 getter/setter（`arcSpeedMultiplier` / `radiusSpeedMultiplier`）删除，调用方直接读写曲线。
 */
export interface ParticleShapeModuleLike extends ParticleModuleLike
{
    /** 发射粒子的形状类型（唯一权威） */
    readonly shapeType: ParticleSystemShapeType;

    /** 是否按初始运动方向排列粒子 */
    readonly alignToDirection: boolean;

    /** 随机方向量（0~1） */
    readonly randomDirectionAmount: number;

    /** 球面方向量（0~1） */
    readonly sphericalDirectionAmount: number;

    /** 圆锥角度（0~87） */
    readonly angle: number;

    /** 圆弧角（度） */
    readonly arc: number;

    /** 圆弧上生成粒子的模式 */
    readonly arcMode: ParticleSystemShapeMultiModeValue;

    /** 沿圆弧移动发射位置的速度曲线 */
    readonly arcSpeed: MinMaxCurve;

    /** 圆弧上发射点之间的间隙 */
    readonly arcSpread: number;

    /** 盒子尺寸 */
    readonly box: Vector3Like;

    /** 圆锥长度（高度） */
    readonly length: number;

    /** 从该网格发射（@todo 未实现） */
    readonly mesh?: Geometry;

    /** 是否只从单个材质发射（@todo 未实现） */
    readonly useMeshMaterialIndex?: boolean;

    /** 使用的材质下标（@todo 未实现） */
    readonly meshMaterialIndex?: number;

    /** 从该 MeshRenderer 发射（@todo 未实现） */
    readonly meshRenderer?: MeshRenderer;

    /** 从该 SkinnedMeshRenderer 发射（@todo 未实现） */
    readonly skinnedMeshRenderer?: SkinnedMeshRenderer;

    /** 生成源位置时对网格应用的缩放 */
    readonly meshScale: number;

    /** 从网格的什么位置发射（@todo 未实现） */
    readonly meshShapeType: ParticleSystemMeshShapeType;

    /** 是否用顶点颜色调节粒子颜色（@todo 未实现） */
    readonly useMeshColors: boolean;

    /** 把粒子推离源网格表面的距离 */
    readonly normalOffset: number;

    /** 形状半径 */
    readonly radius: number;

    /** 半径上生成粒子的模式 */
    readonly radiusMode: ParticleSystemShapeMultiModeValue;

    /** 沿半径移动发射位置的速度曲线 */
    readonly radiusSpeed: MinMaxCurve;

    /** 半径上发射点之间的间隙 */
    readonly radiusSpread: number;
}

/** 可写出的形状模块（写侧形状）。 */
export interface WritableParticleShapeModuleLike extends WritableParticleModuleLike
{
    shapeType: ParticleSystemShapeType;
    alignToDirection: boolean;
    randomDirectionAmount: number;
    sphericalDirectionAmount: number;
    angle: number;
    arc: number;
    arcMode: ParticleSystemShapeMultiModeValue;
    arcSpeed: MinMaxCurve;
    arcSpread: number;
    box: Vector3Like;
    length: number;
    mesh?: Geometry;
    useMeshMaterialIndex?: boolean;
    meshMaterialIndex?: number;
    meshRenderer?: MeshRenderer;
    skinnedMeshRenderer?: SkinnedMeshRenderer;
    meshScale: number;
    meshShapeType: ParticleSystemMeshShapeType;
    useMeshColors: boolean;
    normalOffset: number;
    radius: number;
    radiusMode: ParticleSystemShapeMultiModeValue;
    radiusSpeed: MinMaxCurve;
    radiusSpread: number;
}

/** 纯数据「形状模块」（带判别字段）。 */
export interface ParticleShapeModule extends ParticleShapeModuleLike
{
    readonly __type__: 'ParticleShapeModule';
}

/**
 * `new ParticleShapeModule()` 的纯函数版：字段默认值与原 class 逐字一致
 * （原构造里把 `shapeType` 设为 `Cone`；`mesh` / `meshRenderer` / `skinnedMeshRenderer` 等可选字段保持 undefined）。
 *
 * @param out 结果写出目标（缺省时新建）
 */
export function particleShapeModuleDefault(out: WritableParticleShapeModuleLike = {
    enabled: false,
    shapeType: ParticleSystemShapeType.Cone,
    alignToDirection: false,
    randomDirectionAmount: 0,
    sphericalDirectionAmount: 0,
    angle: 25,
    arc: 360,
    arcMode: ParticleSystemShapeMultiModeValue.Random,
    arcSpeed: { __type__: 'MinMaxCurve', ...minMaxCurveDefault(), constant: 1, constantMin: 1, constantMax: 1 },
    arcSpread: 0,
    box: { x: 1, y: 1, z: 1 },
    length: 5,
    meshScale: 1,
    meshShapeType: ParticleSystemMeshShapeType.Vertex,
    useMeshColors: true,
    normalOffset: 0,
    radius: 1,
    radiusMode: ParticleSystemShapeMultiModeValue.Random,
    radiusSpeed: { __type__: 'MinMaxCurve', ...minMaxCurveDefault(), constant: 1, constantMin: 1, constantMax: 1 },
    radiusSpread: 0,
}): WritableParticleShapeModuleLike
{
    out.enabled = false;
    out.shapeType = ParticleSystemShapeType.Cone;
    out.alignToDirection = false;
    out.randomDirectionAmount = 0;
    out.sphericalDirectionAmount = 0;
    out.angle = 25;
    out.arc = 360;
    out.arcMode = ParticleSystemShapeMultiModeValue.Random;
    out.arcSpeed = { __type__: 'MinMaxCurve', ...minMaxCurveDefault(), constant: 1, constantMin: 1, constantMax: 1 };
    out.arcSpread = 0;
    out.box = { x: 1, y: 1, z: 1 };
    out.length = 5;
    out.meshScale = 1;
    out.meshShapeType = ParticleSystemMeshShapeType.Vertex;
    out.useMeshColors = true;
    out.normalOffset = 0;
    out.radius = 1;
    out.radiusMode = ParticleSystemShapeMultiModeValue.Random;
    out.radiusSpeed = { __type__: 'MinMaxCurve', ...minMaxCurveDefault(), constant: 1, constantMin: 1, constantMax: 1 };
    out.radiusSpread = 0;

    return out;
}

/**
 * 初始化粒子状态（原 `ParticleShapeModule.initParticleState`）：算发射位置与初始速度。
 *
 * 形状分发由 `shapeType` 直接 `switch`（原来靠 `activeShape` 策略实例 + watcher 维护）。
 *
 * @param module 模块数据
 * @param particle 粒子
 */
export function particleShapeModuleInitParticleState(module: ParticleShapeModuleLike, particle: Particle): void
{
    const startSpeed = minMaxCurveGetValue(module.particleSystem!.main.startSpeed, particle.birthRateAtDuration);
    //
    const position = vec3From(0, 0, 0, tempPosition);
    const dir = vec3From(0, 0, 1, tempDir);
    //
    if (module.enabled)
    {
        calcShapePosDirByShapeType(module, particle, position, dir);
    }

    vec3ScaleNumber(dir, startSpeed, dir);
    if (module.particleSystem!.main.simulationSpace === ParticleSystemSimulationSpace.World)
    {
        const local2world = logic(module.particleSystem!.object3D).local2world;

        mat4TransformPoint3(local2world, position, position);
        mat4TransformVector3(local2world, dir, dir);
    }
    vec3Add(particle.position, position, particle.position);
    vec3Add(particle.velocity, dir, particle.velocity);

    if (!module.enabled)
    { return; }

    //
    if (module.alignToDirection)
    {
        const mat: Matrix4x4 = { __type__: 'Matrix4x4', ...mat4LookAt(mat4Identity(), particle.velocity, VEC3_Y_AXIS) };

        const mat0 = mat4FromRotation(particle.rotation.x, particle.rotation.y, particle.rotation.z);

        mat4Append(mat0, mat, mat0);

        const rotation = { x: 0, y: 0, z: 0 };

        mat4GetRotation(mat0, rotation);
        particle.rotation = rotation;
    }
    const length = vec3Length(particle.velocity);
    if (module.randomDirectionAmount > 0)
    {
        const velocity = vec3NormalizeThickness(vec3SubNumber(vec3ScaleNumber(vec3Random(), 2), 1), length);
        vec3NormalizeThickness(vec3LerpNumber(particle.velocity, velocity, module.randomDirectionAmount, particle.velocity), length, particle.velocity);
    }
    if (module.sphericalDirectionAmount > 0)
    {
        const velocity = vec3NormalizeThickness(vec3Copy(particle.position), length);
        vec3NormalizeThickness(vec3LerpNumber(particle.velocity, velocity, module.sphericalDirectionAmount, particle.velocity), length, particle.velocity);
    }
}

/**
 * 按 `shapeType` 分发到对应形状的「算位置与方向」函数。
 *
 * @param module 模块数据
 * @param particle 粒子
 * @param position 写出的位置
 * @param dir 写出的方向
 */
function calcShapePosDirByShapeType(module: ParticleShapeModuleLike, particle: Particle, position: Vector3Like, dir: Vector3Like): void
{
    switch (module.shapeType)
    {
        case ParticleSystemShapeType.Sphere:
        case ParticleSystemShapeType.SphereShell:
            particleSystemShapeSphereCalcParticlePosDir(module, particle, position, dir);
            break;
        case ParticleSystemShapeType.Hemisphere:
        case ParticleSystemShapeType.HemisphereShell:
            particleSystemShapeHemisphereCalcParticlePosDir(module, particle, position, dir);
            break;
        case ParticleSystemShapeType.Cone:
        case ParticleSystemShapeType.ConeShell:
        case ParticleSystemShapeType.ConeVolume:
        case ParticleSystemShapeType.ConeVolumeShell:
            particleSystemShapeConeCalcParticlePosDir(module, particle, position, dir);
            break;
        case ParticleSystemShapeType.Box:
        case ParticleSystemShapeType.BoxShell:
        case ParticleSystemShapeType.BoxEdge:
            particleSystemShapeBoxCalcParticlePosDir(module, particle, position, dir);
            break;
        case ParticleSystemShapeType.Circle:
        case ParticleSystemShapeType.CircleEdge:
            particleSystemShapeCircleCalcParticlePosDir(module, particle, position, dir);
            break;
        case ParticleSystemShapeType.SingleSidedEdge:
            particleSystemShapeEdgeCalcParticlePosDir(module, particle, position, dir);
            break;
        case ParticleSystemShapeType.Mesh:
        case ParticleSystemShapeType.MeshRenderer:
        case ParticleSystemShapeType.SkinnedMeshRenderer:
            console.warn('未实现 ParticleSystemShapeType.Mesh');
            break;
        default:
            console.warn(`错误 ParticleShapeModule.shapeType 值 ${module.shapeType}`);
            break;
    }
}

const tempPosition = { x: 0, y: 0, z: 0 };
const tempDir = { x: 0, y: 0, z: 1 };
const VEC3_Y_AXIS = { x: 0, y: 1, z: 0 };
