import { Frustum, Matrix4x4, Ray3, Vector2, Vector3 } from '@feng3d/math';
import { Computed, computed, logic as getLogic, reactive, registerLogic } from '@feng3d/reactivity';
import { Component3D, Component3DLogic, componentLogic } from '../component/Component';
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

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Camera: CameraLogic;
    }
}

/**
 * Camera 逻辑处理接口。
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
export interface CameraLogic extends Component3DLogic
{
    /** 镜头 */
    readonly lens: LensBase;
    /** 投影类型 */
    readonly projection: Projection | undefined;
    /** 场景投影矩阵 */
    readonly viewProjection: Matrix4x4;
    /** 截头锥体 */
    readonly frustum: Frustum;
    /** 相机 uniform */
    readonly uniforms: CameraUniforms;
    /** 获取与坐标重叠的射线 */
    getRay3D(x: number, y: number, ray3D?: Ray3): Ray3;
    /** 投影坐标 */
    project(point3d: Vector3): Vector3;
    /** 屏幕坐标投影到场景坐标 */
    unproject(sX: number, sY: number, sZ: number, v?: Vector3): Vector3;
    /** 获取指定深度处的视野尺寸 */
    getScaleByDepth(depth: number, dir?: Vector2): number;
}

/**
 * 创建 CameraLogic 实例（工厂函数，组合 componentLogic 基础行为）。
 */
export function cameraLogic(camera: Camera): CameraLogic
{
    const base = componentLogic(camera);

    // projection 切换时保留的上一组镜头参数（fov / 正交边界）
    let _backups = { fov: 60, left: -1, right: 1, top: 1, bottom: -1 };
    // init 去重标志
    let _inited = false;
    /**
     * lens 变化由 watcher.watch 触发 lensChanged 事件（非 @feng3d/reactivity 体系），
     * 这里用一个响应式 version 计数器桥接：lensChanged 时 +1，computed 读取它建立依赖。
     */
    const _lensVersion = reactive({ v: 0 });

    /** 读取响应式 lens 建立依赖，返回原始实例以保留类型。 */
    const getLens = (): LensBase =>
    {
        reactive(camera).lens;

        return camera.lens;
    };

    /** 设置 lens（取消旧 lens 监听，挂载新 lens 监听，触发 lensChanged） */
    const setLens = (v: LensBase): void =>
    {
        const r_camera = reactive(camera);
        if (r_camera.lens === v) return;

        if (r_camera.lens)
        {
            r_camera.lens.off('lensChanged', onLensChanged);
        }
        r_camera.lens = v;
        if (r_camera.lens)
        {
            r_camera.lens.on('lensChanged', onLensChanged);
        }

        onLensChanged();
    };

    /** lensChanged 回调：自增 version，使依赖 lens 的 computed（viewProjection/frustum/uniforms）失效。 */
    const onLensChanged = () =>
    {
        _lensVersion.v++;
    };

    // viewProjection：场景空间 → 投影空间。
    // 依赖 world2local（相机变换）+ lens.matrix + lensVersion（镜头参数变化）。
    const _viewProjection: Computed<Matrix4x4> = computed<Matrix4x4>(() =>
    {
        _lensVersion.v; // 依赖 lens 变化
        const lens = getLens();
        const m = getLogic(base.entity).world2local.clone();

        return m.append(lens.matrix);
    });

    // frustum：由 viewProjection 派生。
    const _frustum: Computed<Frustum> = computed<Frustum>(() =>
    {
        const f = new Frustum();
        f.fromMatrix(_viewProjection.value);

        return f;
    });

    /** 获取指定深度处的视野尺寸 */
    const getScaleByDepth = (depth: number, dir = new Vector2(0, 1)): number =>
    {
        const lt = unproject(-0.5 * dir.x, -0.5 * dir.y, depth);
        const rb = unproject(+0.5 * dir.x, +0.5 * dir.y, depth);
        const scale = lt.subTo(rb).length;

        return scale;
    };

    /** 屏幕坐标投影到场景坐标 */
    const unproject = (sX: number, sY: number, sZ: number, v = new Vector3()): Vector3 =>
    {
        return getLogic(base.entity).local2world.transformPoint3(getLens().unprojectWithDepth(sX, sY, sZ, v), v);
    };

    // 相机 uniform：依赖 viewProjection、viewMatrix（world2local）、cameraMatrix（local2world）、
    // worldPosition、lens 等。任一变化自动失效，上游 uniform buffer 重传。
    const _uniforms: Computed<CameraUniforms> = computed<CameraUniforms>(() =>
    {
        const lens = getLens();

        return {
            u_projectionMatrix: lens.matrix,
            u_viewProjection: _viewProjection.value,
            u_viewMatrix: getLogic(base.entity).world2local,
            u_cameraMatrix: getLogic(base.entity).local2world,
            u_cameraPos: getLogic(base.entity).worldPosition,
            u_skyBoxSize: lens.far / Math.sqrt(3),
            u_scaleByDepth: getScaleByDepth(1),
        };
    });

    return Object.assign(base, {
        get lens(): LensBase { return getLens(); },
        set lens(v: LensBase) { setLens(v); },
        get projection()
        {
            const lens = getLens();

            return lens && lens.projectionType;
        },
        set projection(v)
        {
            const lens = getLens();
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
                    _backups.fov = lens.fov ?? _backups.fov;
                }
                else if (lens instanceof OrthographicLens)
                {
                    _backups.left = lens.left ?? _backups.left;
                    _backups.right = lens.right ?? _backups.right;
                    _backups.top = lens.top ?? _backups.top;
                    _backups.bottom = lens.bottom ?? _backups.bottom;
                }
            }
            const fov = _backups ? _backups.fov : 60;
            const { left, right, top, bottom } = _backups;
            if (v === Projection.Perspective)
            {
                setLens(new PerspectiveLens(fov, aspect, near, far));
            }
            else
            {
                setLens(new OrthographicLens(left, right, top, bottom, near, far));
            }
        },
        get viewProjection()
        {
            return _viewProjection.value;
        },
        get frustum()
        {
            return _frustum.value;
        },
        init(object3D?: unknown)
        {
            base.init(object3D as Parameters<typeof base.init>[0]);
            if (_inited) return;
            _inited = true;
            if (!getLens())
            {
                setLens(new PerspectiveLens());
            }
            // viewProjection/frustum/uniforms 均为 computed，依赖 transformLogic 与 lensVersion，
            // 相机变换或镜头参数变化时自动失效，无需手动 effect。
        },
        beforeRender() { /* Camera 无 beforeRender，uniform 由 ForwardRenderer 注入 */ },
        getRay3D(x: number, y: number, ray3D = new Ray3()): Ray3
        {
            if (!base.entity) return ray3D;
            return getLens().unprojectRay(x, y, ray3D).applyMatri4x4(getLogic(base.entity).local2world);
        },
        project(point3d: Vector3): Vector3
        {
            return getLens().project(getLogic(base.entity).world2local.transformPoint3(point3d));
        },
        unproject,
        getScaleByDepth,
        get uniforms()
        {
            // 返回 Computed 本身：ForwardRenderer 把它作为 BufferBinding.value，
            // WGPUBufferBinding 通过 isRef 解包读取 .value，建立响应式依赖。
            return _uniforms.value;
        },
        dispose()
        {
            const lens = getLens();
            if (lens)
            {
                lens.off('lensChanged', onLensChanged);
            }
            // logic 缓存由统一 logic() 管理，无需手动删除
        },
    }) as unknown as CameraLogic;
}
// 注册到分发表
registerLogic('Camera', cameraLogic);

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
