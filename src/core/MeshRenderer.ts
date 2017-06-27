namespace feng3d
{
    /**
     * Renders meshes inserted by the MeshFilter or TextMesh.
     */
    export class MeshRenderer extends Renderer
    {
        /**
         * 构建
         */
        constructor(gameObject: GameObject)
        {
            super(gameObject);
            this._single = true;
        }

        public drawRenderables(renderContext: RenderContext)
        {
            if (this.gameObject.transform.isVisible)
            {
                var frustumPlanes = renderContext.camera.frustumPlanes;
                var gameObject = this.gameObject;
                var isIn = gameObject.transform.worldBounds.isInFrustum(frustumPlanes, 6);
                var model = gameObject.getComponent(MeshRenderer);
                if (gameObject.getComponent(MeshFilter).mesh instanceof SkyBoxGeometry)
                {
                    isIn = true;
                }
                if (isIn)
                {
                    super.drawRenderables(renderContext);
                }
            }
        }
    }
}