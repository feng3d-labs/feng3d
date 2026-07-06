import { logic } from '@feng3d/reactivity';
import { Frustum, Matrix4x4, Ray3, Vector2, Vector3 } from '@feng3d/math';
import { effect, reactive } from '@feng3d/reactivity';
import { serialization } from '@feng3d/serialization';
import { ComponentLogic, componentLogic, registerComponentLogic } from '../component/componentLogic';
import { transformLogic } from '../core/transformLogic';
import { Camera } from './Camera';
import { LensBase } from './lenses/LensBase';
import { OrthographicLens } from './lenses/OrthographicLens';
import { PerspectiveLens } from './lenses/PerspectiveLens';
import { Projection } from './Projection';

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
    /** 收集相机 uniform */
    getUniforms(): CameraUniforms;
}

/**
 * 获取 Camera 的 logic（委托给统一 logic 入口）。
 */
export function cameraLogic(camera: Camera): CameraLogic
{
    return logic<CameraLogic>(camera);
}

function createCameraLogic(camera: Camera): CameraLogic
{
    let _viewProjection = new Matrix4x4();
    let _viewProjectionInvalid = true;
    let _backups = { fov: 60, size: 1 };
    let _frustum = new Frustum();
    let _frustumInvalid = true;
    let _inited = false;

    function invalidateViewProjection(): void
    {
        _viewProjectionInvalid = true;
        _frustumInvalid = true;
    }

    function getLens(): LensBase
    {
        // 读取响应式属性建立依赖，返回原始实例以保留类型
        reactive(camera).lens;

        return camera.lens;
    }

    const logic: CameraLogic = {
        object3D: null as any,
        get lens() { return getLens(); },
        set lens(v)
        {
            const r_camera = reactive(camera);
            if (r_camera.lens === v) return;

            if (r_camera.lens)
            {
                r_camera.lens.off('lensChanged', invalidateViewProjection, logic);
            }
            r_camera.lens = v;
            if (r_camera.lens)
            {
                r_camera.lens.on('lensChanged', invalidateViewProjection, logic);
            }

            invalidateViewProjection();

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
            if (_viewProjectionInvalid)
            {
                // 场景空间转摄像机空间
                _viewProjection.copy(transformLogic(logic.object3D).world2local.value);
                // +摄像机空间转投影空间 = 场景空间转投影空间
                _viewProjection.append(getLens().matrix);
                _viewProjectionInvalid = false;
            }

            return _viewProjection;
        },
        get frustum()
        {
            if (_frustumInvalid)
            {
                _frustum.fromMatrix(logic.viewProjection);
                _frustumInvalid = false;
            }

            return _frustum;
        },
        init()
        {
            if (_inited) return;
            _inited = true;
            if (!getLens())
            {
                logic.lens = new PerspectiveLens();
            }
            // 通过响应式 effect 监听 local2world 与 lens 变化，使 viewProjection 失效
            effect(() =>
            {
                transformLogic(logic.object3D).local2world.value;
                getLens();
                invalidateViewProjection();
            });
        },
        beforeRender() { /* Camera 无 beforeRender，uniform 由 ForwardRenderer 注入 */ },
        getRay3D(x: number, y: number, ray3D = new Ray3()): Ray3
        {
            return getLens().unprojectRay(x, y, ray3D).applyMatri4x4(transformLogic(logic.object3D).local2world.value);
        },
        project(point3d: Vector3): Vector3
        {
            return getLens().project(transformLogic(logic.object3D).world2local.value.transformPoint3(point3d));
        },
        unproject(sX: number, sY: number, sZ: number, v = new Vector3()): Vector3
        {
            return transformLogic(logic.object3D).local2world.value.transformPoint3(getLens().unprojectWithDepth(sX, sY, sZ, v), v);
        },
        getScaleByDepth(depth: number, dir = new Vector2(0, 1))
        {
            const lt = logic.unproject(-0.5 * dir.x, -0.5 * dir.y, depth);
            const rb = logic.unproject(+0.5 * dir.x, +0.5 * dir.y, depth);
            const scale = lt.subTo(rb).length;

            return scale;
        },
        getUniforms()
        {
            const lens = getLens();

            return {
                u_projectionMatrix: lens.matrix,
                u_viewProjection: logic.viewProjection,
                u_viewMatrix: transformLogic(logic.object3D).world2local.value,
                u_cameraMatrix: transformLogic(logic.object3D).local2world.value,
                u_cameraPos: transformLogic(logic.object3D).worldPosition.value,
                u_skyBoxSize: lens.far / Math.sqrt(3),
                u_scaleByDepth: logic.getScaleByDepth(1),
            };
        },
        dispose()
        {
            const lens = getLens();
            if (lens)
            {
                lens.off('lensChanged', invalidateViewProjection, logic);
            }
            // logic 缓存由统一 logic() 管理，无需手动删除
        },
    };

    return logic;
}

// 注册到 componentLogic 分发表
registerComponentLogic('Camera', (component) =>
{
    return createCameraLogic(component as unknown as Camera);
});
