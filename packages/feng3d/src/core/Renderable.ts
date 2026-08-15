import { Box3, Ray3, Vector3 } from '@feng3d/math';
import { computed, Computed, logic as getLogic, reactive, registerLogic, UnReadonly } from '@feng3d/reactivity';
import { BindingResources, releaseBindingResources, RenderObject } from '@feng3d/webgpu';
import { behaviourLogic, BehaviourLogic } from '../component/Behaviour';
import { Geometrys } from '../geometry/Geometry';
import { LightPicker } from '../light/pickers/LightPicker';
import { Materials } from '../materials/Material';
import { PickingCollisionVO } from '../pick/Raycaster';
import { CullFace } from '../render/data/enums';
import { shadowRenderer } from '../render/renderer/ShadowRenderer';
import type { Object3D } from './Object3D';
import { RayCastable } from './RayCastable';

// 触发 renderableLogic 注册到 logic 分发表

/**
 * 可渲染组件（纯数据接口）。
 *
 * 渲染逻辑（renderObject computed、beforeRender 分发、射线相交、加载状态、dispose）
 * 由 renderableLogic 提供。
 */
export interface Renderable extends RayCastable
{
    /** 几何体（缺失时由  fallback 到默认 Cube） */
    readonly geometry?: Geometrys;
    /** 材质（缺失时由 renderableLogic fallback 到默认 Material） */
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
 * Renderable 逻辑处理接口。
 *
 * 提供：
 * - renderObject: computed<RenderObject>（构建渲染对象，注入 transform uniform）
 * - selfLocalBounds / selfWorldBounds: computed<Box3>
 * - isLoaded: computed<boolean>
 * - beforeRender: 分发到 geometry/material/lightPicker/transform/同对象其他组件
 * - baseBeforeRender: 基类 beforeRender（子类 logic 可调用后再追加自身逻辑）
 * - worldRayIntersection / localRayIntersection: 射线相交检测
 * - dispose: 清理 geometry/material 引用
 *
 * 子类 logic（如 skinnedMeshRendererLogic）应组合 renderableLogic 后叠加自身 beforeRender。
 */
export interface RenderableLogic extends BehaviourLogic
{
    /** 渲染对象（computed，依赖 transform 与组件） */
    get renderObject(): Computed<RenderObject>;
    /** 自身局部包围盒 */
    get selfLocalBounds(): Computed<Box3>;
    /** 自身世界包围盒 */
    get selfWorldBounds(): Computed<Box3>;
    /** 是否加载完成（材质异步资源就绪；覆盖 ComponentLogic 基类，getter 内解 computed 保持响应式追踪） */
    get isLoaded(): boolean;
    /** 基类 beforeRender（子类 logic 可调用后再追加自身逻辑） */
    baseBeforeRender(renderObject: RenderObject): void;
    /** 与局部空间射线相交 */
    localRayIntersection(localRay: Ray3): PickingCollisionVO;
    /** 与世界空间射线相交 */
    worldRayIntersection(worldRay: Ray3): PickingCollisionVO;
}

/**
 * 创建 RenderableLogic 实例（工厂函数，组合 behaviourLogic 基础行为）。
 *
 * 子类工厂通过 `const base = renderableLogic(data)` 组合复用全部 Renderable 行为，
 * 需要叠加自身 beforeRender 时调用 `base.baseBeforeRender(...)`。
 */
export function renderableLogic(renderable: Renderable): RenderableLogic
{
    const base = behaviourLogic(renderable);

    // 默认值 accessor（缺失字段不写入原始对象）
    const r_renderable = reactive(renderable);
    const enabled = () => r_renderable.enabled ?? true;
    const castShadows = () => r_renderable.castShadows ?? true;
    const receiveShadows = () => r_renderable.receiveShadows ?? true;

    // 光源拾取器（init 时创建）
    let _lightPicker: LightPicker | null = null;
    // 复用的渲染对象实例（懒创建，由 _renderObject computed 使用）
    let _renderObjectCache: RenderObject | null = null;

    // 解析材质（为空时 fallback 到 StandardMaterial，使 JSON 字面量可省略 material 字段）
    const resolveMaterial = () => renderable.material || { __type__: 'StandardMaterial' } as Materials;

    // 解析几何体（为空时 fallback 到 Cube，使 { __type__: 'MeshRenderer' } 这类
    // 省略 geometry 字段的默认组件能正常上传顶点数据并渲染）
    const resolveGeometry = () => renderable.geometry || { __type__: 'CubeGeometry' } as Geometrys;

    // 自身局部包围盒
    const _selfLocalBounds = computed<Box3>(() =>
    {
        // 监听 geometry 变化
        const r_renderable = reactive(renderable);
        r_renderable.geometry;

        const geometry = resolveGeometry();

        return getLogic(geometry).bounding;
    });

    // 自身世界包围盒
    const _selfWorldBounds = computed<Box3>(() =>
    {
        // 依赖 selfLocalBounds
        const localBounds = _selfLocalBounds.value;

        return localBounds.clone().applyMatrixTo(getLogic(base.entity).local2world);
    });

    // 渲染对象（computed，依赖 transform 与组件）
    // Geometry/Material 数据在此吸收（阶段 3d-2）：几何/材质变化只失效本对象的
    // renderObject computed，不再依赖每帧 beforeRender 重写（变更驱动）。
    const _renderObject = computed<RenderObject>(() =>
    {
        const ro = _renderObjectCache ||= new RenderObject();

        // 初始化 bindingResources（Geometry/Material/Transform 等 beforeRender 假设已存在）
        const roWritable = ro as UnReadonly<RenderObject>;
        if (!roWritable.bindingResources) roWritable.bindingResources = {} as BindingResources;

        // Geometry：vertices/indices/draw 为 computed getter，几何数据变化精确失效
        const geometryLogic = getLogic(resolveGeometry());
        roWritable.vertices = geometryLogic.vertices;
        roWritable.indices = geometryLogic.indices;
        roWritable.draw = geometryLogic.draw;

        // Material：beforeRender 写入 pipeline / material_uniforms（稳定引用）/ 纹理绑定
        // （与 Object3DLogic.beforeRender 同模式：内部经响应式读取建立依赖，
        // 材质/uniform/纹理变化 → 本 computed 失效 → beforeRender 重跑换装）
        getLogic(resolveMaterial()).beforeRender(ro);

        // Transform 写入 transform uniform（稳定 binding 实例，字段级更新）
        getLogic(base.entity).beforeRender(ro);

        // 同对象其他组件的 beforeRender（过渡期保留：Billboard/HoldSize/
        // SkinnedMeshRenderer/ParticleSystem 等待矩阵链重构后 computed 化）
        const components = base.entity.components;
        for (const element of components)
        {
            const cl = getLogic(element);
            if (cl) cl.beforeRender(ro);
        }

        return ro;
    });

    // 是否加载完成
    const _isLoaded = computed<boolean>(() => getLogic(resolveMaterial()).isLoaded);

    /**
     * 基类 beforeRender（子类 logic 可调用后再追加自身逻辑）。
     *
     * 阶段 3d-2 后 Geometry/Material 已由 renderObject computed 变更驱动承担，
     * 本方法仅保留相机注入后时机的更新（transform 字段刷新 + 组件分发）——
     * Billboard/HoldSize/ParticleSystem 需要读取注入后的 cameraUniforms。
     * 完整退役待矩阵链重构（与声明式动画同批）。
     */
    function baseBeforeRender(renderObject: RenderObject): void
    {
        // Transform 写入 transform uniform
        getLogic(base.entity).beforeRender(renderObject);

        // 同对象其他组件（跳过自身）
        const components = base.entity.components;
        for (const element of components)
        {
            if (element !== renderable)
            {
                const cl = getLogic(element);
                if (cl) cl.beforeRender(renderObject);
            }
        }
    }

    /** 与局部空间射线相交 */
    function localRayIntersection(localRay: Ray3): PickingCollisionVO
    {
        const localNormal = new Vector3();

        const rayEntryDistance = _selfLocalBounds.value.rayIntersection(localRay.origin, localRay.direction, localNormal);
        if (rayEntryDistance === Number.MAX_VALUE)
        {
            return null;
        }

        // cullFace 从 renderObject.pipeline 读取（由材质 beforeRender 写入，不暴露材质内部）
        const pipelineCullFace = _renderObjectCache?.pipeline?.primitive?.cullFace;
        const cullFace = pipelineCullFace === 'front' ? CullFace.FRONT
            : pipelineCullFace === 'back' ? CullFace.BACK
                : CullFace.NONE;

        const pickingCollisionVO: PickingCollisionVO = {
            object3D: base.entity,
            localNormal,
            localRay,
            rayEntryDistance,
            rayOriginIsInsideBounds: rayEntryDistance === 0,
            geometry: resolveGeometry(),
            cullFace
        };

        return pickingCollisionVO;
    }

    /** 与世界空间射线相交 */
    function worldRayIntersection(worldRay: Ray3): PickingCollisionVO
    {
        const localRay = new Ray3();
        getLogic(base.entity).world2local.transformRay(worldRay, localRay);

        return localRayIntersection(localRay);
    }

    // 捕获基类方法，避免覆盖后再调用 base.init/dispose 导致递归
    const baseInit = base.init;
    const baseDispose = base.dispose;

    // 用 defineProperties 定义访问器（Object.assign 会调用 getter 一次后存为静态值，故不能用于访问器）
    Object.defineProperties(base, {
        renderObject: { get() { return _renderObject; }, enumerable: true, configurable: true },
        selfLocalBounds: { get() { return _selfLocalBounds; }, enumerable: true, configurable: true },
        selfWorldBounds: { get() { return _selfWorldBounds; }, enumerable: true, configurable: true },
        isLoaded: { get() { return _isLoaded.value; }, enumerable: true, configurable: true },
    });

    // 方法直接赋值（非访问器）
    base.init = function (object3D?: Object3D): void
    {
        baseInit.call(base, object3D);
        _lightPicker = new LightPicker(renderable);
    };
    base.beforeRender = function (renderObject: RenderObject): void
    {
        baseBeforeRender.call(base, renderObject);
    };
    // RenderableLogic 特有成员（base 当前类型为 BehaviourLogic，运行时通过 defineProperties/赋值补齐）
    const ext = base as unknown as RenderableLogic;
    ext.baseBeforeRender = baseBeforeRender;
    ext.localRayIntersection = localRayIntersection;
    ext.worldRayIntersection = worldRayIntersection;
    base.dispose = function (): void
    {
        const r_renderable = reactive(renderable);
        r_renderable.geometry = null;
        r_renderable.material = null;
        // 确定性释放 GPU 资源（设计 7.2）：销毁 bindingResources 名下的 WGPU 实例
        // （bindGroup 等 per renderObject 独占资源；共享资源由 GC 兜底）
        if (_renderObjectCache?.bindingResources)
        {
            releaseBindingResources(_renderObjectCache.bindingResources as Record<string, unknown>);
        }
        // 阴影 Pass 的 RenderObject 同步释放（ShadowRenderer 内部缓存，键为 renderable）
        shadowRenderer.release(renderable);
        baseDispose();
    };

    return base as unknown as RenderableLogic;
}
// 注册到分发表
registerLogic('Renderable', renderableLogic);
