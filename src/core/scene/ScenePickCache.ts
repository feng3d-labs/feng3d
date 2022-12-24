import { Camera } from '../cameras/Camera';
import { MeshRenderer } from '../core/MeshRenderer';
import { Node3D } from '../core/Node3D';
import { Scene } from './Scene';

/**
 * 场景拾取缓存
 */
export class ScenePickCache
{
    private scene: Scene;
    private camera: Camera;

    //
    private _activeModels: MeshRenderer[];
    private _blendItems: MeshRenderer[];
    private _unBlendItems: MeshRenderer[];

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
     */
    get activeModels()
    {
        if (this._activeModels)
        { return this._activeModels; }

        const models: MeshRenderer[] = this._activeModels = [];
        const frustum = this.camera.frustum;

        let node3Ds = [this.scene.node3d];
        while (node3Ds.length > 0)
        {
            const node3d = node3Ds.pop();

            if (!node3d.visible)
            { continue; }
            const model = node3d.getComponent(MeshRenderer);
            if (model && model.enabled)
            {
                if (model.selfWorldBounds)
                {
                    if (frustum.intersectsBox(model.selfWorldBounds))
                    { models.push(model); }
                }
            }
            node3Ds = node3Ds.concat(node3d.children as Node3D[]);
        }

        return models;
    }

    /**
     * 半透明渲染对象
     */
    get blendItems()
    {
        if (this._blendItems)
        { return this._blendItems; }

        const models = this.activeModels;
        const cameraPos = this.camera.node3d.worldPosition;

        const blendItems = this._blendItems = models.filter((item) =>
            item.material.renderParams.enableBlend).sort((b, a) => a.node3d.worldPosition.subTo(cameraPos).lengthSquared - b.node3d.worldPosition.subTo(cameraPos).lengthSquared);

        return blendItems;
    }

    /**
     * 半透明渲染对象
     */
    get unBlendItems()
    {
        if (this._unBlendItems)
        { return this._unBlendItems; }

        const models = this.activeModels;
        const cameraPos = this.camera.node3d.worldPosition;

        const unBlendItems = this._unBlendItems = models.filter((item) =>
            !item.material.renderParams.enableBlend).sort((a, b) => a.node3d.worldPosition.subTo(cameraPos).lengthSquared - b.node3d.worldPosition.subTo(cameraPos).lengthSquared);

        return unBlendItems;
    }

    clear()
    {
        this._blendItems = null;
        this._unBlendItems = null;
        this._activeModels = null;
    }
}
