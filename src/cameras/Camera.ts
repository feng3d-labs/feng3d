import { Frustum, Matrix4x4, Ray3, Vector2, Vector3 } from '@feng3d/math';
import { Computed, computed, logic as getLogic, reactive, registerLogic } from '@feng3d/reactivity';
import { Component3D, Component3DLogic } from '../component/Component';
import type { LensBase } from './lenses/LensBase';
import { OrthographicLens } from './lenses/OrthographicLens';
import { PerspectiveLens } from './lenses/PerspectiveLens';
import { Projection } from './Projection';

import './Camera';

declare module '../component/Component'
{
    export interface ComponentMap
    {
        Camera: Camera;
    }
}

/**
 * Camera（纯数据接口）。
 */
export interface Camera extends Component3D
{
    readonly __type__: 'Camera';
    lens?: LensBase;
}

/**
 * 创建 Camera 实例。
 */
export function createCamera(): Camera
{
    return {
        __type__: 'Camera',
        lens: null as unknown as LensBase,
    };
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Camera: CameraLogic;
    }
}

/**
 * Camera 逻辑处理类。
 *
 * lens/projection 作为 Camera 数据字段，logic 通过 reactive(camera).lens 读写并监听变化。
 *
 * 提供：
 * - lens / projection getter/setter（带 lensChanged/refreshView 事件）
 * - viewProjection / frustum
 * - getRay3D / project / unproject / getScaleByDepth
 * - getUniforms
 * - init: effect 监听 local2world 与 lens 变化使 viewProjection 失效
 */
export class CameraLogic extends Component3DLogic
{
    /** projection 切换时保留的上一组镜头参数（fov / 正交边界） */
    private _backups = { fov: 60, left: -1, right: 1, top: 1, bottom: -1 };
    /** init 去重标志 */
    private _inited = false;
    /**
     * lens 变化由 watcher.watch 触发 lensChanged 事件（非 @feng3d/reactivity 体系），
     * 这里用一个响应式 version 计数器桥接：lensChanged 时 +1，computed 读取它建立依赖。
     */
    private readonly _lensVersion = reactive({ v: 0 });

    /** viewProjection computed（依赖 world2local + lens.matrix + lensVersion） */
    private readonly _viewProjection: Computed<Matrix4x4>;
    /** frustum computed（由 viewProjection 派生） */
    private readonly _frustum: Computed<Frustum>;
    /** 相机 uniform computed */
    readonly _uniforms: Computed<CameraUniforms>;

    constructor(camera: Camera)
    {
        super(camera);

        // viewProjection：场景空间 → 投影空间。
        // 依赖 world2local（相机变换）+ lens.matrix + lensVersion（镜头参数变化）。
        this._viewProjection = computed<Matrix4x4>(() =>
        {
            this._lensVersion.v; // 依赖 lens 变化
            const lens = this.getLens();
            const m = getLogic(this.entity).world2local.clone();

            return m.append(lens.matrix);
        });

        // frustum：由 viewProjection 派生。
        this._frustum = computed<Frustum>(() =>
        {
            const f = new Frustum();
            f.fromMatrix(this._viewProjection.value);

            return f;
        });

        // 相机 uniform：依赖 viewProjection、viewMatrix（world2local）、cameraMatrix（local2world）、
        // worldPosition、lens 等。任一变化自动失效，上游 uniform buffer 重传。
        this._uniforms = computed<CameraUniforms>(() =>
        {
            const lens = this.getLens();

            return {
                u_projectionMatrix: lens.matrix,
                u_viewProjection: this._viewProjection.value,
                u_viewMatrix: getLogic(this.entity).world2local,
                u_cameraMatrix: getLogic(this.entity).local2world,
                u_cameraPos: getLogic(this.entity).worldPosition,
                u_skyBoxSize: lens.far / Math.sqrt(3),
                u_scaleByDepth: this.getScaleByDepth(1),
            };
        });
    }

    /** 读取响应式 lens 建立依赖，返回原始实例以保留类型。 */
    private getLens(): LensBase
    {
        reactive(this.component as Camera).lens;

        return (this.component as Camera).lens;
    }

    /** lensChanged 回调：自增 version，使依赖 lens 的 computed（viewProjection/frustum/uniforms）失效。 */
    private onLensChanged()
    {
        this._lensVersion.v++;
    }

    /** 镜头 */
    get lens(): LensBase { return this.getLens(); }
    set lens(v)
    {
        const r_camera = reactive(this.component as Camera);
        if (r_camera.lens === v) return;

        if (r_camera.lens)
        {
            r_camera.lens.off('lensChanged', this.onLensChanged);
        }
        r_camera.lens = v;
        if (r_camera.lens)
        {
            r_camera.lens.on('lensChanged', this.onLensChanged);
        }

        this.onLensChanged();
    }

    /** 投影类型 */
    get projection()
    {
        const lens = this.getLens();

        return lens && lens.projectionType;
    }
    set projection(v)
    {
        const lens = this.getLens();
        const projectionType = lens && lens.projectionType;
        if (projectionType === v) return;
        //
        let aspect = 1;
        let near = 0.3;
        let far = 1000;
        if (lens)
        {
            aspect = lens.aspect;
            near = lens.near;
            far = lens.far;
            // 保存当前 lens 参数（用于切换投影类型时恢复）
            if (lens instanceof PerspectiveLens)
            {
                this._backups.fov = lens.fov ?? this._backups.fov;
            }
            else if (lens instanceof OrthographicLens)
            {
                this._backups.left = lens.left ?? this._backups.left;
                this._backups.right = lens.right ?? this._backups.right;
                this._backups.top = lens.top ?? this._backups.top;
                this._backups.bottom = lens.bottom ?? this._backups.bottom;
            }
        }
        const fov = this._backups ? this._backups.fov : 60;
        const { left, right, top, bottom } = this._backups;
        if (v === Projection.Perspective)
        {
            this.lens = new PerspectiveLens(fov, aspect, near, far);
        }
        else
        {
            this.lens = new OrthographicLens(left, right, top, bottom, near, far);
        }
    }

    /** 场景投影矩阵 */
    get viewProjection()
    {
        return this._viewProjection.value;
    }

    /** 截头锥体 */
    get frustum()
    {
        return this._frustum.value;
    }

    init(object3D?)
    {
        super.init(object3D);
        if (this._inited) return;
        this._inited = true;
        if (!this.getLens())
        {
            this.lens = new PerspectiveLens();
        }
        // viewProjection/frustum/uniforms 均为 computed，依赖 transformLogic 与 lensVersion，
        // 相机变换或镜头参数变化时自动失效，无需手动 effect。
    }

    beforeRender() { /* Camera 无 beforeRender，uniform 由 ForwardRenderer 注入 */ }

    /** 获取与坐标重叠的射线 */
    getRay3D(x: number, y: number, ray3D = new Ray3()): Ray3
    {
        if (!this.entity) return ray3D;
        return this.getLens().unprojectRay(x, y, ray3D).applyMatri4x4(getLogic(this.entity).local2world);
    }

    /** 投影坐标 */
    project(point3d: Vector3): Vector3
    {
        return this.getLens().project(getLogic(this.entity).world2local.transformPoint3(point3d));
    }

    /** 屏幕坐标投影到场景坐标 */
    unproject(sX: number, sY: number, sZ: number, v = new Vector3()): Vector3
    {
        return getLogic(this.entity).local2world.transformPoint3(this.getLens().unprojectWithDepth(sX, sY, sZ, v), v);
    }

    /** 获取指定深度处的视野尺寸 */
    getScaleByDepth(depth: number, dir = new Vector2(0, 1)): number
    {
        const lt = this.unproject(-0.5 * dir.x, -0.5 * dir.y, depth);
        const rb = this.unproject(+0.5 * dir.x, +0.5 * dir.y, depth);
        const scale = lt.subTo(rb).length;

        return scale;
    }

    /** 相机 uniform（响应式 computed：依赖 viewMatrix/lens 等，相机变换变化时自动失效） */
    get uniforms()
    {
        // 返回 Computed 本身：ForwardRenderer 把它作为 BufferBinding.value，
        // WGPUBufferBinding 通过 isRef 解包读取 .value，建立响应式依赖。
        return this._uniforms.value;
    }

    dispose()
    {
        const lens = this.getLens();
        if (lens)
        {
            lens.off('lensChanged', this.onLensChanged);
        }
        // logic 缓存由统一 logic() 管理，无需手动删除
    }
}
// 注册到分发表
registerLogic('Camera', CameraLogic);

/**
 * CameraUniforms WGSL 片段（struct + binding 声明）。
 *
 * 与 CameraLogic._uniforms 计算结果对应：
 * - @group(0) @binding(1) var<uniform> cameraUniforms 由 ForwardRenderer 注入。
 * - 字段：u_projectionMatrix / u_viewProjection / u_viewMatrix / u_cameraMatrix /
 *   u_cameraPos / u_skyBoxSize / u_scaleByDepth。
 *
 * 各材质顶点/片段着色器通过字符串拼接复用本片段，避免 struct 重复声明。
 */
export const cameraUniformsWGSL = `
struct CameraUniforms {
    u_projectionMatrix: mat4x4<f32>,
    u_viewProjection: mat4x4<f32>,
    u_viewMatrix: mat4x4<f32>,
    u_cameraMatrix: mat4x4<f32>,
    u_cameraPos: vec3<f32>,
    u_skyBoxSize: f32,
    u_scaleByDepth: f32,
}

@group(0) @binding(1) var<uniform> cameraUniforms: CameraUniforms;
`;
