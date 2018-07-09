namespace feng3d
{

    /**
     * 方向光源
     * @author feng 2016-12-13
     */
    export class DirectionalLight extends Light
    {
        shadow = new DirectionalLightShadow();

        @oav({ componentParam: { tooltip: "是否调试阴影图" } })
        debugShadowMap = false;

        private debugShadowMapObject: GameObject;

        /**
         * 光照方向
         */
        get direction()
        {
            return this.transform.localToWorldMatrix.forward
        }

        constructor()
        {
            super();
        }

        /**
         * 构建
         */
        init(gameObject: GameObject)
        {
            super.init(gameObject);
            this.lightType = LightType.Directional;
        }

        /**
         * 通过视窗摄像机进行更新
         * @param viewCamera 视窗摄像机
         */
        updateShadowByCamera(scene3d: Scene3D, viewCamera: Camera)
        {
            // 获取视窗摄像机可视区域包围盒
            var viewBox = viewCamera.viewBox;
            // 
            var center = viewBox.getCenter();
            var radius = viewBox.getSize().length;
            // 
            var worldBounds = scene3d.gameObject.getComponent(Bounding).worldBounds;
            //
            var worldCenter = worldBounds.getCenter();
            var worldRadius = worldBounds.getSize().length;
            //
            var near = 1;
            this.shadow.camera.transform.position = center.addTo(this.direction.scaleTo(worldRadius + near - worldCenter.subTo(center).dot(this.direction)).negate());
            this.shadow.camera.transform.lookAt(center);
            //
            this.shadow.camera.lens = new OrthographicLens(-radius, radius, radius, - radius, near, near + worldRadius * 2);

            this.updateDebugShadowMap(scene3d, viewCamera);
        }

        private updateDebugShadowMap(scene3d: Scene3D, viewCamera: Camera)
        {
            var gameObject = this.debugShadowMapObject;
            if (!gameObject)
            {
                gameObject = this.debugShadowMapObject = gameObjectFactory.createPlane("debugShadowMapObject");
                gameObject.showinHierarchy = false;
                gameObject.serializable = false;
                gameObject.addComponent(BillboardComponent);

                //材质
                var model = gameObject.getComponent(MeshRenderer);
                model.geometry = new feng3d.PlaneGeometry({ width: 0.5, height: 0.5, segmentsW: 1, segmentsH: 1, yUp: false });
                var textureMaterial = model.material = feng3d.materialFactory.create("standard");
                //
                // textureMaterial.uniforms.s_diffuse = 'resources/m.png';
            }

            gameObject.transform.position = viewCamera.transform.scenePosition.addTo(viewCamera.transform.localToWorldMatrix.forward.scale(viewCamera.lens.near + 0.001));
            var billboardComponent = gameObject.getComponent(BillboardComponent);
            billboardComponent.camera = viewCamera;

            if (this.debugShadowMap)
            {
                scene3d.gameObject.addChild(gameObject);
            } else
            {
                gameObject.remove();
            }
        }
    }
}