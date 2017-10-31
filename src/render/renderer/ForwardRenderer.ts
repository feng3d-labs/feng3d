module feng3d
{

    /**
     * 前向渲染器
     * @author feng 2017-02-20
     */
    export var forwardRenderer = {
        draw: draw,
    };

    /**
     * 渲染
     */
    function draw(renderContext: RenderContext, viewRect: Rectangle)
    {
        renderContext.updateRenderData1();

        var frustumPlanes = renderContext.camera.frustumPlanes;

        var meshRenderers = collectForwardRender(renderContext.scene3d.gameObject, frustumPlanes);

        var camerapos = renderContext.camera.transform.scenePosition;

        var maps = meshRenderers.map((item) =>
        {
            return {
                depth: item.transform.scenePosition.subtract(camerapos).length,
                item: item,
                enableBlend: item.material.enableBlend,
            }
        });

        var blenditems = maps.filter((item) => { return item.enableBlend; });
        var unblenditems = maps.filter((item) => { return !item.enableBlend; });

        blenditems = blenditems.sort((a, b) =>
        {
            return b.depth - a.depth;
        });
        unblenditems = unblenditems.sort((a, b) =>
        {
            return a.depth - b.depth;
        });

        renderContext.gl.enable(GL.DEPTH_TEST);
        renderContext.gl.depthMask(true);
        for (var i = 0; i < unblenditems.length; i++)
        {
            drawRenderables(unblenditems[i].item, renderContext)
        }

        renderContext.gl.depthMask(false);
        for (var i = 0; i < blenditems.length; i++)
        {
            drawRenderables(blenditems[i].item, renderContext)
        }
        renderContext.gl.depthMask(true);

        return { blenditems: blenditems, unblenditems: unblenditems };
    }

    function drawRenderables(meshRenderer: MeshRenderer, renderContext: RenderContext)
    {
        //更新数据
        var gl = renderContext.gl;
        // try
        // {
        //绘制
        var material = meshRenderer.material;
        if (material.cullFace)
        {
            gl.enable(GL.CULL_FACE);
            gl.cullFace(material.cullFace);
            gl.frontFace(GL.CW);
        } else
        {
            gl.disable(GL.CULL_FACE);
        }

        if (material.enableBlend)
        {
            //
            gl.enable(GL.BLEND);
            gl.blendEquation(material.blendEquation);
            gl.blendFunc(material.sfactor, material.dfactor);
        } else
        {
            gl.disable(GL.BLEND);
        }
        var renderAtomic = meshRenderer.getComponent(RenderAtomicComponent);
        renderdatacollector.collectRenderDataHolder(renderContext, renderAtomic);
        renderAtomic.update();
        drawObject3D(gl, renderAtomic);            //
        // renderdatacollector.clearRenderDataHolder(renderContext, renderAtomic);

        // } catch (error)
        // {
        //     console.log(error);
        // }
    }

    /**
     * 绘制3D对象
     */
    function drawObject3D(gl: GL, renderAtomic: RenderAtomic, shader?: Shader)
    {
        shader = shader || renderAtomic.shader;
        var shaderProgram = shader.activeShaderProgram(gl);
        if (!shaderProgram)
            return;
        //
        renderer.activeAttributes(renderAtomic, gl, shaderProgram.attributes);
        renderer.activeUniforms(renderAtomic, gl, shaderProgram.uniforms);
        renderer.dodraw(renderAtomic, gl);
    }

    function collectForwardRender(gameObject: GameObject, frustumPlanes: Plane3D[])
    {
        if (!gameObject.visible)
            return [];
        var meshRenderers: MeshRenderer[] = [];
        var meshRenderer = gameObject.getComponent(MeshRenderer);
        if (meshRenderer)
        {
            var boundingComponent = gameObject.getComponent(BoundingComponent);
            if (boundingComponent.worldBounds)
            {
                if (bounding.isInFrustum(boundingComponent.worldBounds, frustumPlanes, 6))
                    meshRenderers.push(meshRenderer);
            }
        }

        gameObject.children.forEach(element =>
        {
            meshRenderers = meshRenderers.concat(collectForwardRender(element, frustumPlanes));
        });
        return meshRenderers;
    }
}