namespace feng3d
{
    export class Object3DRenderAtomic extends RenderAtomic
    {
        private _invalidateRenderDataHolderList: RenderDataHolder[] = [];
        renderHolderInvalid = true;

        private onInvalidate(event: EventVO)
        {
            var renderDataHolder = <RenderDataHolder>event.target;
            this.addInvalidateHolders(renderDataHolder);
        }

        private onAddElement(event: EventVO)
        {
            this.addRenderElement(event.data);
        }

        private onRemoveElement(event: EventVO)
        {
            this.removeRenderElement(event.data);
        }

        private onInvalidateShader(event: EventVO)
        {
            var renderDataHolder = <RenderDataHolder>event.target;
            this.addInvalidateShader(renderDataHolder);
        }

        private onAddRenderHolder(event: EventVO)
        {
            this.renderHolderInvalid = true;
            this.addRenderDataHolder(event.data);
        }

        private onRemoveRenderHolder(event: EventVO)
        {
            this.renderHolderInvalid = true;
            this.removeRenderDataHolder(event.data);
        }

        private addInvalidateHolders(renderDataHolder: RenderDataHolder)
        {
            if (this._invalidateRenderDataHolderList.indexOf(renderDataHolder) == -1)
            {
                this._invalidateRenderDataHolderList.push(renderDataHolder)
            }
        }

        private addInvalidateShader(renderDataHolder: RenderDataHolder)
        {
            this.invalidateShader();
        }

        private renderDataHolders: RenderDataHolder[] = [];
        private updateEverytimeList: RenderDataHolder[] = [];

        addRenderDataHolder(renderDataHolder: RenderDataHolder | RenderDataHolder[])
        {
            if (renderDataHolder instanceof RenderDataHolder)
            {
                this.addRenderDataHolder(renderDataHolder.childrenRenderDataHolder);
                var index = this.renderDataHolders.indexOf(renderDataHolder);
                if (index != -1)
                    return;
                this.renderDataHolders.push(renderDataHolder);
                if (renderDataHolder.updateEverytime)
                {
                    this.updateEverytimeList.push(renderDataHolder);
                }
                this.addRenderElement(renderDataHolder.elements);
                this.addInvalidateShader(renderDataHolder);
                this.addInvalidateHolders(renderDataHolder);
                renderDataHolder.on("addRenderElement", this.onAddElement, this);
                renderDataHolder.on("removeRenderElement", this.onRemoveElement, this);
                renderDataHolder.on("addRenderHolder", this.onAddRenderHolder, this);
                renderDataHolder.on("removeRenderHolder", this.onRemoveRenderHolder, this);
                renderDataHolder.on("invalidateRenderHolder", this.onInvalidate, this);
            } else
            {
                for (var i = 0; i < renderDataHolder.length; i++)
                {
                    this.addRenderDataHolder(renderDataHolder[i]);
                }
            }
        }

        removeRenderDataHolder(renderDataHolder: RenderDataHolder | RenderDataHolder[])
        {
            if (renderDataHolder instanceof Array)
            {
                for (var i = 0; i < renderDataHolder.length; i++)
                {
                    this.removeRenderDataHolder(renderDataHolder[i]);
                }
            } else
            {
                this.removeRenderDataHolder(renderDataHolder.childrenRenderDataHolder);
                var index = this.renderDataHolders.indexOf(renderDataHolder);
                if (index != -1)
                    this.renderDataHolders.splice(index, 1);
                if (renderDataHolder.updateEverytime)
                {
                    let index = this.updateEverytimeList.indexOf(renderDataHolder);
                    if (index != -1)
                        this.updateEverytimeList.splice(index, 1);
                }
                this.removeRenderElement(renderDataHolder.elements);
                this.addInvalidateShader(renderDataHolder);
                renderDataHolder.off("addRenderElement", this.onAddElement, this);
                renderDataHolder.off("removeRenderElement", this.onRemoveElement, this);
                renderDataHolder.off("addRenderHolder", this.onAddRenderHolder, this);
                renderDataHolder.off("removeRenderHolder", this.onRemoveRenderHolder, this);
            }
        }

        update(renderContext: RenderContext)
        {
            renderContext.updateRenderData1();
            this.addRenderDataHolder(renderContext);
            if (this.updateEverytimeList.length > 0)
            {
                this.updateEverytimeList.forEach(element =>
                {
                    element.updateRenderData(renderContext, this);
                });
            }
            if (this._invalidateRenderDataHolderList.length > 0)
            {
                this._invalidateRenderDataHolderList.forEach(element =>
                {
                    element.updateRenderData(renderContext, this);
                });
                this._invalidateRenderDataHolderList.length = 0;
            }
        }

        clear()
        {
            this.renderDataHolders.forEach(element =>
            {
                this.removeRenderDataHolder(element);
            });
        }
    }
}