import { logic } from "@feng3d/reactivity";
import { isRenderable } from "../component/Component";
import { cameraLogic } from '../cameras/Camera';
import type { Camera } from '../cameras/Camera';
import { Object3D } from '../core/Object3D';
import { renderableLogic } from '../core/Renderable';
import type { Renderable } from '../core/Renderable';
import { getDefaultMaterial, materialLogic } from '../materials/Material';
import { sceneLogic } from './Scene';
import type { Scene } from './Scene';

/**
 * 解析材质：缺失时 fallback 到默认材质（与 renderableLogic 的 resolveMaterial 一致）。
 *
 * 使 `{ __type__: 'MeshRenderer' }`（无 material 字段）的默认组件能正常参与渲染筛选。
 */
function resolveMaterial(renderable: Renderable)
{
    return renderable.material || getDefaultMaterial('Default-Material');
}

/**
 * 场景拾取缓存
 */
export class ScenePickCache
{
    private scene: Scene;
    private camera: Camera;

    //
    private _activeModels: Renderable[];
    private _blenditems: Renderable[];
    private _unblenditems: Renderable[];

    constructor(scene: Scene, camera: Camera)
    {
        this.scene = scene;
        this.camera = camera;
    }

    /**
     * 获取需要渲染的对象
     */
    get activeModels()
    {
        if (this._activeModels)
        {
            return this._activeModels;
        }

        const models: Renderable[] = this._activeModels = [];
        const frustum = cameraLogic(this.camera).frustum;

        const sceneObj = sceneLogic(this.scene).object3D;
        let object3Ds = [sceneObj];
        while (object3Ds.length > 0)
        {
            const object3D = object3Ds.pop();

            if (!object3D.activeSelf)
            {
                continue;
            }
            const model = object3D.components.find(c => isRenderable(c)) as Renderable;
            if (model && model.enabled)
            {
                const worldBounds = renderableLogic(model).selfWorldBounds.value;
                if (frustum.intersectsBox(worldBounds))
                {
                    models.push(model);
                }
            }
            object3Ds = object3Ds.concat(object3D.children as Object3D[]);
        }

        return models;
    }

    /**
     * 半透明渲染对象
     */
    get blenditems()
    {
        if (this._blenditems)
        {
            return this._blenditems;
        }

        const models = this.activeModels;
        const camerapos = logic(cameraLogic(this.camera).object3D).worldPosition.value;

        const blenditems = this._blenditems = models.filter((item) =>
            materialLogic(resolveMaterial(item)).renderPipeline.fragment?.targets?.[0]?.blend).sort((b, a) => logic(renderableLogic(a).object3D).worldPosition.value.subTo(camerapos).lengthSquared - logic(renderableLogic(b).object3D).worldPosition.value.subTo(camerapos).lengthSquared);

        return blenditems;
    }

    /**
     * 不透明渲染对象
     */
    get unblenditems()
    {
        if (this._unblenditems)
        {
            return this._unblenditems;
        }

        const models = this.activeModels;
        const camerapos = logic(cameraLogic(this.camera).object3D).worldPosition.value;

        const unblenditems = this._unblenditems = models.filter((item) =>
            !materialLogic(resolveMaterial(item)).renderPipeline.fragment?.targets?.[0]?.blend).sort((a, b) => logic(renderableLogic(a).object3D).worldPosition.value.subTo(camerapos).lengthSquared - logic(renderableLogic(b).object3D).worldPosition.value.subTo(camerapos).lengthSquared);

        return unblenditems;
    }

    clear()
    {
        this._blenditems = null;
        this._unblenditems = null;
        this._activeModels = null;
    }
}
