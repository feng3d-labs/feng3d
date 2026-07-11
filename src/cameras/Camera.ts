import { Component, ComponentLogic } from '../component/Component';
import type { LensBase } from './lenses/LensBase';
import { registerDefaults, registerLogic, logic as getLogic, Computed, computed, effect, reactive } from '@feng3d/reactivity';
import { Frustum, Matrix4x4, Ray3, Vector2, Vector3 } from '@feng3d/math';
import { serialization } from '@feng3d/serialization';
import { OrthographicLens } from './lenses/OrthographicLens';
import { PerspectiveLens } from './lenses/PerspectiveLens';
import { Projection } from './Projection';

import './Camera';

declare module '@feng3d/webgpu'
{
    export interface BindingResources
    {
        cameraUniforms: any;
    }
}

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
export interface Camera extends Component
{
    readonly __type__: 'Camera';
    lens?: LensBase;
}

/**
 * Camera 默认值模板。
 *
 * 注意：lens 默认值无法静态确定（需 new PerspectiveLens），故不放入 defaults，
 * 由 cameraLogic 在 init 时按需创建。
 */
const cameraDefaults = {
    __type__: 'Camera',
};

registerDefaults('Camera', cameraDefaults);

/**
 * 创建 Camera 实例。
 */
export function createCamera(): Camera
{
    return {
        __type__: 'Camera',
        lens: null as any,
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
export class CameraLogic extends ComponentLogic
{
    /** projection 切换时保留的上一组镜头参数（fov/size） */
    private _backups = { fov: 60, size: 1 };
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
            const m = getLogic(this.object3D).world2local.value.clone();

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
                u_viewMatrix: getLogic(this.object3D).world2local.value,
                u_cameraMatrix: getLogic(this.object3D).local2world.value,
                u_cameraPos: getLogic(this.object3D).worldPosition.value,
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
            serialization.setValue(this._backups, lens as any);
        }
        const fov = this._backups ? this._backups.fov : 60;
        const size = this._backups ? this._backups.size : 1;
        if (v === Projection.Perspective)
        {
            this.lens = new PerspectiveLens(fov, aspect, near, far);
        }
        else
        {
            this.lens = new OrthographicLens(size, aspect, near, far);
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
        if (!this.object3D) return ray3D;
        return this.getLens().unprojectRay(x, y, ray3D).applyMatri4x4(getLogic(this.object3D).local2world.value);
    }

    /** 投影坐标 */
    project(point3d: Vector3): Vector3
    {
        return this.getLens().project(getLogic(this.object3D).world2local.value.transformPoint3(point3d));
    }

    /** 屏幕坐标投影到场景坐标 */
    unproject(sX: number, sY: number, sZ: number, v = new Vector3()): Vector3
    {
        return getLogic(this.object3D).local2world.value.transformPoint3(this.getLens().unprojectWithDepth(sX, sY, sZ, v), v);
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
    get uniforms(): Computed<CameraUniforms>
    {
        // 返回 Computed 本身：ForwardRenderer 把它作为 BufferBinding.value，
        // WGPUBufferBinding 通过 isRef 解包读取 .value，建立响应式依赖。
        return this._uniforms;
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

/**
 * 获取 Camera 的 logic（委托给统一 logic 入口，与 initComponent 共享同一实例）。
 */
export function cameraLogic(camera: Camera): CameraLogic
{
    return getLogic(camera);
}

// 注册到分发表
registerLogic('Camera', (component) =>
{
    return new CameraLogic(component as unknown as Camera);
});
