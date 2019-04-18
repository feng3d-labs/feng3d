namespace feng3d
{

    /**
     * 前向渲染器

     */
    export var forwardRenderer: ForwardRenderer;

    /**
     * 前向渲染器

     */
    export class ForwardRenderer
    {
        /**
         * 渲染
         */
        draw(gl: GL, scene3d: Scene3D, camera: Camera)
        {
            var blenditems = scene3d.getPickCache(camera).blenditems;
            var unblenditems = scene3d.getPickCache(camera).unblenditems;

            var uniforms: LazyObject<Uniforms> = <any>{};
            //
            uniforms.u_projectionMatrix = camera.lens.matrix;
            uniforms.u_viewProjection = camera.viewProjection;
            uniforms.u_viewMatrix = camera.transform.worldToLocalMatrix;
            uniforms.u_cameraMatrix = camera.transform.localToWorldMatrix;
            uniforms.u_cameraPos = camera.transform.scenePosition;
            uniforms.u_skyBoxSize = camera.lens.far / Math.sqrt(3);
            uniforms.u_scaleByDepth = camera.getScaleByDepth(1);
            uniforms.u_sceneAmbientColor = scene3d.ambientColor;

            unblenditems.concat(blenditems).forEach(model =>
            {
                //绘制
                var renderAtomic = model.gameObject.renderAtomic;

                for (const key in uniforms)
                {
                    renderAtomic.uniforms[key] = uniforms[key];
                }

                model.gameObject.beforeRender(gl, renderAtomic, scene3d, camera);

                gl.renderer.draw(renderAtomic);
            });
        }
    }

    forwardRenderer = new ForwardRenderer();
}