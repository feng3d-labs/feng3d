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
        draw(gl: WebGLRenderer, scene: Scene, camera: Camera)
        {
            
            
            var blenditems = scene.getPickCache(camera).blenditems;
            var unblenditems = scene.getPickCache(camera).unblenditems;

            var uniforms: LazyObject<Uniforms> = <any>{};
            //
            uniforms.u_projectionMatrix = camera.lens.matrix;
            uniforms.u_viewProjection = camera.viewProjection;
            uniforms.u_viewMatrix = camera.transform.worldToLocalMatrix;
            uniforms.u_cameraMatrix = camera.transform.localToWorldMatrix;
            uniforms.u_cameraPos = camera.transform.worldPosition;
            uniforms.u_skyBoxSize = camera.lens.far / Math.sqrt(3);
            uniforms.u_scaleByDepth = camera.getScaleByDepth(1);
            uniforms.u_sceneAmbientColor = scene.ambientColor;

            var ctime = (Date.now() / 1000) % 3600;
            uniforms._Time = new Vector4(ctime / 20, ctime, ctime * 2, ctime * 3);

            unblenditems.concat(blenditems).forEach(renderable =>
            {
                //绘制
                var renderAtomic = renderable.renderAtomic;

                for (const key in uniforms)
                {
                    renderAtomic.uniforms[key] = uniforms[key];
                }
                //
                renderAtomic.uniforms.u_mvMatrix = () =>
                {
                    return lazy.getvalue(renderAtomic.uniforms.u_modelMatrix).clone().append(lazy.getvalue(renderAtomic.uniforms.u_viewMatrix))
                };
                renderAtomic.uniforms.u_ITMVMatrix = () =>
                {
                    return lazy.getvalue(renderAtomic.uniforms.u_mvMatrix).clone().invert().transpose()
                };

                renderAtomic.shaderMacro.RotationOrder = mathUtil.DefaultRotationOrder;

                renderable.beforeRender(renderAtomic, scene, camera);

                gl.render(renderAtomic);
            });
        }
    }

    forwardRenderer = new ForwardRenderer();
}