namespace feng3d
{
    /**
     * 场景拾取缓存
     */
    export class ScenePickCache
    {
        private scene: Scene3D
        private camera: Camera;

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
        getActiveMeshRenderers()
        {
            var meshRenderers: MeshRenderer[] = [];

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
    }
}