namespace feng3d
{

    export interface ComponentMap { DirectionalLight: DirectionalLight; }

    /**
     * 方向光源
     */
    export class DirectionalLight extends Light
    {
        __class__: "feng3d.DirectionalLight" = "feng3d.DirectionalLight";

        lightType = LightType.Directional;

        private orthographicLens: OrthographicLens;

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
                var box = i.gameObject.worldBounds;
                if (!pre)
                    return box.clone();
                pre.union(box);
                return pre;
            }, null) || new Box(new Vector3(), new Vector3(1, 1, 1));

            // 
            var center = worldBounds.getCenter();
            var radius = worldBounds.getSize().length / 2;
            // 
            this.shadowCamera.transform.position = center.addTo(this.direction.scaleNumberTo(radius + this.shadowCameraNear).negate());
            this.shadowCamera.transform.lookAt(center, this.shadowCamera.transform.upVector);
            //
            if (!this.orthographicLens)
            {
                this.shadowCamera.lens = this.orthographicLens = new OrthographicLens(radius, 1, this.shadowCameraNear, this.shadowCameraNear + radius * 2);
            } else
            {
                Object.setValue(this.orthographicLens, { size: radius, near: this.shadowCameraNear, far: this.shadowCameraNear + radius * 2 });
            }
        }
    }
}