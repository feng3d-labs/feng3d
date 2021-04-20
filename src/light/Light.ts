namespace feng3d
{
    /**
     * 灯光
     */
    export class Light extends Behaviour
    {
        /**
         * 灯光类型
         */
        @serialize
        lightType: LightType;

        /**
         * 颜色
         */
        @oav()
        @serialize
        color = new Color3();

        /**
         * 光照强度
         */
        @oav()
        @serialize
        intensity = 1;

        /**
         * 阴影类型
         */
        @oav({ component: "OAVEnum", componentParam: { enumClass: ShadowType } })
        @serialize
        shadowType = ShadowType.No_Shadows;

        /**
         * 光源位置
         */
        get position()
        {
            return this.node3d.worldPosition;
        }

        /**
         * 光照方向
         */
        get direction()
        {
            return this.node3d.localToWorldMatrix.getAxisZ();
        }

        /**
         * 阴影偏差，用来解决判断是否为阴影时精度问题
         */
        shadowBias = -0.005;

        /**
         * 阴影半径，边缘宽度
         */
        shadowRadius = 1;

        /**
         * 阴影近平面距离
         */
        get shadowCameraNear()
        {
            return this.shadowCamera.lens.near;
        }

        /**
         * 阴影近平面距离
         */
        get shadowCameraFar()
        {
            return this.shadowCamera.lens.far;
        }

        /**
         * 投影摄像机
         */
        shadowCamera: Camera;

        /**
         * 阴影图尺寸
         */
        get shadowMapSize()
        {
            return this.shadowMap.getSize();
        }

        get shadowMap()
        {
            return this.frameBufferObject.texture;
        }

        /**
         * 帧缓冲对象，用于处理光照阴影贴图渲染
         */
        frameBufferObject = new FrameBufferObject();

        @oav({ tooltip: "是否调试阴影图" })
        debugShadowMap = false;

        private debugShadowMapModel: MeshRenderer;

        constructor()
        {
            super();
            this.shadowCamera = serialization.setValue(new Entity(), { name: "LightShadowCamera" }).addComponent(Camera);
        }

        updateDebugShadowMap(scene: Scene, viewCamera: Camera)
        {
            var model = this.debugShadowMapModel;
            if (!model)
            {
                var entity = new Entity();
                entity.name = "debugShadowMapObject";
                model = entity.addComponent(MeshRenderer);
                model.geometry = Geometry.getDefault("Plane");
                model.hideFlags = HideFlags.Hide | HideFlags.DontSave;
                model.node3d.mouseEnabled = false;
                model.addComponent(BillboardComponent);

                //材质
                model.geometry = serialization.setValue(new PlaneGeometry(), { width: this.lightType == LightType.Point ? 1 : 0.5, height: 0.5, segmentsW: 1, segmentsH: 1, yUp: false });
                var textureMaterial = model.material = serialization.setValue(new Material(), { shaderName: "texture", uniforms: { s_texture: this.frameBufferObject.texture } });
                //
                // textureMaterial.uniforms.s_texture.url = 'Assets/pz.jpg';
                // textureMaterial.uniforms.u_color.setTo(1.0, 0.0, 0.0, 1.0);
                textureMaterial.renderParams.enableBlend = true;
                textureMaterial.renderParams.sfactor = BlendFactor.ONE;
                textureMaterial.renderParams.dfactor = BlendFactor.ZERO;
            }

            var depth = viewCamera.lens.near * 2;
            const position = viewCamera.node3d.worldPosition.addTo(viewCamera.node3d.localToWorldMatrix.getAxisZ().scaleNumberTo(depth));
            model.node3d.x = position.x;
            model.node3d.y = position.y;
            model.node3d.z = position.z;
            var billboardComponent = model.getComponent(BillboardComponent);
            billboardComponent.camera = viewCamera;

            if (this.debugShadowMap)
            {
                scene.node3d.addChild(model.node3d);
            } else
            {
                model.node3d.remove();
            }
        }
    }
}