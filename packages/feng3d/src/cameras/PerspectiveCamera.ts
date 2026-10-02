import { validateFieldTypes } from '../core/Validate';
import { Frustum, Matrix4x4, Ray3, Vector2Like, Vector3, Vector3Like, WritableVector3Like, frustumFromMatrix, line3FromPosAndDir, line3GetPointWithZ, vec3Length, vec3Sub, vec4FromVector3, vec4ToVector3, mat4Append, mat4Copy, mat4Invert, mat4SetPerspectiveFromFOV, mat4TransformPoint3, mat4TransformRay, mat4TransformVector4, vec4ScaleNumber } from '@feng3d/math';
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
        const m: Matrix4x4 = { __type__: 'Matrix4x4', ...mat4SetPerspectiveFromFOV(this.#fov(), this.#aspect(), this.#near(), this.#far()) };

        return m;
    });

    /** 逆投影矩阵（用于 unproject/unprojectRay） */
    readonly #_inverseProjectionMatrix: Computed<Matrix4x4> = computed<Matrix4x4>(() =>
    {
        const m: Matrix4x4 = { __type__: 'Matrix4x4', ...mat4Invert(this.#_projectionMatrix.value) };

        return m;
    });

    /** viewProjection：world2local × projectionMatrix */
    readonly #_viewProjection: Computed<Matrix4x4> = computed<Matrix4x4>(() =>
    {
        const m: Matrix4x4 = { __type__: 'Matrix4x4', ...mat4Copy(getLogic(this.entity!).world2local) };

        mat4Append(m, this.#_projectionMatrix.value, m);

        return m;
    });

    readonly #_frustum: Computed<Frustum> = computed<Frustum>(() =>
        // Frustum 现在是纯数据接口（带 `__type__`），`frustumFromMatrix` 产出的是
        // `WritableFrustumLike`——缺的判别字段在这里显式补上
        ({ __type__: 'Frustum', ...frustumFromMatrix(this.#_viewProjection.value) }));

    readonly #_uniforms: Computed<CameraUniforms> = computed<CameraUniforms>(() =>
    {
        return {
            u_projectionMatrix: this.#_projectionMatrix.value,
            u_viewProjection: this.#_viewProjection.value,
            u_viewMatrix: getLogic(this.entity!).world2local,
            u_cameraMatrix: getLogic(this.entity!).local2world,
            u_cameraPos: getLogic(this.entity!).worldPosition,
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
    override project(point3d: Vector3Like): Vector3
    {
        // 走纯函数层：它的入参已是 Vector3Like，本方法才能真正接受 { x, y, z } 字面量。
        // （class 方法 world2local.transformPoint3 的入参放宽在并行的 #134 B3。）
        const camLocal = { x: 0, y: 0, z: 0 };
        mat4TransformPoint3(getLogic(this.entity!).world2local, point3d, camLocal);
        const v4 = { x: 0, y: 0, z: 0, w: 0 };
        mat4TransformVector4(this.#_projectionMatrix.value, vec4FromVector3(camLocal, 1), v4);
        vec4ScaleNumber(v4, 1 / v4.w, v4);

        return { __type__: 'Vector3', x: v4.x, y: v4.y, z: v4.z };
    }

    /** 透视逆投影：GPU 空间 → 摄像机空间（带深度反投影，照搬原 PerspectiveLens.unproject） */
    #unprojectPoint(point3d: Vector3Like, v: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
    {
        const p4 = vec4FromVector3(point3d, 1);
        const inv = this.#_inverseProjectionMatrix.value;
        const v4 = { x: 0, y: 0, z: 0, w: 0 };
        mat4TransformVector4(inv, p4, v4);
        const sZ = 1 / v4.w;
        const p44 = vec4ScaleNumber(p4, sZ);
        const v44 = { x: 0, y: 0, z: 0, w: 0 };
        mat4TransformVector4(inv, p44, v44);
        vec4ToVector3(v44, v);

        return v;
    }

    /** 屏幕坐标（GPU 空间 NDC）→ 摄像机空间射线（不含相机世界变换） */
    #unprojectRay(x: number, y: number, ray: Ray3 = { __type__: 'Line3', origin: { x: 0, y: 0, z: 0 }, direction: { x: 0, y: 0, z: 1 } }): Ray3
    {
        const p0 = this.#unprojectPoint({ x: x, y: y, z: 0 });
        const p1 = this.#unprojectPoint({ x: x, y: y, z: 1 });

        // 阶段 C-d：`Line3` 的 class 已删除，实例方法换成同义的纯函数
        // （`out` 传同一个 ray，就地语义与原来的 `ray.fromPosAndDir(...)` / `ray.origin = ...` 一致）
        line3FromPosAndDir(p0, vec3Sub(p1, p0), ray);
        line3GetPointWithZ(ray, 0, ray.origin);

        return ray;
    }

    /**
     * 屏幕坐标投影到场景坐标（带相机世界变换）。
     *
     * `v` 可选：传 `Vector3` 实例时返回同一实例（返回类型仍是 `Vector3`），
     * 传普通 `{ x, y, z }` 对象时原样返回它（返回类型为 `WritableVector3Like`）。
     */
    override unproject(sX: number, sY: number, sZ: number): Vector3;
    override unproject(sX: number, sY: number, sZ: number, v: Vector3): Vector3;
    override unproject(sX: number, sY: number, sZ: number, v: WritableVector3Like): WritableVector3Like;
    override unproject(sX: number, sY: number, sZ: number, v: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
    {
        // 与 `local2world.transformPoint3(ray.getPointWithZ(sZ, v), v)` 等价：
        // 两步都就地写回 v，只是一律走纯函数层，v 才允许是普通字面量。
        line3GetPointWithZ(this.#unprojectRay(sX, sY), sZ, v);
        mat4TransformPoint3(getLogic(this.entity!).local2world, v, v);

        return v;
    }

    /** 获取与坐标重叠的射线 */
    override getRay3D(x: number, y: number, ray3D: Ray3 = { __type__: 'Line3', origin: { x: 0, y: 0, z: 0 }, direction: { x: 0, y: 0, z: 1 } }): Ray3
    {
        if (!this.entity) return ray3D;

        // 阶段 C-d：`ray.applyMatri4x4(local2world)` 的等价纯函数形态
        // （origin 按点变换、direction 按向量变换），返回 ray 本身保证返回类型不退化（P8c）
        const ray = this.#unprojectRay(x, y, ray3D);

        mat4TransformRay(getLogic(this.entity!).local2world, ray, ray);

        return ray;
    }

    /** 获取指定深度处的视野尺寸 */
    override getScaleByDepth(depth: number, dir: Vector2Like = { x: 0, y: 1 }): number
    {
        const lt = this.unproject(-0.5 * dir.x, -0.5 * dir.y, depth);
        const rb = this.unproject(+0.5 * dir.x, +0.5 * dir.y, depth);

        return vec3Length(vec3Sub(lt, rb));
    }
}
registerLogic('PerspectiveCamera', PerspectiveCameraLogic as unknown as new (data: PerspectiveCamera) => PerspectiveCameraLogic);
