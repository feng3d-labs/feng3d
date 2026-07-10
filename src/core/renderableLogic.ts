import { registerLogic } from "@feng3d/reactivity";
import { logic as getLogic } from '@feng3d/reactivity';
import { Box3, Ray3, Vector3 } from '@feng3d/math';
import { computed, Computed, reactive } from '@feng3d/reactivity';
import { RenderObject } from '@feng3d/webgpu';
import { BehaviourLogic, behaviourLogic } from '../component/behaviourLogic';
import {} from '../component/Component';
import type { Camera } from '../cameras/Camera';
import type { Scene } from '../scene/Scene';
import { CullFace } from '../render/data/enums';
import { getDefaultGeometry, geometryLogic } from '../geometry/geometryLogic';
import { LightPicker } from '../light/pickers/LightPicker';
import { getDefaultMaterial, materialLogic } from '../materials/materialLogic';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Renderable: RenderableLogic;
    }
}
import { PickingCollisionVO } from '../pick/Raycaster';
import { Renderable } from './Renderable';

/**
 * Renderable 逻辑处理输出。
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
 * 子类 logic（skinnedMeshRendererLogic / waterLogic）应组合本 logic 后叠加自身 beforeRender。
 */
export interface RenderableLogic extends BehaviourLogic
{
    /** 渲染对象（computed，依赖 transform 与组件） */
    readonly renderObject: Computed<RenderObject>;
    /** 自身局部包围盒 */
    readonly selfLocalBounds: Computed<Box3>;
    /** 自身世界包围盒 */
    readonly selfWorldBounds: Computed<Box3>;
    /** 是否加载完成 */
    readonly isLoaded: Computed<boolean>;
    /** 与世界空间射线相交 */
    worldRayIntersection(worldRay: Ray3): PickingCollisionVO;
    /** 与局部空间射线相交 */
    localRayIntersection(localRay: Ray3): PickingCollisionVO;
    /** 已加载完成或者加载完成时立即调用 */
    onLoadCompleted(callback: () => void): void;
    /** 基类 beforeRender（子类 logic 可调用后再追加自身逻辑） */
    baseBeforeRender(renderObject: RenderObject, scene: Scene | null, camera: Camera | null): void;
}


/**
 * 获取 Renderable 的 logic。
 *
 * 子类 logic 调用本函数拿到基类 logic 后叠加自身 beforeRender 等。
 */
export function renderableLogic(renderable: Renderable): RenderableLogic

{
    return getLogic(renderable);
}

export function createRenderableLogic(renderable: Renderable): RenderableLogic
{
    // 组合 behaviourLogic（提供 isVisibleAndEnabled、update、dispose 基类行为）
    const base = behaviourLogic(renderable);
    let _lightPicker: LightPicker | null = null;
    let _renderObject: RenderObject | null = null;
    let _inited = false;

    // 解析材质（为空时 fallback 到默认材质，使 JSON 字面量可省略 material 字段）
    const resolveMaterial = () => renderable.material || getDefaultMaterial('Default-Material');

    // 解析几何体（为空时 fallback 到默认 Cube，使 { __type__: 'MeshRenderer' } 这类
    // 省略 geometry 字段的默认组件能正常上传顶点数据并渲染）
    const resolveGeometry = () => renderable.geometry || getDefaultGeometry('Cube');

    const selfLocalBounds = computed<Box3>(() =>
    {
        // 监听 geometry 变化
        const r_renderable = reactive(renderable);
        r_renderable.geometry;

        const geometry = resolveGeometry();

        return geometryLogic(geometry).bounding;
    });

    const selfWorldBounds = computed<Box3>(() =>
    {
        // 依赖 selfLocalBounds
        const localBounds = selfLocalBounds.value;

        return localBounds.clone().applyMatrixTo(getLogic(logic.object3D).local2world.value);
    });

    const renderObject = computed<RenderObject>(() =>
    {
        const ro = _renderObject ||= new RenderObject();

        // 初始化 bindingResources（Geometry/Material/Transform 等 beforeRender 假设已存在）
        const roAny = ro as any;
        if (!roAny.bindingResources) roAny.bindingResources = {};

        // Transform 写入 transform uniform
        getLogic(logic.object3D).beforeRender(ro, null, null);

        // 同对象其他组件的 beforeRender
        const components = logic.object3D.components;
        for (const element of components)
        {
            const cl = logic(element);
            if (cl) cl.beforeRender(ro, null, null);
        }

        return ro;
    });

    const isLoaded = computed<boolean>(() => materialLogic(resolveMaterial()).isLoaded);

    function baseBeforeRender(ro: RenderObject, scene: Scene | null, camera: Camera | null): void
    {
        geometryLogic(resolveGeometry()).beforeRender(ro);
        materialLogic(resolveMaterial()).beforeRender(ro);
        _lightPicker?.beforeRender(ro);

        // Transform 写入 transform uniform
        getLogic(logic.object3D).beforeRender(ro, scene, camera);

        // 同对象其他组件（跳过自身）
        const components = logic.object3D.components;
        for (const element of components)
        {
            if (element !== renderable)
            {
                const cl = logic(element);
                if (cl) cl.beforeRender(ro, scene, camera);
            }
        }
    }

    function localRayIntersection(localRay: Ray3): PickingCollisionVO
    {
        const localNormal = new Vector3();

        const rayEntryDistance = selfLocalBounds.value.rayIntersection(localRay.origin, localRay.direction, localNormal);
        if (rayEntryDistance === Number.MAX_VALUE)
        {
            return null;
        }

        const pipelineCullFace = materialLogic(resolveMaterial()).renderPipeline.primitive?.cullFace;
        const cullFace = pipelineCullFace === 'front' ? CullFace.FRONT
            : pipelineCullFace === 'back' ? CullFace.BACK
                : CullFace.NONE;

        const pickingCollisionVO: PickingCollisionVO = {
            object3D: logic.object3D,
            localNormal,
            localRay,
            rayEntryDistance,
            rayOriginIsInsideBounds: rayEntryDistance === 0,
            geometry: resolveGeometry(),
            cullFace };

        return pickingCollisionVO;
    }

    function worldRayIntersection(worldRay: Ray3): PickingCollisionVO
    {
        const localRay = new Ray3();
        getLogic(logic.object3D).world2local.value.transformRay(worldRay, localRay);

        return localRayIntersection(localRay);
    }

    function onLoadCompleted(callback: () => void): void
    {
        if (isLoaded.value)
        {
            callback();

            return;
        }
        materialLogic(resolveMaterial()).onLoadCompleted(callback);
    }

    const logic = {
        object3D: null as any,
        get isVisibleAndEnabled() { return base.isVisibleAndEnabled; },
        renderObject,
        selfLocalBounds,
        selfWorldBounds,
        isLoaded,
        init()
        {
            if (_inited) return;
            _inited = true;
            base.init();
            _lightPicker = new LightPicker(renderable);
        },
        beforeRender(ro: RenderObject, scene: Scene | null, camera: Camera | null)
        {
            baseBeforeRender(ro, scene, camera);
        },
        baseBeforeRender,
        update(interval: number) { base.update(interval); },
        worldRayIntersection,
        localRayIntersection,
        onLoadCompleted,
        dispose()
        {
            const r_renderable = reactive(renderable);
            r_renderable.geometry = <any>null;
            r_renderable.material = <any>null;
            base.dispose();
                    } };

    return logic as any;
}

// 注册到分发表
registerLogic('Renderable', (component) =>
{
    return createRenderableLogic(component as Renderable);
});
