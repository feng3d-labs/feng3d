namespace feng3d
{

    /**
     * 灯光
     * @author feng 2016-12-12
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
        shadowNear = 0.2;

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

        constructor()
        {
            super();
            this.shadowCamera = GameObject.create("LightShadowCamera").addComponent(Camera);
        }

        init(gameObject: GameObject)
        {
            super.init(gameObject);
        }
    }
}