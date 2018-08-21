namespace feng3d
{

    export interface ComponentMap { DirectionalLight: DirectionalLight; }
    /**
     * 方向光源
     */
    export class DirectionalLight extends Light
    {
        lightType = LightType.Directional;

        /**
         * 光源位置
         */
        get position()
        {
            return this.shadowCamera.transform.scenePosition;
        }

        constructor()
        {
            super();
        }

        /**
         * 通过视窗摄像机进行更新
         * @param viewCamera 视窗摄像机
         */
        updateShadowByCamera(scene3d: Scene3D, viewCamera: Camera, models: Model[])
        {
            var worldBounds: Box = models.reduce((pre: Box, i) =>
            {
                var box = i.getComponent(Model).worldBounds;
                if (!pre)
                    return box.clone();
                pre.union(box);
                return pre;
            }, null) || new Box(new Vector3(), new Vector3(1, 1, 1));

            // 
            var center = worldBounds.getCenter();
            var radius = worldBounds.getSize().length / 2;
            // 
            this.shadowCamera.transform.position = center.addTo(this.direction.scaleTo(radius + this.shadowCameraNear).negate());
            this.shadowCamera.transform.lookAt(center, this.shadowCamera.transform.upVector);
            //
            this.shadowCamera.lens = new OrthographicLens(-radius, radius, radius, - radius, this.shadowCameraNear, this.shadowCameraNear + radius * 2);
        }
    }
}