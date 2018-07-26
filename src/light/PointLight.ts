namespace feng3d
{
    /**
     * 点光源
     * @author feng 2016-12-13
     */
    export class PointLight extends Light
    {
        /**
         * 光照范围
         */
        @oav()
        @serialize
        @watch("invalidRange")
        range = 10;


        /**
         * 光源位置
         */
        get position()
        {
            return this.transform.scenePosition;
        }

        /**
         * 阴影图尺寸
         */
        get shadowMapSize()
        {
            return this.shadowMap.getSize().multiply(new Vector2(1 / 4, 1 / 2));
        }

        /**
         * 投影最近距离
         */
        private shadowCameraNear = 0.1;

        get shadowCameraFar()
        {
            return this.range;
        }

        private perspectiveLens: PerspectiveLens;

        constructor()
        {
            super();
            this.perspectiveLens = this.shadowCamera.lens = new PerspectiveLens(90, 1, this.shadowCameraNear, this.shadowCameraFar);
        }

        /**
         * 构建
         */
        init(gameObject: GameObject)
        {
            super.init(gameObject);
            this.lightType = LightType.Point;
        }

        private invalidRange()
        {
            if (this.perspectiveLens)
                this.perspectiveLens.far = this.range;
        }
    }
}