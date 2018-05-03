namespace feng3d
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
    function draw(renderContext: RenderContext, renderObjectflag: GameObjectFlag)
    {
        var frustum = renderContext.camera.frustum;

        var meshRenderers = collectForwardRender(renderContext.scene3d.gameObject, frustum, renderObjectflag);

        var camerapos = renderContext.camera.transform.scenePosition;

        var maps = meshRenderers.map((item) =>
        {
            return {
                depth: item.transform.scenePosition.subTo(camerapos).length,
                item: item,
                enableBlend: item.material.renderParams.enableBlend,
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

        var gl = renderContext.gl;
        for (var i = 0; i < unblenditems.length; i++)
        {
            drawRenderables(unblenditems[i].item, renderContext)
        }

        for (var i = 0; i < blenditems.length; i++)
        {
            drawRenderables(blenditems[i].item, renderContext)
        }

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
        var renderAtomic = meshRenderer.gameObject.renderAtomic;

        renderAtomic.renderParams = material.renderParams;
        renderAtomic.shader = material.shader;

        meshRenderer.gameObject.preRender(renderAtomic);
        renderContext.preRender(renderAtomic);

        gl.renderer.draw(renderAtomic);
        // renderdatacollector.clearRenderDataHolder(renderContext, renderAtomic);

        // } catch (error)
        // {
        //     log(error);
        // }
    }

    function collectForwardRender(gameObject: GameObject, frustum: Frustum, renderObjectflag: GameObjectFlag)
    {
        if (!gameObject.visible)
            return [];
        if (!(renderObjectflag & gameObject.flag))
            return [];
        var meshRenderers: MeshRenderer[] = [];
        var meshRenderer = gameObject.getComponent(MeshRenderer);
        if (meshRenderer && meshRenderer.enabled)
        {
            var boundingComponent = gameObject.getComponent(BoundingComponent);
            if (boundingComponent.selfWorldBounds)
            {
                if (frustum.intersectsBox(boundingComponent.selfWorldBounds))
                    meshRenderers.push(meshRenderer);
            }
        }

        gameObject.children.forEach(element =>
        {
            meshRenderers = meshRenderers.concat(collectForwardRender(element, frustum, renderObjectflag));
        });
        return meshRenderers;
    }
}