namespace feng3d
{

    // export var renderdatacollector = {
    //     collectRenderDataHolder: collectRenderDataHolder,
    //     clearRenderDataHolder: clearRenderDataHolder,
    //     getsetRenderDataFuncs: getsetRenderDataFuncs,
    //     getclearRenderDataFuncs: getclearRenderDataFuncs,
    //     collectRenderDataHolderFuncs: collectRenderDataHolderFuncs,
    //     clearRenderDataHolderFuncs: clearRenderDataHolderFuncs,
    // };

    // function getsetRenderDataFuncs(renderDataHolder: RenderDataHolder)
    // {
    //     var updaterenderDataFuncs: updaterenderDataFunc[] = [];
    //     var renderDatamap = renderDataHolder.renderDatamap;
    //     for (var key in renderDatamap)
    //     {
    //         if (renderDatamap.hasOwnProperty(key))
    //         {
    //             updaterenderDataFuncs.push(renderDatamap[key].setfunc);
    //         }
    //     }
    //     return updaterenderDataFuncs;
    // }

    // function getclearRenderDataFuncs(renderDataHolder: RenderDataHolder)
    // {
    //     var updaterenderDataFuncs: updaterenderDataFunc[] = [];
    //     var renderDatamap = renderDataHolder.renderDatamap;
    //     for (var key in renderDatamap)
    //     {
    //         if (renderDatamap.hasOwnProperty(key))
    //         {
    //             updaterenderDataFuncs.push(renderDatamap[key].clearfunc);
    //         }
    //     }
    //     return updaterenderDataFuncs;
    // }


    // /**
    //  * 收集渲染数据拥有者
    //  * @param renderAtomic 渲染原子
    //  */
    // function collectRenderDataHolderFuncs(renderDataHolder: RenderDataHolder)
    // {
    //     var funcs: updaterenderDataFunc[] = [];
    //     funcs = funcs.concat(getsetRenderDataFuncs(renderDataHolder));
    //     renderDataHolder.childrenRenderDataHolder.forEach(element =>
    //     {
    //         funcs = funcs.concat(collectRenderDataHolderFuncs(element));
    //     });
    //     return funcs;
    // }

    // /**
    //  * 收集渲染数据拥有者
    //  * @param renderAtomic 渲染原子
    //  */
    // function clearRenderDataHolderFuncs(renderDataHolder: RenderDataHolder)
    // {
    //     var funcs: updaterenderDataFunc[] = [];
    //     funcs = funcs.concat(getclearRenderDataFuncs(renderDataHolder));
    //     renderDataHolder.childrenRenderDataHolder.forEach(element =>
    //     {
    //         funcs = funcs.concat(clearRenderDataHolderFuncs(element));
    //     });
    //     return funcs;
    // }

    // /**
    //  * 收集渲染数据拥有者
    //  * @param renderAtomic 渲染原子
    //  */
    // function collectRenderDataHolder(renderDataHolder: RenderDataHolder, renderAtomic: RenderAtomic)
    // {
    //     var funcs = collectRenderDataHolderFuncs(renderDataHolder);
    //     funcs.forEach(element =>
    //     {
    //         element(renderAtomic);
    //     });
    // }

    // /**
    //  * 收集渲染数据拥有者
    //  * @param renderAtomic 渲染原子
    //  */
    // function clearRenderDataHolder(renderDataHolder: RenderDataHolder, renderAtomic: RenderAtomic)
    // {
    //     var funcs = clearRenderDataHolderFuncs(renderDataHolder);
    //     funcs.forEach(element =>
    //     {
    //         element(renderAtomic);
    //     });
    // }
}