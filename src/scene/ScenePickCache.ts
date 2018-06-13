namespace feng3d
{
    /**
     * 场景拾取缓存
     */
    export class ScenePickCache
    {
        private scene: Scene3D
        private camera: Camera;

        //
        private _activeMeshRenderers: MeshRenderer[];
        private _blenditems: MeshRenderer[];
        private _unblenditems: MeshRenderer[];

        constructor(scene: Scene3D, camera: Camera)
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
         * 1. meshRenderer.enabled == true
         * 
         * @param gameObject 
         * @param camera 
         */
        get activeMeshRenderers()
        {
            if (this._activeMeshRenderers)
                return this._activeMeshRenderers;

            var meshRenderers: MeshRenderer[] = this._activeMeshRenderers = [];

            var gameObjects = [this.scene.gameObject];
            while (gameObjects.length > 0)
            {
                var gameObject = gameObjects.pop();

                if (!gameObject.visible)
                    continue;
                var meshRenderer = gameObject.getComponent(MeshRenderer);
                if (meshRenderer && meshRenderer.enabled)
                {
                    var boundingComponent = gameObject.getComponent(Bounding);
                    if (boundingComponent.selfWorldBounds)
                    {
                        if (this.camera.frustum.intersectsBox(boundingComponent.selfWorldBounds))
                            meshRenderers.push(meshRenderer);
                    }
                }
                gameObjects = gameObjects.concat(gameObject.children);
            }
            return meshRenderers;
        }

        /**
         * 半透明渲染对象
         */
        get blenditems()
        {
            if (this._blenditems)
                return this._blenditems;

            var meshRenderers = this.activeMeshRenderers;
            var camerapos = this.camera.transform.scenePosition;

            var blenditems = this._blenditems = meshRenderers.filter((item) =>
            {
                return item.material.renderParams.enableBlend;
            }).map((item) =>
            {
                return {
                    depth: item.transform.scenePosition.subTo(camerapos).length,
                    item: item,
                    enableBlend: item.material.renderParams.enableBlend,
                }
            }).sort((a, b) => b.depth - a.depth).map((item) => item.item);

            return blenditems;
        }

        /**
         * 半透明渲染对象
         */
        get unblenditems()
        {
            if (this._unblenditems)
                return this._unblenditems;

            var meshRenderers = this.activeMeshRenderers;
            var camerapos = this.camera.transform.scenePosition;

            var unblenditems = this._unblenditems = meshRenderers.filter((item) =>
            {
                return item.material.renderParams.enableBlend;
            }).map((item) =>
            {
                return {
                    depth: item.transform.scenePosition.subTo(camerapos).length,
                    item: item,
                    enableBlend: !item.material.renderParams.enableBlend,
                }
            }).sort((a, b) => a.depth - b.depth).map((item) => item.item);

            return unblenditems;
        }

        clear()
        {
            this._blenditems = null;
            this._unblenditems = null;
            this._activeMeshRenderers = null;
        }
    }
}