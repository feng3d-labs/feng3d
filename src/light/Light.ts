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
         * 是否生成阴影
         */
        @oav()
        @serialize
        castsShadows = false;

        private _shadowMap: Texture2D = new RenderTargetTexture2D();
        get shadowMap()
        {
            return this._shadowMap;
        }

        /**
         * 帧缓冲对象，用于处理光照阴影贴图渲染
         */
        frameBufferObject = new FrameBufferObject();

        init(gameObject: GameObject)
        {
            super.init(gameObject);
        }
    }
}