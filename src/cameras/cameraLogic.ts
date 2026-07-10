import { logic as getLogic } from '@feng3d/reactivity';
import { Frustum, Matrix4x4, Ray3, Vector2, Vector3 } from '@feng3d/math';
import { Computed, computed, effect, reactive } from '@feng3d/reactivity';
import { serialization } from '@feng3d/serialization';
import { ComponentLogic, componentLogic, registerComponentLogic } from '../component/componentLogic';
import { Camera } from './Camera';
import { LensBase } from './lenses/LensBase';
import { OrthographicLens } from './lenses/OrthographicLens';
import { PerspectiveLens } from './lenses/PerspectiveLens';
import { Projection } from './Projection';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Camera: CameraLogic;
    }
}

/**
 * Camera 逻辑处理输出。
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
export interface CameraLogic extends ComponentLogic
{
    /** 镜头 */
    lens: LensBase;
    /** 投影类型 */
    projection: Projection;
    /** 场景投影矩阵 */
    readonly viewProjection: Matrix4x4;
    /** 截头锥体 */
    readonly frustum: Frustum;
    /** 获取与坐标重叠的射线 */
    getRay3D(x: number, y: number, ray3D?: Ray3): Ray3;
    /** 投影坐标 */
    project(point3d: Vector3): Vector3;
    /** 屏幕坐标投影到场景坐标 */
    unproject(sX: number, sY: number, sZ: number, v?: Vector3): Vector3;
    /** 获取指定深度处的视野尺寸 */
    getScaleByDepth(depth: number, dir?: Vector2): number;
    /** 相机 uniform（响应式 computed：依赖 viewMatrix/lens 等，相机变换变化时自动失效） */
    readonly uniforms: Computed<CameraUniforms>;
}

/**
 * 获取 Camera 的 logic（委托给统一 logic 入口）。
 */
export function cameraLogic(camera: Camera): CameraLogic
{
    return getLogic(camera);
}

function createCameraLogic(camera: Camera): CameraLogic
{
    let _backups = { fov: 60, size: 1 };
    let _inited = false;
    // lens 变化由 watcher.watch 触发 lensChanged 事件（非 @feng3d/reactivity 体系），
    // 这里用一个响应式 version 计数器桥接：lensChanged 时 +1，computed 读取它建立依赖。
    const _lensVersion = reactive({ v: 0 });

    function getLens(): LensBase
    {
        // 读取响应式属性建立依赖，返回原始实例以保留类型
        reactive(camera).lens;

        return camera.lens;
    }

    /** lensChanged 回调：自增 version，使依赖 lens 的 computed（viewProjection/frustum/uniforms）失效。 */
    function onLensChanged()
    {
        _lensVersion.v++;
    }

    // viewProjection：场景空间 → 投影空间。
    // 依赖 world2local（相机变换）+ lens.matrix + lensVersion（镜头参数变化）。
    const _viewProjection = computed<Matrix4x4>(() =>
    {
        _lensVersion.v; // 依赖 lens 变化
        const lens = getLens();
        const m = getLogic(logic.object3D).world2local.value.clone();

        return m.append(lens.matrix);
    });

    // frustum：由 viewProjection 派生。
    const _frustum = computed<Frustum>(() =>
    {
        const f = new Frustum();
        f.fromMatrix(_viewProjection.value);

        return f;
    });

    // 相机 uniform：依赖 viewProjection、viewMatrix（world2local）、cameraMatrix（local2world）、
    // worldPosition、lens 等。任一变化自动失效，上游 uniform buffer 重传。
    const _uniforms = computed<CameraUniforms>(() =>
    {
        const lens = getLens();

        return {
            u_projectionMatrix: lens.matrix,
            u_viewProjection: _viewProjection.value,
            u_viewMatrix: getLogic(logic.object3D).world2local.value,
            u_cameraMatrix: getLogic(logic.object3D).local2world.value,
            u_cameraPos: getLogic(logic.object3D).worldPosition.value,
            u_skyBoxSize: lens.far / Math.sqrt(3),
            u_scaleByDepth: logic.getScaleByDepth(1),
        };
    });

    const logic = {
        object3D: null as any,
        get lens() { return getLens(); },
        set lens(v)
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

        },
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
                serialization.setValue(_backups, lens as any);
            }
            const fov = _backups ? _backups.fov : 60;
            const size = _backups ? _backups.size : 1;
            if (v === Projection.Perspective)
            {
                logic.lens = new PerspectiveLens(fov, aspect, near, far);
            }
            else
            {
                logic.lens = new OrthographicLens(size, aspect, near, far);
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
        init()
        {
            if (_inited) return;
            _inited = true;
            if (!getLens())
            {
                logic.lens = new PerspectiveLens();
            }
            // viewProjection/frustum/uniforms 均为 computed，依赖 transformLogic 与 lensVersion，
            // 相机变换或镜头参数变化时自动失效，无需手动 effect。
        },
        beforeRender() { /* Camera 无 beforeRender，uniform 由 ForwardRenderer 注入 */ },
        getRay3D(x: number, y: number, ray3D = new Ray3()): Ray3
        {
            return getLens().unprojectRay(x, y, ray3D).applyMatri4x4(getLogic(logic.object3D).local2world.value);
        },
        project(point3d: Vector3): Vector3
        {
            return getLens().project(getLogic(logic.object3D).world2local.value.transformPoint3(point3d));
        },
        unproject(sX: number, sY: number, sZ: number, v = new Vector3()): Vector3
        {
            return getLogic(logic.object3D).local2world.value.transformPoint3(getLens().unprojectWithDepth(sX, sY, sZ, v), v);
        },
        getScaleByDepth(depth: number, dir = new Vector2(0, 1))
        {
            const lt = logic.unproject(-0.5 * dir.x, -0.5 * dir.y, depth);
            const rb = logic.unproject(+0.5 * dir.x, +0.5 * dir.y, depth);
            const scale = lt.subTo(rb).length;

            return scale;
        },
        get uniforms()
        {
            // 返回 Computed 本身：ForwardRenderer 把它作为 BufferBinding.value，
            // WGPUBufferBinding 通过 isRef 解包读取 .value，建立响应式依赖。
            return _uniforms;
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
    };

    return logic as any;
}

// 注册到 componentLogic 分发表
registerComponentLogic('Camera', (component) =>
{
    return createCameraLogic(component as unknown as Camera);
});
