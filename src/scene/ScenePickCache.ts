import { Scene } from "./Scene";
import { Camera } from "../cameras/Camera";
import { Renderable } from "../core/Renderable";

/**
 * 场景拾取缓存
 */
export class ScenePickCache
{
    private scene: Scene
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
     * @param gameObject 
     * @param camera 
     */
    get activeModels()
    {
        if (this._activeModels)
            return this._activeModels;

        var models: Renderable[] = this._activeModels = [];
        var frustum = this.camera.frustum;

        var gameObjects = [this.scene.gameObject];
        while (gameObjects.length > 0)
        {
            var gameObject = gameObjects.pop();

            if (!gameObject.visible)
                continue;
            var model = gameObject.getComponent("Renderable");
            if (model && model.enabled)
            {
                if (model.selfWorldBounds)
                {
                    if (frustum.intersectsBox(model.selfWorldBounds))
                        models.push(model);
                }
            }
            gameObjects = gameObjects.concat(gameObject.children);
        }
        return models;
    }

    /**
     * 半透明渲染对象
     */
    get blenditems()
    {
        if (this._blenditems)
            return this._blenditems;

        var models = this.activeModels;
        var camerapos = this.camera.transform.worldPosition;

        var blenditems = this._blenditems = models.filter((item) =>
        {
            return item.material.renderParams.enableBlend;
        }).sort((b, a) => a.transform.worldPosition.subTo(camerapos).lengthSquared - b.transform.worldPosition.subTo(camerapos).lengthSquared);

        return blenditems;
    }

    /**
     * 半透明渲染对象
     */
    get unblenditems()
    {
        if (this._unblenditems)
            return this._unblenditems;

        var models = this.activeModels;
        var camerapos = this.camera.transform.worldPosition;

        var unblenditems = this._unblenditems = models.filter((item) =>
        {
            return !item.material.renderParams.enableBlend;
        }).sort((a, b) => a.transform.worldPosition.subTo(camerapos).lengthSquared - b.transform.worldPosition.subTo(camerapos).lengthSquared);

        return unblenditems;
    }

    clear()
    {
        this._blenditems = null;
        this._unblenditems = null;
        this._activeModels = null;
    }
}
