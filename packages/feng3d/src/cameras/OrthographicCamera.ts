import { Frustum, Matrix4x4, Ray3, Vector2, Vector3, Vector4 } from '@feng3d/math';
import { Computed, computed, logic as getLogic, reactive, registerLogic, UnReadonly } from '@feng3d/reactivity';
import { Camera, CameraLogic, cameraLogic } from './Camera';

// 引入全局 CameraUniforms 类型声明
import '../render/data/Uniform';

declare module '../component/Component'
{
    export interface ComponentMap
    {
        OrthographicCamera: OrthographicCamera;
    }
}

/**
 * OrthographicCamera（纯数据接口）。
 *
 * 正交投影相机，内联 left/right/top/bottom/near/far 字段，取代旧的 Camera + OrthographicLens 组合。
 * 适用于阴影、UI、2D 渲染等无透视缩放的场景。
 */
export interface OrthographicCamera extends Camera
{
    readonly __type__: 'OrthographicCamera';
    /** 可视空间左边界，默认 -1 */
    readonly left: number;
    /** 可视空间右边界，默认 1 */
    readonly right: number;
    /** 可视空间上边界，默认 1 */
    readonly top: number;
    /** 可视空间下边界，默认 -1 */
    readonly bottom: number;
    /** 近裁剪面距离，默认 0.3 */
    readonly near: number;
    /** 远裁剪面距离，默认 1000 */
    readonly far: number;
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        OrthographicCamera: OrthographicCameraLogic;
    }
}

/**
 * OrthographicCamera 逻辑处理接口。
 *
 * 组合 {@link cameraLogic}，额外：
 * - projectionMatrix：computed，依赖 left/right/top/bottom/near/far，调 setOrtho
 * - 覆写 viewProjection/frustum/uniforms（用自身 projectionMatrix 替代 lens.matrix）
 * - project/unproject 用通用矩阵变换（正交投影无透视除法）
 */
export interface OrthographicCameraLogic extends CameraLogic
{
    /** 正交投影矩阵（依赖 left/right/top/bottom/near/far） */
    get projectionMatrix(): Matrix4x4;
}

/**
 * 创建 OrthographicCameraLogic 实例（工厂函数，组合 cameraLogic 基础行为）。
 */
export function orthographicCameraLogic(camera: OrthographicCamera): OrthographicCameraLogic
{
    const base = cameraLogic(camera);

    // 字段默认值（缺失时填充，与原 OrthographicLens 默认一致）
    const writable = camera as UnReadonly<OrthographicCamera>;
    if (camera.left === undefined) writable.left = -1;
    if (camera.right === undefined) writable.right = 1;
    if (camera.top === undefined) writable.top = 1;
    if (camera.bottom === undefined) writable.bottom = -1;
    if (camera.near === undefined) writable.near = 0.3;
    if (camera.far === undefined) writable.far = 1000;

    // 正交投影矩阵：依赖 left/right/top/bottom/near/far
    const _projectionMatrix: Computed<Matrix4x4> = computed<Matrix4x4>(() =>
    {
        const r_cam = reactive(camera);
        const m = new Matrix4x4();
        m.setOrtho(r_cam.left, r_cam.right, r_cam.top, r_cam.bottom, r_cam.near, r_cam.far);

        return m;
    });

    // 逆投影矩阵
    const _inverseProjectionMatrix: Computed<Matrix4x4> = computed<Matrix4x4>(() =>
        _projectionMatrix.value.clone().invert());

    // 覆写 viewProjection
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

    // 通用逆投影（无透视除法）：GPU 空间 → 摄像机空间
    const unprojectPoint = (point3d: Vector3, v = new Vector3()): Vector3 =>
    {
        const v4 = _inverseProjectionMatrix.value.transformVector4(Vector4.fromVector3(point3d, 1));
        v4.toVector3(v);

        return v;
    };

    const unprojectRay = (x: number, y: number, ray = new Ray3()): Ray3 =>
    {
        const p0 = unprojectPoint(new Vector3(x, y, 0));
        const p1 = unprojectPoint(new Vector3(x, y, 1));
        ray.fromPosAndDir(p0, p1.sub(p0));
        const sp = ray.getPointWithZ(0);
        ray.origin = sp;

        return ray;
    };

    const getScaleByDepth = (depth: number, dir = new Vector2(0, 1)): number =>
    {
        const lt = unproject(-0.5 * dir.x, -0.5 * dir.y, depth);
        const rb = unproject(+0.5 * dir.x, +0.5 * dir.y, depth);

        return lt.subTo(rb).length;
    };

    const unproject = (sX: number, sY: number, sZ: number, v = new Vector3()): Vector3 =>
        getLogic(base.entity).local2world.transformPoint3(unprojectRay(sX, sY).getPointWithZ(sZ, v), v);

    // 覆写 uniforms
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

    Object.defineProperties(base, {
        projectionMatrix: { get(): Matrix4x4 { return _projectionMatrix.value; }, enumerable: true, configurable: true },
        viewProjection: { get(): Matrix4x4 { return _viewProjection.value; }, enumerable: true, configurable: true },
        frustum: { get(): Frustum { return _frustum.value; }, enumerable: true, configurable: true },
        uniforms: { get(): CameraUniforms { return _uniforms.value; }, enumerable: true, configurable: true },
    });

    // 正交 project（无透视除法）
    (base as unknown as Record<string, unknown>).project = function (point3d: Vector3): Vector3
    {
        const camLocal = getLogic(base.entity).world2local.transformPoint3(point3d);
        const v4 = _projectionMatrix.value.transformVector4(Vector4.fromVector3(camLocal, 1));

        return new Vector3(v4.x, v4.y, v4.z);
    };
    (base as unknown as Record<string, unknown>).unproject = unproject;
    (base as unknown as Record<string, unknown>).getRay3D = function (x: number, y: number, ray3D = new Ray3()): Ray3
    {
        if (!base.entity) return ray3D;

        return unprojectRay(x, y, ray3D).applyMatri4x4(getLogic(base.entity).local2world);
    };
    (base as unknown as Record<string, unknown>).getScaleByDepth = getScaleByDepth;

    return base as unknown as OrthographicCameraLogic;
}
registerLogic('OrthographicCamera', orthographicCameraLogic);
