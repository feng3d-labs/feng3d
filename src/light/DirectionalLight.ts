namespace feng3d
{

    /**
     * 方向光源
     * @author feng 2016-12-13
     */
    export class DirectionalLight extends Light
    {
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
            this.shadowCamera.transform.position = center.addTo(this.direction.scaleTo(radius + this.shadowNear).negate());
            this.shadowCamera.transform.lookAt(center, this.shadowCamera.transform.upVector);
            //
            this.shadowCamera.lens = new OrthographicLens(-radius, radius, radius, - radius, this.shadowNear, this.shadowNear + radius * 2);
        }
    }
}