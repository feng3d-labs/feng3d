import { Box3, Ray3, Vector3 } from '@feng3d/math';
import { computed, Computed, logic as getLogic, reactive, registerLogic, UnReadonly } from '@feng3d/reactivity';
import { BindingResources, releaseBindingResources, RenderObject } from '@feng3d/webgpu';
import { BehaviourLogic } from '../component/Behaviour';
import { Geometrys } from '../geometry/Geometry';
import { LightPicker } from '../light/pickers/LightPicker';
import { Materials } from '../materials/Material';
import { PickingCollisionVO } from '../pick/Raycaster';
import { CullFace } from '../render/data/enums';
import { shadowRenderer } from '../render/renderer/ShadowRenderer';
import type { Object3D } from './Object3D';
import { RayCastable } from './RayCastable';

/**
 * 可渲染组件（纯数据接口）。
 *
 * 渲染逻辑（renderObject computed、beforeRender 分发、射线相交、加载状态、dispose）
 * 由 RenderableLogic 提供。
 */
export interface Renderable extends RayCastable
{
    /** 几何体（缺失时由  fallback 到默认 Cube） */
    readonly geometry?: Geometrys;
    /** 材质（缺失时由 RenderableLogic fallback 到默认 Material） */
    readonly material?: Materials;
    /** 是否投射阴影（缺失时由 registerLogic 自动填充） */
    readonly castShadows?: boolean;
    /** 是否接受阴影（缺失时由 registerLogic 自动填充） */
    readonly receiveShadows?: boolean;
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Renderable: RenderableLogic;
    }
}

/**
 * Renderable 逻辑类。
 *
 * 继承 BehaviourLogic，提供：
 * - renderObject: computed<RenderObject>（构建渲染对象，注入 transform uniform）
 * - selfLocalBounds / selfWorldBounds: computed<Box3>
 * - isLoaded: computed<boolean>
 * - beforeRender: 分发到 geometry/material/lightPicker/transform/同对象其他组件
 * - baseBeforeRender: 基类 beforeRender（子类 logic 可调用后再追加自身逻辑）
 * - worldRayIntersection / localRayIntersection: 射线相交检测
 * - dispose: 清理 geometry/material 引用
 *
 * 子类 logic（如 SkinnedMeshRendererLogic）继承本类后覆写 beforeRender，
 * 先调 baseBeforeRender 再追加自身逻辑。
 */
export class RenderableLogic extends BehaviourLogic
{
    /** 光源拾取器（init 时创建，持有引用防止被 GC，光照数据由 LightPicker 内部响应式链维护） */
    #lightPicker: LightPicker | null = null;

    get lightPicker(): LightPicker | null
    {
        return this.#lightPicker;
    }

    /** 复用的渲染对象实例（懒创建，由 _renderObject computed 使用） */
    #renderObjectCache: RenderObject | null = null;

    /** 自身局部包围盒 */
    readonly #_selfLocalBounds = computed<Box3>(() =>
    {
        // 监听 geometry 变化
        const r_renderable = reactive(this._component as Renderable);
        r_renderable.geometry;

        return getLogic(this.#resolveGeometry()).bounding;
    });

    /** 自身世界包围盒 */
    readonly #_selfWorldBounds = computed<Box3>(() =>
    {
        // 依赖 selfLocalBounds
        const localBounds = this.#_selfLocalBounds.value;

        return localBounds.clone().applyMatrixTo(getLogic(this.entity).local2world);
    });

    // 渲染对象（computed，依赖 transform 与组件）
    // Geometry/Material 数据在此吸收（阶段 3d-2）：几何/材质变化只失效本对象的
    // renderObject computed，不再依赖每帧 beforeRender 重写（变更驱动）。
    readonly #_renderObject = computed<RenderObject>(() =>
    {
        const ro = this.#renderObjectCache ||= new RenderObject();

        // 初始化 bindingResources（Geometry/Material/Transform 等 beforeRender 假设已存在）
        const roWritable = ro as UnReadonly<RenderObject>;
        if (!roWritable.bindingResources) roWritable.bindingResources = {} as BindingResources;

        // Geometry：beforeRender 写入 vertices/indices/draw（computed 驱动，
        // 几何数据变化精确失效；与 Material/Object3D 的 beforeRender 同模式）
        getLogic(this.#resolveGeometry()).beforeRender(ro);

        // Material：beforeRender 写入 pipeline / material_uniforms（稳定引用）/ 纹理绑定
        // （与 Object3DLogic.beforeRender 同模式：内部经响应式读取建立依赖，
        // 材质/uniform/纹理变化 → 本 computed 失效 → beforeRender 重跑换装）
        getLogic(this.#resolveMaterial()).beforeRender(ro);

        // Transform 写入 transform uniform（稳定 binding 实例，字段级更新）
        getLogic(this.entity).beforeRender(ro);

        // 同对象其他组件的 beforeRender（过渡期保留：Billboard/HoldSize/
        // SkinnedMeshRenderer/ParticleSystem 等待矩阵链重构后 computed 化）
        const components = (this.entity as Object3D).components;
        for (const element of components)
        {
            const cl = getLogic(element);
            if (cl) cl.beforeRender(ro);
        }

        return ro;
    });

    // 是否加载完成
    readonly #_isLoaded = computed<boolean>(() => getLogic(this.#resolveMaterial()).isLoaded);

    protected constructor(data: Renderable)
    {
        super(data);
    }

    /** 内部创建入口（protected constructor 的唯一出口，供子类使用） */
    static create(data: Renderable): RenderableLogic
    {
        return new RenderableLogic(data);
    }

    /** 渲染对象（computed，依赖 transform 与组件） */
    get renderObject(): Computed<RenderObject>
    {
        return this.#_renderObject;
    }

    /** 自身局部包围盒 */
    get selfLocalBounds(): Computed<Box3>
    {
        return this.#_selfLocalBounds;
    }

    /** 自身世界包围盒 */
    get selfWorldBounds(): Computed<Box3>
    {
        return this.#_selfWorldBounds;
    }

    /** 是否加载完成（材质异步资源就绪；覆写基类，getter 内解 computed 保持响应式追踪） */
    override get isLoaded(): boolean
    {
        return this.#_isLoaded.value;
    }

    /** 解析材质（为空时 fallback 到 StandardMaterial，使 JSON 字面量可省略 material 字段） */
    #resolveMaterial(): Materials
    {
        return (this._component as Renderable).material || { __type__: 'StandardMaterial' } as Materials;
    }

    /** 解析几何体（为空时 fallback 到 Cube，使 { __type__: 'MeshRenderer' } 这类
     * 省略 geometry 字段的默认组件能正常上传顶点数据并渲染） */
    #resolveGeometry(): Geometrys
    {
        return (this._component as Renderable).geometry || { __type__: 'CubeGeometry' } as Geometrys;
    }

    /**
     * 基类 beforeRender（子类 logic 可调用后再追加自身逻辑）。
     *
     * 阶段 3d-2 后 Geometry/Material 已由 renderObject computed 变更驱动承担，
     * 本方法仅保留相机注入后时机的更新（transform 字段刷新 + 组件分发）——
     * Billboard/HoldSize/ParticleSystem 需要读取注入后的 cameraUniforms。
     * 完整退役待矩阵链重构（与声明式动画同批）。
     */
    baseBeforeRender(renderObject: RenderObject): void
    {
        // Transform 写入 transform uniform
        getLogic(this.entity).beforeRender(renderObject);

        // 同对象其他组件（跳过自身）
        const components = (this.entity as Object3D).components;
        for (const element of components)
        {
            if (element !== this._component)
            {
                const cl = getLogic(element);
                if (cl) cl.beforeRender(renderObject);
            }
        }
    }

    override beforeRender(renderObject: RenderObject): void
    {
        this.baseBeforeRender(renderObject);
    }

    override init(object3D?: Object3D): void
    {
        super.init(object3D);
        this.#lightPicker = new LightPicker(this._component as Renderable);
    }

    /** 与局部空间射线相交 */
    localRayIntersection(localRay: Ray3): PickingCollisionVO
    {
        const localNormal = new Vector3();

        const rayEntryDistance = this.#_selfLocalBounds.value.rayIntersection(localRay.origin, localRay.direction, localNormal);
        if (rayEntryDistance === Number.MAX_VALUE)
        {
            return null;
        }

        // cullFace 从 renderObject.pipeline 读取（由材质 beforeRender 写入，不暴露材质内部）
        const pipelineCullFace = this.#renderObjectCache?.pipeline?.primitive?.cullFace;
        const cullFace = pipelineCullFace === 'front' ? CullFace.FRONT
            : pipelineCullFace === 'back' ? CullFace.BACK
                : CullFace.NONE;

        const pickingCollisionVO: PickingCollisionVO = {
            object3D: this.entity as Object3D,
            localNormal,
            localRay,
            rayEntryDistance,
            rayOriginIsInsideBounds: rayEntryDistance === 0,
            geometry: this.#resolveGeometry(),
            cullFace
        };

        return pickingCollisionVO;
    }

    /** 与世界空间射线相交 */
    worldRayIntersection(worldRay: Ray3): PickingCollisionVO
    {
        const localRay = new Ray3();
        getLogic(this.entity).world2local.transformRay(worldRay, localRay);

        return this.localRayIntersection(localRay);
    }

    override dispose(): void
    {
        const r_renderable = reactive(this._component as Renderable);
        r_renderable.geometry = null;
        r_renderable.material = null;
        // 确定性释放 GPU 资源（设计 7.2）：销毁 bindingResources 名下的 WGPU 实例
        // （bindGroup 等 per renderObject 独占资源；共享资源由 GC 兜底）
        if (this.#renderObjectCache?.bindingResources)
        {
            releaseBindingResources(this.#renderObjectCache.bindingResources as Record<string, unknown>);
        }
        // 阴影 Pass 的 RenderObject 同步释放（ShadowRenderer 内部缓存，键为 renderable）
        shadowRenderer.release(this._component as Renderable);
        super.dispose();
    }
}
// 注册到分发表
registerLogic('Renderable', RenderableLogic as unknown as new (data: Renderable) => RenderableLogic);
