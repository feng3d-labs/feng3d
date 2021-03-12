namespace feng3d
{
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

            var node3ds = [this.scene.node3d];
            while (node3ds.length > 0)
            {
                var node3d = node3ds.pop();

                if (!node3d.visible)
                    continue;
                var model = node3d.getComponent(Renderable);
                if (model && model.enabled)
                {
                    if (model.selfWorldBounds)
                    {
                        if (frustum.intersectsBox(model.selfWorldBounds))
                            models.push(model);
                    }
                }
                node3ds = node3ds.concat(node3d.children);
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
            var camerapos = this.camera.node3d.worldPosition;

            var blenditems = this._blenditems = models.filter((item) =>
            {
                return item.material.renderParams.enableBlend;
            }).sort((b, a) => a.node3d.worldPosition.subTo(camerapos).lengthSquared - b.node3d.worldPosition.subTo(camerapos).lengthSquared);

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
            var camerapos = this.camera.node3d.worldPosition;

            var unblenditems = this._unblenditems = models.filter((item) =>
            {
                return !item.material.renderParams.enableBlend;
            }).sort((a, b) => a.node3d.worldPosition.subTo(camerapos).lengthSquared - b.node3d.worldPosition.subTo(camerapos).lengthSquared);

            return unblenditems;
        }

        clear()
        {
            this._blenditems = null;
            this._unblenditems = null;
            this._activeModels = null;
        }
    }
}