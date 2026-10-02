import { box3ApplyMatrix, box3Clone, box3RayIntersection, Box3, mat4TransformRay, Ray3, Vector3 } from '@feng3d/math';
import { computed, Computed, isLogicRegistered, logic as getLogic, reactive, registerLogic, UnReadonly } from '@feng3d/reactivity';
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
    /**
     * 门控渲染开关（设计 3.2.2）：true 时对象在其 isLoaded（组件 + 子树资源就绪）
     * 变为 true 前暂不渲染，就绪后自动出现。
     *
     * 默认 false——纹理类资源走占位符渐进换装（loading 期间照常渲染占位纹理），
     * 两策略互斥由消费方按资源形态选择；外联几何体（.gltf 等）适用本开关。
     */
    readonly renderWhenLoaded?: boolean;
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

    /** 已经就"数据不合法"报过警的字段（同一处只报一次，见 #reportOnce） */
    readonly #reported = new Set<'geometry' | 'material'>();

    /** 自身局部包围盒 */
    readonly #_selfLocalBounds = computed<Box3>(() =>
    {
        // 监听 geometry 变化
        // 清空引用：字段类型非可选，这里按清理语义断言（同 Animation.dispose）
        const r_renderable = reactive(this._component as Renderable) as unknown as { geometry: unknown; material: unknown };
        r_renderable.geometry;

        return getLogic(this.#resolveGeometry()).bounding;
    });

    /** 自身世界包围盒 */
    readonly #_selfWorldBounds = computed<Box3>(() =>
    {
        // 依赖 selfLocalBounds
        const localBounds = this.#_selfLocalBounds.value;

        // 阶段 C-e：`Box3` 的 class 已删除；`applyMatrixTo` = copy + 就地 applyMatrix
        const worldBounds: Box3 = { __type__: 'Box3', ...box3Clone(localBounds) };

        box3ApplyMatrix(worldBounds, getLogic(this.entity!).local2world, worldBounds);

        return worldBounds;
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
        getLogic(this.entity!).beforeRender(ro);

        // 同对象其他组件的 beforeRender（过渡期保留：Billboard/HoldSize/
        // SkinnedMeshRenderer/ParticleSystem 等待矩阵链重构后 computed 化）
        const components = (this.entity as Object3D).components ?? [];
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
        return this.#resolveDeclared((this._component as Renderable).material, 'material', 'StandardMaterial') as Materials;
    }

    /** 解析几何体（为空时 fallback 到 Cube，使 { __type__: 'MeshRenderer' } 这类
     * 省略 geometry 字段的默认组件能正常上传顶点数据并渲染） */
    #resolveGeometry(): Geometrys
    {
        return this.#resolveDeclared((this._component as Renderable).geometry, 'geometry', 'CubeGeometry') as Geometrys;
    }

    /**
     * 解析某个渲染数据字段（geometry / material），保证返回的是**能取出 logic 的纯数据**。
     *
     * ## 为什么要在这里把住，而不是信任调用方
     *
     * 这两个字段现实里会遇到三类脏数据：旧格式（`{ assetId: 'Plane', __class__: 'PlaneGeometry' }`，
     * 见 `packages/editor/resource/template/default.scene.legacy.json`）、手写字面量漏 `__type__`、
     * 类型名拼错。原先的做法是原样交给 `logic()`，于是：
     *
     * - `logic()` 返回 `null`，紧接着 `.bounding` / `.isLoaded` 抛
     *   `TypeError: Cannot read properties of null`；
     * - 这条 computed 挂在 `selfLocalBounds` 上，**包围盒与整条拾取链路陪着一起挂**
     *   （在编辑器里表现为「点了场景就报错」）；
     * - 控制台只有一句 `未注册的 __type__ 'undefined'`——既不知是哪个对象，也不知该改什么。
     *
     * 现在改成：**认得的旧格式就地兼容**（按 `__class__` 补 `__type__`，不动原数据），
     * 否则**报一次清楚的错**（点名对象与组件、说明缺什么）并回退到默认值，让渲染与拾取继续可用。
     * 回退只作用于本次解析，**不写回数据**——数据是真错的，不该被我们悄悄改掉。
     *
     * @param declared 组件上的字段值
     * @param kind 字段名（`geometry` / `material`，只用于报错）
     * @param fallbackType 缺失或不可用时的回退类型名
     * @returns 可用的纯数据对象
     */
    #resolveDeclared(declared: unknown, kind: 'geometry' | 'material', fallbackType: string): { readonly __type__: string }
    {
        if (declared === null || declared === undefined) return { __type__: fallbackType };

        const declaredType = (declared as { __type__?: unknown }).__type__;
        if (typeof declaredType === 'string' && isLogicRegistered(declaredType))
        {
            return declared as { readonly __type__: string };
        }

        // 非对象值：属性面板这类"展示文本被写回数据"的损坏正好落在这里。
        // 不能按对象去取键——`" (Object)"` 是 9 个字符，`Object.keys` 会给出 `0..8`，
        // 报出来完全指不到病根（issue #184 的现场就是这个）。
        if (typeof declared !== 'object')
        {
            this.#reportOnce(kind, `不是纯数据对象（实际是 ${typeof declared}：${JSON.stringify(declared)}）`
                + `——已回退为 ${fallbackType}（渲染与拾取照常，但这份数据需要修正）`);

            return { __type__: fallbackType };
        }

        // 旧格式兼容：`__class__` 是迁移前的类型字段（`assetId` 是旧资源系统字段，忽略）
        const legacyType = (declared as { __class__?: unknown }).__class__;
        if (typeof declaredType !== 'string' && typeof legacyType === 'string' && isLogicRegistered(legacyType))
        {
            this.#reportOnce(kind, `是旧格式数据（没有 __type__，但标了 __class__: '${legacyType}'）——`
                + `已按旧字段就地兼容；建议重新保存场景以写成新格式`);
            return { ...(declared as object), __type__: legacyType } as { readonly __type__: string };
        }

        const keys = Object.keys(declared as object);
        const reason = typeof declaredType !== 'string'
            ? `缺少 __type__（该对象的键：${keys.length > 0 ? keys.join(', ') : '(空对象)'}）`
            : `__type__ '${declaredType}' 没有注册`;
        this.#reportOnce(kind, `${reason}——已回退为 ${fallbackType}（渲染与拾取照常，但这份数据需要修正）`);

        return { __type__: fallbackType };
    }

    /**
     * 同一处数据问题**只报一次**。
     *
     * 这些解析都在 computed 里，按帧/按交互反复求值；每次都报会把控制台刷爆，
     * 而第一条已经说清了是什么、在哪个对象上。
     *
     * @param kind 字段名
     * @param detail 说明
     */
    #reportOnce(kind: 'geometry' | 'material', detail: string): void
    {
        if (this.#reported.has(kind)) return;
        this.#reported.add(kind);

        const owner = this.entity as Object3D | undefined;
        const ownerName = owner?.name ? `「${owner.name}」` : '(未知对象)';
        const componentType = (this._component as { __type__?: string }).__type__ ?? '(未知组件)';
        console.error(`[Renderable] ${ownerName} 上的 ${componentType}.${kind} 数据不合法：${detail}`);
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
        getLogic(this.entity!).beforeRender(renderObject);

        // 同对象其他组件（跳过自身）
        const components = (this.entity as Object3D).components ?? [];
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

        const rayEntryDistance = box3RayIntersection(this.#_selfLocalBounds.value, localRay.origin, localRay.direction, localNormal);
        if (rayEntryDistance === Number.MAX_VALUE)
        {
            // 未命中：返回 null（调用方按 falsy 判断；签名保持非空以兼容既有调用方）
            return null as unknown as PickingCollisionVO;
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
        // 阶段 C-d：`new Ray3()` 改成等价的纯数据字面量（原点为零向量、方向 +Z，与 `new Line3()` 默认一致）；
        // `Matrix4x4.transformRay` 的 `out` 就是它，就地写入 origin / direction 两个子对象
        const localRay: Ray3 = { __type__: 'Line3', origin: { x: 0, y: 0, z: 0 }, direction: { x: 0, y: 0, z: 1 } };

        // 阶段 C-e：`Matrix4x4.transformRay` 已删除，改用纯函数（`out` 传同一个 localRay，就地语义不变）
        mat4TransformRay(getLogic(this.entity!).world2local, worldRay, localRay);

        return this.localRayIntersection(localRay);
    }

    override dispose(): void
    {
        // 清空引用：字段类型非可选，这里按清理语义断言（同 Animation.dispose）
        const r_renderable = reactive(this._component as Renderable) as unknown as { geometry: unknown; material: unknown };
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
