import { Frustum, Matrix4x4, Ray3, Vector2, Vector3, Vector4 } from '@feng3d/math';
import { Computed, computed, logic as getLogic, reactive, registerLogic, UnReadonly } from '@feng3d/reactivity';
import { Camera, CameraLogic, cameraLogic } from './Camera';

// 引入全局 CameraUniforms 类型声明
import '../render/data/Uniform';

declare module '../component/Component'
{
    export interface ComponentMap
    {
        PerspectiveCamera: PerspectiveCamera;
    }
}

/**
 * PerspectiveCamera（纯数据接口）。
 *
 * 透视投影相机，内联 fov/aspect/near/far 字段，取代旧的 Camera + PerspectiveLens 组合。
 * 投影矩阵由 logic 用 computed 依赖这些字段自动重算（无需 LensBase/EventEmitter）。
 */
export interface PerspectiveCamera extends Camera
{
    readonly __type__: 'PerspectiveCamera';
    /** 垂直视角（度），取值范围 [1,179]，默认 60 */
    readonly fov: number;
    /** 宽高比（width/height），默认 1 */
    readonly aspect: number;
    /** 近裁剪面距离，默认 0.3 */
    readonly near: number;
    /** 远裁剪面距离，默认 1000 */
    readonly far: number;
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        PerspectiveCamera: PerspectiveCameraLogic;
    }
}

/**
 * PerspectiveCamera 逻辑处理接口。
 *
 * 组合 {@link cameraLogic}，额外：
 * - projectionMatrix：computed，依赖 fov/aspect/near/far，调 setPerspectiveFromFOV
 * - 覆写 viewProjection/frustum/uniforms（用自身 projectionMatrix 替代 lens.matrix）
 * - 覆写 project/unproject/getRay3D（透视投影需齐次除法与深度反投影）
 */
export interface PerspectiveCameraLogic extends CameraLogic
{
    /** 透视投影矩阵（依赖 fov/aspect/near/far） */
    get projectionMatrix(): Matrix4x4;
}

/**
 * 创建 PerspectiveCameraLogic 实例（工厂函数，组合 cameraLogic 基础行为）。
 */
export function perspectiveCameraLogic(camera: PerspectiveCamera): PerspectiveCameraLogic
{
    const base = cameraLogic(camera);

    // 字段默认值（缺失时填充，与原 PerspectiveLens 默认一致）
    const writable = camera as UnReadonly<PerspectiveCamera>;
    if (camera.fov === undefined) writable.fov = 60;
    if (camera.aspect === undefined) writable.aspect = 1;
    if (camera.near === undefined) writable.near = 0.3;
    if (camera.far === undefined) writable.far = 1000;

    // 透视投影矩阵：依赖 fov/aspect/near/far，任一变化自动重算
    const _projectionMatrix: Computed<Matrix4x4> = computed<Matrix4x4>(() =>
    {
        const r_cam = reactive(camera);
        const m = new Matrix4x4();
        m.setPerspectiveFromFOV(r_cam.fov, r_cam.aspect, r_cam.near, r_cam.far);

        return m;
    });

    // 逆投影矩阵（用于 unproject/unprojectRay）
    const _inverseProjectionMatrix: Computed<Matrix4x4> = computed<Matrix4x4>(() =>
        _projectionMatrix.value.clone().invert());

    // 覆写 viewProjection：world2local × projectionMatrix
    const _viewProjection: Computed<Matrix4x4> = computed<Matrix4x4>(() =>
    {
        const m = getLogic(base.entity).world2local.clone();

        return m.append(_projectionMatrix.value);
    });

    // 覆写 frustum
    const _frustum: Computed<Frustum> = computed<Frustum>(() =>
    {
        const f = new Frustum();
        f.fromMatrix(_viewProjection.value);

        return f;
    });

    // 获取指定深度处的视野尺寸
    const getScaleByDepth = (depth: number, dir = new Vector2(0, 1)): number =>
    {
        const lt = unproject(-0.5 * dir.x, -0.5 * dir.y, depth);
        const rb = unproject(+0.5 * dir.x, +0.5 * dir.y, depth);

        return lt.subTo(rb).length;
    };

    /** 透视逆投影：GPU 空间 → 摄像机空间（带深度反投影，照搬原 PerspectiveLens.unproject） */
    const unprojectPoint = (point3d: Vector3, v = new Vector3()): Vector3 =>
    {
        const p4 = Vector4.fromVector3(point3d, 1);
        const inv = _inverseProjectionMatrix.value;
        const v4 = inv.transformVector4(p4);
        const sZ = 1 / v4.w;
        const p44 = p4.scaleTo(sZ);
        const v44 = inv.transformVector4(p44);
        v44.toVector3(v);

        return v;
    };

    /** 屏幕坐标（GPU 空间 NDC）→ 摄像机空间射线，再变换到世界空间 */
    const unprojectRay = (x: number, y: number, ray = new Ray3()): Ray3 =>
    {
        const p0 = unprojectPoint(new Vector3(x, y, 0));
        const p1 = unprojectPoint(new Vector3(x, y, 1));
        ray.fromPosAndDir(p0, p1.sub(p0));
        const sp = ray.getPointWithZ(0);
        ray.origin = sp;

        return ray;
    };

    /** 屏幕坐标投影到场景坐标（带相机世界变换） */
    const unproject = (sX: number, sY: number, sZ: number, v = new Vector3()): Vector3 =>
        getLogic(base.entity).local2world.transformPoint3(unprojectRay(sX, sY).getPointWithZ(sZ, v), v);

    // 覆写 uniforms：u_projectionMatrix/u_skyBoxSize 用自身字段
    const _uniforms: Computed<CameraUniforms> = computed<CameraUniforms>(() =>
    {
        const r_cam = reactive(camera);

        return {
            u_projectionMatrix: _projectionMatrix.value,
            u_viewProjection: _viewProjection.value,
            u_viewMatrix: getLogic(base.entity).world2local,
            u_cameraMatrix: getLogic(base.entity).local2world,
            u_cameraPos: getLogic(base.entity).worldPosition,
            u_skyBoxSize: r_cam.far / Math.sqrt(3),
            u_scaleByDepth: getScaleByDepth(1),
        };
    });

    // 用 defineProperties 覆写基类的访问器
    Object.defineProperties(base, {
        projectionMatrix: { get(): Matrix4x4 { return _projectionMatrix.value; }, enumerable: true, configurable: true },
        viewProjection: { get(): Matrix4x4 { return _viewProjection.value; }, enumerable: true, configurable: true },
        frustum: { get(): Frustum { return _frustum.value; }, enumerable: true, configurable: true },
        uniforms: { get(): CameraUniforms { return _uniforms.value; }, enumerable: true, configurable: true },
    });

    // 覆写 project（透视齐次除法）
    (base as unknown as Record<string, unknown>).project = function (point3d: Vector3): Vector3
    {
        const camLocal = getLogic(base.entity).world2local.transformPoint3(point3d);
        const v4 = _projectionMatrix.value.transformVector4(Vector4.fromVector3(camLocal, 1));
        v4.scale(1 / v4.w);

        return new Vector3(v4.x, v4.y, v4.z);
    };
    (base as unknown as Record<string, unknown>).unproject = unproject;
    (base as unknown as Record<string, unknown>).getRay3D = function (x: number, y: number, ray3D = new Ray3()): Ray3
    {
        if (!base.entity) return ray3D;

        return unprojectRay(x, y, ray3D).applyMatri4x4(getLogic(base.entity).local2world);
    };
    (base as unknown as Record<string, unknown>).getScaleByDepth = getScaleByDepth;

    return base as unknown as PerspectiveCameraLogic;
}
registerLogic('PerspectiveCamera', perspectiveCameraLogic);
