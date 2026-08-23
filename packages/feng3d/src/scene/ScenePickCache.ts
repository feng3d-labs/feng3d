import { computed, Computed, logic, reactive, toRaw } from "@feng3d/reactivity";
import { isRenderable } from "../component/Component";
import type { Camera } from '../cameras/Camera';
import { Object3D } from '../core/Object3D';
import type { Renderable } from '../core/Renderable';
import { Materials } from '../materials/Material';
import type { Scene } from './Scene';

/**
 * 解析材质：缺失时 fallback 到 StandardMaterial（与 renderableLogic 的 resolveMaterial 一致）。
 *
 * 使 `{ __type__: 'MeshRenderer' }`（无 material 字段）的默认组件能正常参与渲染筛选。
 */
function resolveMaterial(renderable: Renderable)
{
    return renderable.material || { __type__: 'StandardMaterial' } as Materials;
}

/**
 * 响应式遍历场景树收集激活的渲染对象（框架设计文档 G2：变更驱动失效）。
 *
 * 依赖追踪：
 * - activeSelf / isVisibleAndEnabled / selfWorldBounds / frustum / frustumCulling
 *   均经 logic getter（computed）读取——对应数据变化自动失效。
 * - components / children 经 reactive 代理迭代——增删组件/子对象可追踪。
 */
function collectActiveModels(scene: Scene, camera: Camera): Renderable[]
{
    const camLogic = logic(camera);
    const frustum = camLogic.frustum;
    const culling = camLogic.frustumCulling;

    const models: Renderable[] = [];
    let object3Ds: Object3D[] = [logic(scene).entity as Object3D];
    while (object3Ds.length > 0)
    {
        const object3D = object3Ds.pop()!;

        // 通过 logic().activeSelf 读取，使 JSON 字面量（缺失字段）能拿到默认值 true
        if (!logic(object3D).activeSelf)
        {
            continue;
        }
        const r_object3D = reactive(object3D);
        const model = (r_object3D.components ?? []).find(c => isRenderable(c)) as Renderable | undefined;
        if (model && logic(model).isVisibleAndEnabled.value)
        {
            // 门控渲染（设计 3.2.2）：renderWhenLoaded=true 的对象在 isLoaded（组件 +
            // 子树资源就绪）前暂不渲染，就绪后本 computed 自动失效、对象出现。
            // 响应式读取两个字段建立依赖；默认 false（纹理走占位符渐进换装）不受影响。
            if (reactive(model).renderWhenLoaded && !logic(logic(model).entity as Object3D).isLoaded)
            {
                continue;
            }
            if (!culling || frustum.intersectsBox(logic(model).selfWorldBounds.value))
            {
                models.push(model);
            }
        }
        object3Ds = object3Ds.concat((r_object3D.children ?? []).map(c => toRaw(c) as Object3D));
    }

    return models;
}

/**
 * 场景拾取缓存
 *
 * 三个集合均为 computed：静态场景零重算；激活状态/可见性/包围盒/相机视锥/
 * 树结构任一变化时精确失效（框架设计文档 4.1 变更驱动）。
 */
export class ScenePickCache
{
    private readonly _activeModelsC: Computed<Renderable[]>;
    private readonly _blenditemsC: Computed<Renderable[]>;
    private readonly _unblenditemsC: Computed<Renderable[]>;

    constructor(scene: Scene, camera: Camera)
    {
        this._activeModelsC = computed(() => collectActiveModels(scene, camera));

        const sortBackToFront = (b: Renderable, a: Renderable): number =>
        {
            const camerapos = logic(logic(camera).entity).worldPosition;

            return logic(logic(a).entity).worldPosition.subTo(camerapos).lengthSquared
                - logic(logic(b).entity).worldPosition.subTo(camerapos).lengthSquared;
        };

        this._blenditemsC = computed(() =>
        {
            return this._activeModelsC.value.filter((item) =>
                logic(resolveMaterial(item)).isTransparent).sort(sortBackToFront);
        });

        this._unblenditemsC = computed(() =>
        {
            return this._activeModelsC.value.filter((item) =>
                !logic(resolveMaterial(item)).isTransparent).sort(sortBackToFront);
        });
    }

    /**
     * 获取需要渲染的对象
     */
    get activeModels()
    {
        return this._activeModelsC.value;
    }

    /**
     * 半透明渲染对象
     */
    get blenditems()
    {
        return this._blenditemsC.value;
    }

    /**
     * 不透明渲染对象
     */
    get unblenditems()
    {
        return this._unblenditemsC.value;
    }
}
