namespace feng3d
{

    export interface ComponentMap { DirectionalLight: DirectionalLight; }

    /**
     * 方向光源
     */
    @AddComponentMenu("Rendering/DirectionalLight")
    @RegisterComponent()
    export class DirectionalLight extends Light
    {
        static create(name = "DirectionalLight")
        {
            var gameObject = new Entity();
            gameObject.name = name;
            var directionalLight = gameObject.addComponent(Node3D).addComponent(DirectionalLight);
            return directionalLight;
        }
        __class__: "feng3d.DirectionalLight";

        lightType = LightType.Directional;

        private orthographicLens: OrthographicLens;

        /**
         * 光源位置
         */
        get position()
        {
            return this.shadowCamera.node3d.worldPosition;
        }

        constructor()
        {
            super();
        }

        /**
         * 通过视窗摄像机进行更新
         * @param viewCamera 视窗摄像机
         */
        updateShadowByCamera(scene: Scene, viewCamera: Camera, models: Renderable[])
        {
            var worldBounds: Box3 = models.reduce((pre: Box3, i) =>
            {
                var box = i.node3d.boundingBox.worldBounds;
                if (!pre)
                    return box.clone();
                pre.union(box);
                return pre;
            }, null) || new Box3(new Vector3(), new Vector3(1, 1, 1));

            // 
            var center = worldBounds.getCenter();
            var radius = worldBounds.getSize().length / 2;
            // 
            this.shadowCamera.node3d.position = center.addTo(this.direction.scaleNumberTo(radius + this.shadowCameraNear).negate());
            this.shadowCamera.node3d.lookAt(center, this.shadowCamera.node3d.matrix.getAxisY());
            //
            if (!this.orthographicLens)
            {
                this.shadowCamera.lens = this.orthographicLens = new OrthographicLens(radius, 1, this.shadowCameraNear, this.shadowCameraNear + radius * 2);
            } else
            {
                serialization.setValue(this.orthographicLens, { size: radius, near: this.shadowCameraNear, far: this.shadowCameraNear + radius * 2 });
            }
        }
    }

    Entity.registerPrimitive("Directional light", (g) =>
    {
        g.addComponent(DirectionalLight);
    });

    export interface PrimitiveEntity
    {
        "Directional light": Entity;
    }
}