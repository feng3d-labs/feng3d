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
        range = 10;

        /**
         * 光源位置
         */
        get position()
        {
            return this.transform.scenePosition;
        }

        // shadowMatrix = new Matrix4x4();

        /**
         * 阴影图尺寸
         */
        get shadowMapSize()
        {
            return this.shadowMap.getSize().multiply(new Vector2(1 / 4, 1 / 2));
        }

        constructor()
        {
            super();
            this.shadowCamera.lens = new PerspectiveLens(90, 1, 0.5, 500);
        }

        /**
         * 构建
         */
        init(gameObject: GameObject)
        {
            super.init(gameObject);
            this.lightType = LightType.Point;
        }
    }
}