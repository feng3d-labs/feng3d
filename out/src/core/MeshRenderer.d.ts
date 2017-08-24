declare namespace feng3d {
    /**
     * Renders meshes inserted by the MeshFilter or TextMesh.
     */
    class MeshRenderer extends Renderer {
        readonly single: boolean;
        /**
         * 构建
         */
        constructor(gameObject: GameObject);
        drawRenderables(renderContext: RenderContext): void;
    }
}
