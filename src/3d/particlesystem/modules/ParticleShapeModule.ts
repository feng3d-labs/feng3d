import { MinMaxCurve } from '../../../math/curve/MinMaxCurve';
import { Matrix4x4 } from '../../../math/geom/Matrix4x4';
import { Vector3 } from '../../../math/geom/Vector3';
import { oav } from '../../../objectview/ObjectView';
import { $set } from '../../../serialization/Serialization';
import { SerializeProperty } from '../../../serialization/SerializeProperty';
import { watcher } from '../../../watcher/watcher';
import { Geometry } from '../../geometrys/Geometry';
import { ParticleSystemMeshShapeType } from '../enums/ParticleSystemMeshShapeType';
import { ParticleSystemShapeConeEmitFrom } from '../enums/ParticleSystemShapeConeEmitFrom';
import { ParticleSystemShapeMultiModeValue } from '../enums/ParticleSystemShapeMultiModeValue';
import { ParticleSystemShapeType } from '../enums/ParticleSystemShapeType';
import { ParticleSystemShapeType1 } from '../enums/ParticleSystemShapeType1';
import { ParticleSystemSimulationSpace } from '../enums/ParticleSystemSimulationSpace';
import { Particle } from '../Particle';
import { ParticleSystemShape } from '../shapes/ParticleSystemShape';
import { ParticleSystemShapeBox, ParticleSystemShapeBoxEmitFrom } from '../shapes/ParticleSystemShapeBox';
import { ParticleSystemShapeCircle } from '../shapes/ParticleSystemShapeCircle';
import { ParticleSystemShapeCone } from '../shapes/ParticleSystemShapeCone';
import { ParticleSystemShapeEdge } from '../shapes/ParticleSystemShapeEdge';
import { ParticleSystemShapeHemisphere } from '../shapes/ParticleSystemShapeHemisphere';
import { ParticleSystemShapeSphere } from '../shapes/ParticleSystemShapeSphere';
import { ParticleModule, RegisterParticleModule } from './ParticleModule';

declare module './ParticleModule' { interface ParticleModuleMap { ParticleShapeModule: ParticleShapeModule } }
/**
 * Shape of the emitter volume, which controls where particles are emitted and their initial direction.
 * 发射体体积的形状，它控制粒子发射的位置和初始方向。
 */
@RegisterParticleModule('ParticleShapeModule')
export class ParticleShapeModule extends ParticleModule
{
    declare __class__: 'ParticleShapeModule';
    /**
     * Type of shape to emit particles from.
     * 发射粒子的形状类型。
     */
    @SerializeProperty()
    shapeType: ParticleSystemShapeType;

    /**
     * Type of shape to emit particles from.
     * 发射粒子的形状类型。
     */
    // @oav({ tooltip: "Type of shape to emit particles from.", component: "OAVEnum", componentParam: { enumClass: ParticleSystemShape } })
    @oav({ tooltip: '发射粒子的形状类型。', component: 'OAVEnum', componentParam: { enumClass: ParticleSystemShapeType1 } })
    shape: ParticleSystemShapeType1;

    /**
     * 当前使用的发射形状
     */
    @oav({ component: 'OAVObjectView' })
    activeShape: ParticleSystemShape;

    /**
     * Align particles based on their initial direction of travel.
     * 根据粒子的初始运动方向排列粒子。
     *
     * Using align to Direction in the Shape module forces the system to be rendered using Local Billboard Alignment.
     * 在形状模块中使用align to Direction迫使系统使用本地看板对齐方式呈现。
     */
    @SerializeProperty()
    // @oav({ tooltip: "Align particles based on their initial direction of travel." })
    @oav({ tooltip: '根据粒子的初始运动方向排列粒子。' })
    alignToDirection = false;

    /**
     * Randomizes the starting direction of particles.
     * 随机化粒子的起始方向。
     */
    @SerializeProperty()
    // @oav({ tooltip: "Randomizes the starting direction of particles." })
    @oav({ tooltip: '随机化粒子的起始方向。' })
    randomDirectionAmount = 0;

    /**
     * Spherizes the starting direction of particles.
     * 使粒子的起始方向球面化。
     */
    @SerializeProperty()
    // @oav({ tooltip: "Spherizes the starting direction of particles." })
    @oav({ tooltip: 'Spherizes the starting direction of particles.' })
    sphericalDirectionAmount = 0;

    /**
     * Angle of the cone.
     *
     * 圆锥的角度。
     */
    @SerializeProperty()
    angle = 25;

    /**
     * Circle arc angle.
     *
     * 圆弧角。
     */
    @SerializeProperty()
    arc = 360;

    /**
     * The mode used for generating particles around the arc.
     *
     * 在弧线周围产生粒子的模式。
     */
    @SerializeProperty()
    arcMode = ParticleSystemShapeMultiModeValue.Random;

    /**
     * When using one of the animated modes, how quickly to move the emission position around the arc.
     *
     * 当使用一个动画模式时，如何快速移动发射位置周围的弧。
     */
    @SerializeProperty()
    arcSpeed = $set(new MinMaxCurve(), { constant: 1, constantMin: 1, constantMax: 1 });

    /**
     * A multiplier of the arc speed of the emission shape.
     *
     * 发射形状的电弧速度的乘数。
     */
    get arcSpeedMultiplier()
    {
        return this.arcSpeed.curveMultiplier;
    }

    set arcSpeedMultiplier(v)
    {
        this.arcSpeed.curveMultiplier = v;
    }

    /**
     * Control the gap between emission points around the arc.
     *
     * 控制弧线周围发射点之间的间隙。
     */
    @SerializeProperty()
    arcSpread = 0;

    /**
     * Scale of the box.
     *
     * 盒子的缩放。
     */
    @SerializeProperty()
    box = new Vector3(1, 1, 1);

    /**
     * Length of the cone.
     *
     * 圆锥的长度（高度）。
     */
    @SerializeProperty()
    length = 5;

    /**
     * Mesh to emit particles from.
     *
     * 发射粒子的网格。
     *
     * @todo
     */
    mesh: Geometry;

    /**
     * Emit from a single material, or the whole mesh.
     *
     * 从一个单一的材料，或整个网格发射。
     *
     * @todo
     */
    useMeshMaterialIndex: boolean;

    /**
     * Emit particles from a single material of a mesh.
     *
     * 从一个网格的单一材料发射粒子。
     *
     * @todo
     */
    meshMaterialIndex: number;

    /**
     * Mesh3D to emit particles from.
     *
     * 从 Mesh3D 发射粒子。
     *
     * @todo
     */
    // meshRenderer: Mesh3D
    meshRenderer: any;

    /**
     * SkinnedMeshRenderer to emit particles from.
     *
     * 从 SkinnedMeshRenderer 发射粒子。
     *
     * @todo
     */
    skinnedMeshRenderer: any;

    /**
     * Apply a scaling factor to the mesh used for generating source positions.
     *
     * 对用于生成源位置的网格应用缩放因子。
     *
     * @todo
     */
    meshScale = 1;

    /**
     * Where on the mesh to emit particles from.
     *
     * 从网格的什么地方发射粒子。
     *
     * @todo
     */
    meshShapeType = ParticleSystemMeshShapeType.Vertex;

    /**
     * Modulate the particle colors with the vertex colors, or the material color if no vertex colors exist.
     *
     * 用顶点颜色调节粒子颜色，如果没有顶点颜色，则调节材质颜色。
     *
     * @todo
     */
    useMeshColors = true;

    /**
     * Move particles away from the surface of the source mesh.
     *
     * 将粒子从源网格的表面移开。
     */
    normalOffset = 0;

    /**
     * Radius of the shape.
     *
     * 形状的半径。
     */
    @SerializeProperty()
    radius = 1;

    /**
     * The mode used for generating particles around the radius.
     *
     * 在弧线周围产生粒子的模式。
     */
    @SerializeProperty()
    radiusMode = ParticleSystemShapeMultiModeValue.Random;

    /**
     * When using one of the animated modes, how quickly to move the emission position along the radius.
     *
     * 当使用一个动画模式时，如何快速移动发射位置周围的弧。
     */
    @SerializeProperty()
    radiusSpeed = $set(new MinMaxCurve(), { constant: 1, constantMin: 1, constantMax: 1 });

    /**
     * A multiplier of the radius speed of the emission shape.
     *
     * 发射形状的半径速度的乘法器。
     */
    get radiusSpeedMultiplier()
    {
        return this.radiusSpeed.curveMultiplier;
    }

    set radiusSpeedMultiplier(v)
    {
        this.radiusSpeed.curveMultiplier = v;
    }

    /**
     * Control the gap between emission points around the radius.
     *
     * 控制弧线周围发射点之间的间隙。
     */
    @SerializeProperty()
    radiusSpread = 0;

    private _shapeSphere = new ParticleSystemShapeSphere(this);
    private _shapeHemisphere = new ParticleSystemShapeHemisphere(this);
    private _shapeCone = new ParticleSystemShapeCone(this);
    private _shapeBox = new ParticleSystemShapeBox(this);
    private _shapeCircle = new ParticleSystemShapeCircle(this);
    private _shapeEdge = new ParticleSystemShapeEdge(this);

    constructor()
    {
        super();
        watcher.watch(this as ParticleShapeModule, 'shapeType', this._onShapeTypeChanged, this);
        watcher.watch(this as ParticleShapeModule, 'shape', this._onShapeChanged, this);
        //
        this.shapeType = ParticleSystemShapeType.Cone;
    }

    /**
     * 初始化粒子状态
     * @param particle 粒子
     */
    initParticleState(particle: Particle)
    {
        const startSpeed = this.particleSystem.main.startSpeed.getValue(particle.birthRateAtDuration);
        //
        const position = tempPosition.set(0, 0, 0);
        const dir = tempDir.set(0, 0, 1);
        //
        if (this.enabled)
        {
            this.activeShape.calcParticlePosDir(particle, position, dir);
        }

        dir.scaleNumber(startSpeed);
        if (this.particleSystem.main.simulationSpace === ParticleSystemSimulationSpace.Global)
        {
            const globalMatrix = this.particleSystem.node3d.globalMatrix;

            globalMatrix.transformPoint3(position, position);
            globalMatrix.transformVector3(dir, dir);
        }
        particle.position.add(position);
        particle.velocity.add(dir);

        if (!this.enabled)
        { return; }

        //
        if (this.alignToDirection)
        {
            const mat = new Matrix4x4();
            mat.lookAt(particle.velocity, Vector3.Y_AXIS);

            const mat0 = new Matrix4x4().fromRotation(particle.rotation.x, particle.rotation.y, particle.rotation.z);
            mat0.append(mat);

            particle.rotation = mat0.getRotation();
        }
        const length = particle.velocity.length;
        if (this.randomDirectionAmount > 0)
        {
            const velocity = new Vector3().random().scaleNumber(2).subNumber(1)
.normalize(length);
            particle.velocity.lerpNumber(velocity, this.randomDirectionAmount).normalize(length);
        }
        if (this.sphericalDirectionAmount > 0)
        {
            const velocity = particle.position.clone().normalize(length);
            particle.velocity.lerpNumber(velocity, this.sphericalDirectionAmount).normalize(length);
        }
    }

    private _onShapeTypeChanged()
    {
        const preValue = this.activeShape;
        switch (this.shapeType)
        {
            case ParticleSystemShapeType.Sphere:
                this.shape = ParticleSystemShapeType1.Sphere;
                this._shapeSphere.emitFromShell = false;
                this.activeShape = this._shapeSphere;
                break;
            case ParticleSystemShapeType.SphereShell:
                this.shape = ParticleSystemShapeType1.Sphere;
                this._shapeSphere.emitFromShell = true;
                this.activeShape = this._shapeSphere;
                break;
            case ParticleSystemShapeType.Hemisphere:
                this.shape = ParticleSystemShapeType1.Hemisphere;
                this._shapeHemisphere.emitFromShell = false;
                this.activeShape = this._shapeHemisphere;
                break;
            case ParticleSystemShapeType.HemisphereShell:
                this.shape = ParticleSystemShapeType1.Hemisphere;
                this._shapeHemisphere.emitFromShell = true;
                this.activeShape = this._shapeHemisphere;
                break;
            case ParticleSystemShapeType.Cone:
                this.shape = ParticleSystemShapeType1.Cone;
                this._shapeCone.emitFrom = ParticleSystemShapeConeEmitFrom.Base;
                this.activeShape = this._shapeCone;
                break;
            case ParticleSystemShapeType.ConeShell:
                this.shape = ParticleSystemShapeType1.Cone;
                this._shapeCone.emitFrom = ParticleSystemShapeConeEmitFrom.BaseShell;
                this.activeShape = this._shapeCone;
                break;
            case ParticleSystemShapeType.ConeVolume:
                this.shape = ParticleSystemShapeType1.Cone;
                this._shapeCone.emitFrom = ParticleSystemShapeConeEmitFrom.Volume;
                this.activeShape = this._shapeCone;
                break;
            case ParticleSystemShapeType.ConeVolumeShell:
                this.shape = ParticleSystemShapeType1.Cone;
                this._shapeCone.emitFrom = ParticleSystemShapeConeEmitFrom.VolumeShell;
                this.activeShape = this._shapeCone;
                break;
            case ParticleSystemShapeType.Box:
                this.shape = ParticleSystemShapeType1.Box;
                this._shapeBox.emitFrom = ParticleSystemShapeBoxEmitFrom.Volume;
                this.activeShape = this._shapeBox;
                break;
            case ParticleSystemShapeType.BoxShell:
                this.shape = ParticleSystemShapeType1.Box;
                this._shapeBox.emitFrom = ParticleSystemShapeBoxEmitFrom.Shell;
                this.activeShape = this._shapeBox;
                break;
            case ParticleSystemShapeType.BoxEdge:
                this.shape = ParticleSystemShapeType1.Box;
                this._shapeBox.emitFrom = ParticleSystemShapeBoxEmitFrom.Edge;
                this.activeShape = this._shapeBox;
                break;
            case ParticleSystemShapeType.Mesh:
                this.shape = ParticleSystemShapeType1.Mesh;
                console.warn(`未实现 ParticleSystemShapeType.Mesh`);
                this.activeShape = null;
                break;
            case ParticleSystemShapeType.Mesh3D:
                this.shape = ParticleSystemShapeType1.Mesh3D;
                console.warn(`未实现 ParticleSystemShapeType.Mesh`);
                this.activeShape = null;
                break;
            case ParticleSystemShapeType.SkinnedMeshRenderer:
                this.shape = ParticleSystemShapeType1.SkinnedMeshRenderer;
                console.warn(`未实现 ParticleSystemShapeType.Mesh`);
                this.activeShape = null;
                break;
            case ParticleSystemShapeType.Circle:
                this.shape = ParticleSystemShapeType1.Circle;
                this._shapeCircle.emitFromEdge = false;
                this.activeShape = this._shapeCircle;
                break;
            case ParticleSystemShapeType.CircleEdge:
                this.shape = ParticleSystemShapeType1.Circle;
                this._shapeCircle.emitFromEdge = true;
                this.activeShape = this._shapeCircle;
                break;
            case ParticleSystemShapeType.SingleSidedEdge:
                this.shape = ParticleSystemShapeType1.Edge;
                this.activeShape = this._shapeEdge;
                break;
            default:
                console.warn(`错误 ParticleShapeModule.shapeType 值 ${this.shapeType}`);
                break;
        }
        $set(this.activeShape, preValue);
        this.emit('refreshView');
    }

    private _onShapeChanged()
    {
        switch (this.shape)
        {
            case ParticleSystemShapeType1.Sphere:
                this.shapeType = this._shapeSphere.emitFromShell ? ParticleSystemShapeType.SphereShell : ParticleSystemShapeType.Sphere;
                break;
            case ParticleSystemShapeType1.Hemisphere:
                this.shapeType = this._shapeHemisphere.emitFromShell ? ParticleSystemShapeType.HemisphereShell : ParticleSystemShapeType.Hemisphere;
                break;
            case ParticleSystemShapeType1.Cone:
                switch (this._shapeCone.emitFrom)
                {
                    case ParticleSystemShapeConeEmitFrom.Base:
                        this.shapeType = ParticleSystemShapeType.Cone;
                        break;
                    case ParticleSystemShapeConeEmitFrom.BaseShell:
                        this.shapeType = ParticleSystemShapeType.ConeShell;
                        break;
                    case ParticleSystemShapeConeEmitFrom.Volume:
                        this.shapeType = ParticleSystemShapeType.ConeVolume;
                        break;
                    case ParticleSystemShapeConeEmitFrom.VolumeShell:
                        this.shapeType = ParticleSystemShapeType.ConeVolumeShell;
                        break;
                    default:
                        console.warn(`错误ParticleSystemShapeCone.emitFrom值 ${this._shapeCone.emitFrom}`);
                        break;
                }
                break;
            case ParticleSystemShapeType1.Box:
                switch (this._shapeBox.emitFrom)
                {
                    case ParticleSystemShapeBoxEmitFrom.Volume:
                        this.shapeType = ParticleSystemShapeType.Box;
                        break;
                    case ParticleSystemShapeBoxEmitFrom.Shell:
                        this.shapeType = ParticleSystemShapeType.BoxShell;
                        break;
                    case ParticleSystemShapeBoxEmitFrom.Edge:
                        this.shapeType = ParticleSystemShapeType.BoxEdge;
                        break;
                    default:
                        console.warn(`错误ParticleSystemShapeCone.emitFrom值 ${this._shapeCone.emitFrom}`);
                        break;
                }
                break;
            case ParticleSystemShapeType1.Mesh:
                this.shapeType = ParticleSystemShapeType.Mesh;
                break;
            case ParticleSystemShapeType1.Mesh3D:
                this.shapeType = ParticleSystemShapeType.Mesh3D;
                break;
            case ParticleSystemShapeType1.SkinnedMeshRenderer:
                this.shapeType = ParticleSystemShapeType.SkinnedMeshRenderer;
                break;
            case ParticleSystemShapeType1.Circle:
                this.shapeType = this._shapeCircle.emitFromEdge ? ParticleSystemShapeType.CircleEdge : ParticleSystemShapeType.Circle;
                break;
            case ParticleSystemShapeType1.Edge:
                this.shapeType = ParticleSystemShapeType.SingleSidedEdge;
                break;
            default:
                console.warn(`错误 ParticleShapeModule.shape 值 ${this.shape}`);
                break;
        }
    }
}

const tempPosition = new Vector3(0, 0, 0);
const tempDir = new Vector3(0, 0, 1);
