import { Geometry, Geometrys } from '../geometry/Geometry';
import { getDefaultGeometry } from '../geometry/Geometry';
import { Material, Materials } from '../materials/Material';
import { getDefaultMaterial } from '../materials/Material';
import { RayCastable, createRayCastable } from './RayCastable';
import { registerDefaults, registerLogic, logic as getLogic, computed, Computed, reactive } from '@feng3d/reactivity';
import { Box3, Ray3, Vector3 } from '@feng3d/math';
import { RenderObject } from '@feng3d/webgpu';
import { BehaviourLogic } from '../component/Behaviour';
import type { Object3D } from './Object3D';
import type { Camera } from '../cameras/Camera';
import type { Scene } from '../scene/Scene';
import { CullFace } from '../render/data/enums';
import { LightPicker } from '../light/pickers/LightPicker';

// 触发 renderableLogic 注册到 logic 分发表
import './Renderable';

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
    /** 是否投射阴影（缺失时由 registerDefaults 自动填充） */
    readonly castShadows?: boolean;
    /** 是否接受阴影（缺失时由 registerDefaults 自动填充） */
    readonly receiveShadows?: boolean;
}

/**
 * Renderable 默认值模板。
 *
 * 注意：geometry/material 是重量级对象（含默认 Geometry/Material），
 * registerDefaults 在字段缺失时通过函数返回新实例，避免无谓创建。
 * 但为了避免在 registerDefaults 注册期触发循环依赖（getDefaultGeometry 依赖 materialLogic 已注册），
 * 这里把 geometry/material 默认值留空（undefined），由 renderableLogic 在使用时按需 fallback。
 */
const renderableDefaults = {
    __type__: 'Renderable',
    enabled: true,
    castShadows: true,
    receiveShadows: true,
};

registerDefaults('Renderable', renderableDefaults);

/**
 * 创建 Renderable 实例。
 */
export function createRenderable(): Renderable
{
    return {
        ...createRayCastable(),
        __type__: 'Renderable',
        geometry: getDefaultGeometry('Cube'),
        material: getDefaultMaterial('Default-Material'),
        castShadows: true,
        receiveShadows: true,
    };
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Renderable: RenderableLogic;
    }
}
import { PickingCollisionVO } from '../pick/Raycaster';

/**
 * Renderable 逻辑处理类。
 *
 * 提供：
 * - renderObject: computed<RenderObject>（构建渲染对象，注入 transform uniform）
 * - selfLocalBounds / selfWorldBounds: computed<Box3>
 * - isLoaded: computed<boolean>
 * - beforeRender: 分发到 geometry/material/lightPicker/transform/同对象其他组件
 * - worldRayIntersection / localRayIntersection: 射线相交检测
 * - onLoadCompleted: 加载完成回调
 * - dispose: 清理 geometry/material 引用
 *
 * 子类 logic（skinnedMeshRendererLogic / waterLogic）应继承本类后叠加自身 beforeRender。
 */
export class RenderableLogic extends BehaviourLogic
{
    /** 光源拾取器（init 时创建） */
    private _lightPicker: LightPicker | null = null;
    /** 复用的渲染对象实例（懒创建，由 _renderObject computed 使用） */
    private _renderObjectCache: RenderObject | null = null;

    /** 自身局部包围盒 */
    readonly _selfLocalBounds: Computed<Box3>;
    /** 自身世界包围盒 */
    readonly _selfWorldBounds: Computed<Box3>;
    /** 渲染对象（computed，依赖 transform 与组件） */
    readonly _renderObject: Computed<RenderObject>;
    /** 是否加载完成 */
    readonly _isLoaded: Computed<boolean>;
    /** resolveMaterial 闭包（构造时捕获） */
    private _resolveMaterial: () => Material;
    /** resolveGeometry 闭包（构造时捕获） */
    private _resolveGeometry: () => Geometry;

    constructor(renderable: Renderable)
    {
        super(renderable);

        const self = this;

        // 解析材质（为空时 fallback 到默认材质，使 JSON 字面量可省略 material 字段）
        const resolveMaterial = () => renderable.material || getDefaultMaterial('Default-Material');

        // 解析几何体（为空时 fallback 到默认 Cube，使 { __type__: 'MeshRenderer' } 这类
        // 省略 geometry 字段的默认组件能正常上传顶点数据并渲染）
        const resolveGeometry = () => renderable.geometry || getDefaultGeometry('Cube');

        this._selfLocalBounds = computed<Box3>(() =>
        {
            // 监听 geometry 变化
            const r_renderable = reactive(renderable);
            r_renderable.geometry;

            const geometry = resolveGeometry();

            return getLogic(geometry).bounding;
        });

        this._selfWorldBounds = computed<Box3>(() =>
        {
            // 依赖 selfLocalBounds
            const localBounds = self._selfLocalBounds.value;

            return localBounds.clone().applyMatrixTo(getLogic(self.object3D).local2world.value);
        });

        this._renderObject = computed<RenderObject>(() =>
        {
            const ro = self._renderObjectCache ||= new RenderObject();

            // 初始化 bindingResources（Geometry/Material/Transform 等 beforeRender 假设已存在）
            const roAny = ro as any;
            if (!roAny.bindingResources) roAny.bindingResources = {};

            // Transform 写入 transform uniform
            getLogic(self.object3D).beforeRender(ro, null, null);

            // 同对象其他组件的 beforeRender
            const components = self.object3D.components;
            for (const element of components)
            {
                const cl = getLogic(element);
                if (cl) cl.beforeRender(ro, null, null);
            }

            return ro;
        });

        this._isLoaded = computed<boolean>(() => getLogic(resolveMaterial()).isLoaded);

        // 保存 resolve 函数供方法使用
        this._resolveMaterial = resolveMaterial;
        this._resolveGeometry = resolveGeometry;
    }

    /** 渲染对象（computed，依赖 transform 与组件） */
    get renderObject(): Computed<RenderObject> { return this._renderObject; }

    /** 自身局部包围盒 */
    get selfLocalBounds(): Computed<Box3> { return this._selfLocalBounds; }

    /** 自身世界包围盒 */
    get selfWorldBounds(): Computed<Box3> { return this._selfWorldBounds; }

    /** 是否加载完成 */
    get isLoaded(): Computed<boolean> { return this._isLoaded; }

    /**
     * 初始化：调用 super.init 后创建 LightPicker。
     */
    init(object3D?: Object3D): void
    {
        super.init(object3D);
        this._lightPicker = new LightPicker(this.component as Renderable);
    }

    /**
     * 每帧更新（委托给基类）。
     */
    update(interval: number): void
    {
        super.update(interval);
    }

    /**
     * 渲染前处理：默认调用 baseBeforeRender（分发到 geometry/material/lightPicker/transform/其他组件）。
     *
     * 子类覆盖时可调用 this.baseBeforeRender(...) 或 super.beforeRender(...) 后追加自身逻辑。
     */
    beforeRender(renderObject: RenderObject, scene: Scene | null, camera: Camera | null): void
    {
        this.baseBeforeRender(renderObject, scene, camera);
    }

    /**
     * 基类 beforeRender（子类 logic 可调用后再追加自身逻辑）。
     */
    baseBeforeRender(renderObject: RenderObject, scene: Scene | null, camera: Camera | null): void
    {
        getLogic(this._resolveGeometry()).beforeRender(renderObject);
        getLogic(this._resolveMaterial()).beforeRender(renderObject);
        this._lightPicker?.beforeRender(renderObject);

        // Transform 写入 transform uniform
        getLogic(this.object3D).beforeRender(renderObject, scene, camera);

        // 同对象其他组件（跳过自身）
        const components = this.object3D.components;
        for (const element of components)
        {
            if (element !== this.component)
            {
                const cl = getLogic(element);
                if (cl) cl.beforeRender(renderObject, scene, camera);
            }
        }
    }

    /** 与局部空间射线相交 */
    localRayIntersection(localRay: Ray3): PickingCollisionVO
    {
        const localNormal = new Vector3();

        const rayEntryDistance = this._selfLocalBounds.value.rayIntersection(localRay.origin, localRay.direction, localNormal);
        if (rayEntryDistance === Number.MAX_VALUE)
        {
            return null;
        }

        const pipelineCullFace = getLogic(this._resolveMaterial()).renderPipeline.primitive?.cullFace;
        const cullFace = pipelineCullFace === 'front' ? CullFace.FRONT
            : pipelineCullFace === 'back' ? CullFace.BACK
                : CullFace.NONE;

        const pickingCollisionVO: PickingCollisionVO = {
            object3D: this.object3D,
            localNormal,
            localRay,
            rayEntryDistance,
            rayOriginIsInsideBounds: rayEntryDistance === 0,
            geometry: this._resolveGeometry(),
            cullFace };

        return pickingCollisionVO;
    }

    /** 与世界空间射线相交 */
    worldRayIntersection(worldRay: Ray3): PickingCollisionVO
    {
        const localRay = new Ray3();
        getLogic(this.object3D).world2local.value.transformRay(worldRay, localRay);

        return this.localRayIntersection(localRay);
    }

    /** 已加载完成或者加载完成时立即调用 */
    onLoadCompleted(callback: () => void): void
    {
        if (this._isLoaded.value)
        {
            callback();

            return;
        }
        getLogic(this._resolveMaterial()).onLoadCompleted(callback);
    }

    /**
     * 释放：清理 geometry/material 引用并调用基类 dispose。
     */
    dispose(): void
    {
        const r_renderable = reactive(this.component as Renderable);
        r_renderable.geometry = <any>null;
        r_renderable.material = <any>null;
        super.dispose();
    }
}
// 注册到分发表
registerLogic('Renderable', (component) =>
{
    return new RenderableLogic(component as Renderable);
});
