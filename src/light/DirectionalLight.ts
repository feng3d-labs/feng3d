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
        updateShadowByCamera(scene3d: Scene3D, viewCamera: Camera, meshRenderers: MeshRenderer[])
        {
            var worldBounds: Box = meshRenderers.reduce((pre: Box, i) =>
            {
                var box = i.getComponent(Bounding).worldBounds;
                if (!pre)
                    return box.clone();
                pre.union(box);
                return pre;
            }, null);

            // 
            var center = worldBounds.getCenter();
            var radius = worldBounds.getSize().length / 2;
            // 
            var near = 1;
            this.shadow.camera.transform.position = center.addTo(this.direction.scaleTo(radius + near).negate());
            this.shadow.camera.transform.lookAt(center, this.shadow.camera.transform.upVector);
            //
            this.shadow.camera.lens = new OrthographicLens(-radius, radius, radius, - radius, near, near + radius * 2);

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
                gameObject.mouseEnabled = false;
                gameObject.addComponent(BillboardComponent);

                //材质
                var model = gameObject.getComponent(MeshRenderer);
                model.geometry = new feng3d.PlaneGeometry({ width: 0.5, height: 0.5, segmentsW: 1, segmentsH: 1, yUp: false });
                var textureMaterial = model.material = feng3d.materialFactory.create("texture");
                //
                // textureMaterial.uniforms.s_texture.url = 'Assets/pz.jpg';
                // textureMaterial.uniforms.u_color.setTo(1.0, 0.0, 0.0, 1.0);
                textureMaterial.uniforms.s_texture = <any>this.frameBufferObject.texture;
                textureMaterial.renderParams.enableBlend = true;
                textureMaterial.renderParams.sfactor = BlendFactor.ONE;
                textureMaterial.renderParams.dfactor = BlendFactor.ZERO;
            }

            var depth = viewCamera.lens.near * 2;
            gameObject.transform.position = viewCamera.transform.scenePosition.addTo(viewCamera.transform.localToWorldMatrix.forward.scaleTo(depth));
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