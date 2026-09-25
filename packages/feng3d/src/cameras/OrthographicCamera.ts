import { Frustum, Matrix4x4, Ray3, Vector2, Vector3, Vector4 } from '@feng3d/math';
import { Computed, computed, logic as getLogic, reactive, registerLogic } from '@feng3d/reactivity';
import { Camera, CameraLogic, CameraUniforms } from './Camera';

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
 * OrthographicCamera 逻辑类。
 *
 * 继承 CameraLogic，覆写：
 * - projectionMatrix：computed，依赖 left/right/top/bottom/near/far，调 setOrtho
 * - viewProjection/frustum/uniforms：由 projectionMatrix + 相机变换派生
 * - project/unproject 用通用矩阵变换（正交投影无透视除法）
 */
export class OrthographicCameraLogic extends CameraLogic
{
    // 字段默认值（与原 OrthographicLens 默认一致）
    readonly #r_camera = reactive(this._component as OrthographicCamera);
    readonly #left = (): number => this.#r_camera.left ?? -1;
    readonly #right = (): number => this.#r_camera.right ?? 1;
    readonly #top = (): number => this.#r_camera.top ?? 1;
    readonly #bottom = (): number => this.#r_camera.bottom ?? -1;
    readonly #near = (): number => this.#r_camera.near ?? 0.3;
    readonly #far = (): number => this.#r_camera.far ?? 1000;

    /** 正交投影矩阵：依赖 left/right/top/bottom/near/far */
    readonly #_projectionMatrix: Computed<Matrix4x4> = computed<Matrix4x4>(() =>
    {
        const m = new Matrix4x4();
        m.setOrtho(this.#left(), this.#right(), this.#top(), this.#bottom(), this.#near(), this.#far());

        return m;
    });

    /** 逆投影矩阵 */
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

    protected constructor(data: OrthographicCamera)
    {
        super(data);
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: OrthographicCamera): OrthographicCameraLogic
    {
        return new OrthographicCameraLogic(data);
    }

    /** 正交投影矩阵（依赖 left/right/top/bottom/near/far） */
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

    /** 投影坐标（正交无透视除法） */
    override project(point3d: Vector3): Vector3
    {
        const camLocal = getLogic(this.entity).world2local.transformPoint3(point3d);
        const v4 = this.#_projectionMatrix.value.transformVector4(Vector4.fromVector3(camLocal, 1));

        return new Vector3(v4.x, v4.y, v4.z);
    }

    /** 通用逆投影（无透视除法）：GPU 空间 → 摄像机空间 */
    #unprojectPoint(point3d: Vector3, v = new Vector3()): Vector3
    {
        const v4 = this.#_inverseProjectionMatrix.value.transformVector4(Vector4.fromVector3(point3d, 1));
        v4.toVector3(v);

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
registerLogic('OrthographicCamera', OrthographicCameraLogic as unknown as new (data: OrthographicCamera) => OrthographicCameraLogic);
