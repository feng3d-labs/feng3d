import { validateFieldTypes } from '../core/Validate';
import { Frustum, Matrix4x4, Ray3, Vector2, Vector3, Vector4 } from '@feng3d/math';
import { Computed, computed, logic as getLogic, reactive, registerLogic } from '@feng3d/reactivity';
import { Camera, CameraLogic, CameraUniforms } from './Camera';

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
 * PerspectiveCamera 逻辑类。
 *
 * 继承 CameraLogic，覆写：
 * - projectionMatrix：computed，依赖 fov/aspect/near/far，调 setPerspectiveFromFOV
 * - viewProjection/frustum/uniforms：由 projectionMatrix + 相机变换派生
 * - project/unproject/getRay3D：透视投影需齐次除法与深度反投影
 */
export class PerspectiveCameraLogic extends CameraLogic
{
    // 字段默认值（与原 PerspectiveLens 默认一致）
    readonly #r_camera = reactive(this._component as PerspectiveCamera);
    readonly #fov = (): number => this.#r_camera.fov ?? 60;
    readonly #aspect = (): number => this.#r_camera.aspect ?? 1;
    readonly #near = (): number => this.#r_camera.near ?? 0.3;
    readonly #far = (): number => this.#r_camera.far ?? 1000;

    /** 透视投影矩阵：依赖 fov/aspect/near/far，任一变化自动重算 */
    readonly #_projectionMatrix: Computed<Matrix4x4> = computed<Matrix4x4>(() =>
    {
        const m = new Matrix4x4();
        m.setPerspectiveFromFOV(this.#fov(), this.#aspect(), this.#near(), this.#far());

        return m;
    });

    /** 逆投影矩阵（用于 unproject/unprojectRay） */
    readonly #_inverseProjectionMatrix: Computed<Matrix4x4> = computed<Matrix4x4>(() =>
        this.#_projectionMatrix.value.clone().invert());

    /** viewProjection：world2local × projectionMatrix */
    readonly #_viewProjection: Computed<Matrix4x4> = computed<Matrix4x4>(() =>
    {
        const m = getLogic(this.entity).world2local.clone();

        return m.append(this.#_projectionMatrix.value);
    });

    readonly #_frustum: Computed<Frustum> = computed<Frustum>(() =>
    {
        const f = new Frustum();
        f.fromMatrix(this.#_viewProjection.value);

        return f;
    });

    readonly #_uniforms: Computed<CameraUniforms> = computed<CameraUniforms>(() =>
    {
        return {
            u_projectionMatrix: this.#_projectionMatrix.value,
            u_viewProjection: this.#_viewProjection.value,
            u_viewMatrix: getLogic(this.entity).world2local,
            u_cameraMatrix: getLogic(this.entity).local2world,
            u_cameraPos: getLogic(this.entity).worldPosition,
            u_skyBoxSize: this.#far() / Math.sqrt(3),
            u_scaleByDepth: this.getScaleByDepth(1),
        };
    });

    protected constructor(data: PerspectiveCamera)
    {
        validateFieldTypes(data, { fov: 'number', aspect: 'number', near: 'number', far: 'number' }, 'PerspectiveCamera');
        super(data);
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: PerspectiveCamera): PerspectiveCameraLogic
    {
        return new PerspectiveCameraLogic(data);
    }

    /** 透视投影矩阵（依赖 fov/aspect/near/far） */
    override get projectionMatrix(): Matrix4x4
    {
        return this.#_projectionMatrix.value;
    }

    /** 场景投影矩阵 = world2local × projectionMatrix */
    override get viewProjection(): Matrix4x4
    {
        return this.#_viewProjection.value;
    }

    /** 截头锥体 */
    override get frustum(): Frustum
    {
        return this.#_frustum.value;
    }

    /** 相机 uniform */
    override get uniforms(): CameraUniforms
    {
        return this.#_uniforms.value;
    }

    /** 投影坐标（透视齐次除法） */
    override project(point3d: Vector3): Vector3
    {
        const camLocal = getLogic(this.entity).world2local.transformPoint3(point3d);
        const v4 = this.#_projectionMatrix.value.transformVector4(Vector4.fromVector3(camLocal, 1));
        v4.scale(1 / v4.w);

        return new Vector3(v4.x, v4.y, v4.z);
    }

    /** 透视逆投影：GPU 空间 → 摄像机空间（带深度反投影，照搬原 PerspectiveLens.unproject） */
    #unprojectPoint(point3d: Vector3, v = new Vector3()): Vector3
    {
        const p4 = Vector4.fromVector3(point3d, 1);
        const inv = this.#_inverseProjectionMatrix.value;
        const v4 = inv.transformVector4(p4);
        const sZ = 1 / v4.w;
        const p44 = p4.scaleTo(sZ);
        const v44 = inv.transformVector4(p44);
        v44.toVector3(v);

        return v;
    }

    /** 屏幕坐标（GPU 空间 NDC）→ 摄像机空间射线（不含相机世界变换） */
    #unprojectRay(x: number, y: number, ray = new Ray3()): Ray3
    {
        const p0 = this.#unprojectPoint(new Vector3(x, y, 0));
        const p1 = this.#unprojectPoint(new Vector3(x, y, 1));
        ray.fromPosAndDir(p0, p1.sub(p0));
        const sp = ray.getPointWithZ(0);
        ray.origin = sp;

        return ray;
    }

    /** 屏幕坐标投影到场景坐标（带相机世界变换） */
    override unproject(sX: number, sY: number, sZ: number, v = new Vector3()): Vector3
    {
        return getLogic(this.entity).local2world.transformPoint3(this.#unprojectRay(sX, sY).getPointWithZ(sZ, v), v);
    }

    /** 获取与坐标重叠的射线 */
    override getRay3D(x: number, y: number, ray3D = new Ray3()): Ray3
    {
        if (!this.entity) return ray3D;

        return this.#unprojectRay(x, y, ray3D).applyMatri4x4(getLogic(this.entity).local2world);
    }

    /** 获取指定深度处的视野尺寸 */
    override getScaleByDepth(depth: number, dir = new Vector2(0, 1)): number
    {
        const lt = this.unproject(-0.5 * dir.x, -0.5 * dir.y, depth);
        const rb = this.unproject(+0.5 * dir.x, +0.5 * dir.y, depth);

        return lt.subTo(rb).length;
    }
}
registerLogic('PerspectiveCamera', PerspectiveCameraLogic as unknown as new (data: PerspectiveCamera) => PerspectiveCameraLogic);
