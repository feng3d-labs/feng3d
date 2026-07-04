import { Camera } from '../cameras/Camera';
import { Renderable } from '../core/Renderable';
import { transformLogic } from '../core/transformLogic';
import { Scene } from './Scene';

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
     *
     * #### 渲染需求条件
     * 1. visible == true
     * 1. 在摄像机视锥内
     * 1. model.enabled == true
     *
     * @param object3D
     * @param camera
     */
    get activeModels()
    {
        if (this._activeModels)
            { return this._activeModels; }

        const models: Renderable[] = this._activeModels = [];
        const frustum = this.camera.frustum;

        let object3Ds = [this.scene.object3D];
        while (object3Ds.length > 0)
        {
            const object3D = object3Ds.pop();

            if (!object3D.activeSelf)
                { continue; }
            const model = object3D.getComponent(Renderable);
            if (model && model.enabled)
            {
                if (model.selfWorldBounds)
                {
                    if (frustum.intersectsBox(model.selfWorldBounds.value))
                        { models.push(model); }
                }
            }
            object3Ds = object3Ds.concat(object3D.children);
        }

return models;
    }

    /**
     * 半透明渲染对象
     */
    get blenditems()
    {
        if (this._blenditems)
            { return this._blenditems; }

        const models = this.activeModels;
        const camerapos = transformLogic(this.camera.transform).worldPosition.value;

        const blenditems = this._blenditems = models.filter((item) =>
        item.material.renderPipeline.fragment?.targets?.[0]?.blend).sort((b, a) => transformLogic(a.transform).worldPosition.value.subTo(camerapos).lengthSquared - transformLogic(b.transform).worldPosition.value.subTo(camerapos).lengthSquared);

        return blenditems;
    }

    /**
     * 半透明渲染对象
     */
    get unblenditems()
    {
        if (this._unblenditems)
            { return this._unblenditems; }

        const models = this.activeModels;
        const camerapos = transformLogic(this.camera.transform).worldPosition.value;

        const unblenditems = this._unblenditems = models.filter((item) =>
        !item.material.renderPipeline.fragment?.targets?.[0]?.blend).sort((a, b) => transformLogic(a.transform).worldPosition.value.subTo(camerapos).lengthSquared - transformLogic(b.transform).worldPosition.value.subTo(camerapos).lengthSquared);

        return unblenditems;
    }

    clear()
    {
        this._blenditems = null;
        this._unblenditems = null;
        this._activeModels = null;
    }
}
