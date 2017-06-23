namespace feng3d
{
    export class Object3DRenderAtomic extends RenderAtomic
    {
        /**
         * 添加渲染元素
         */
        public static ADD_RENDERELEMENT = "addRenderElement";
        /**
         * 移除渲染元素
         */
        public static REMOVE_RENDERELEMENT = "removeRenderElement";
        /**
         * 添加渲染数据拥有者
         */
        public static ADD_RENDERHOLDER = "addRenderHolder";
        /**
         * 移除渲染数据拥有者
         */
        public static REMOVE_RENDERHOLDER = "removeRenderHolder";

        private _invalidateRenderDataHolderList: RenderDataHolder[] = [];
        public renderHolderInvalid = true;

        private onInvalidate(event: Event)
        {
            var renderDataHolder = <RenderDataHolder>event.target;
            this.addInvalidateHolders(renderDataHolder);
        }

        private onAddElement(event: Event)
        {
            this.addRenderElement(event.data);
        }

        private onRemoveElement(event: Event)
        {
            this.removeRenderElement(event.data);
        }

        private onInvalidateShader(event: Event)
        {
            var renderDataHolder = <RenderDataHolder>event.target;
            this.addInvalidateShader(renderDataHolder);
        }

        private onAddRenderHolder(event: Event)
        {
            this.renderHolderInvalid = true;
            this.addRenderDataHolder(event.data);
        }

        private onRemoveRenderHolder(event: Event)
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

        public addRenderDataHolder(renderDataHolder: RenderDataHolder|RenderDataHolder[])
        {
            if(renderDataHolder instanceof RenderDataHolder)
            {
                this.addRenderDataHolder(renderDataHolder.childrenRenderDataHolder);
                this.renderDataHolders.push(renderDataHolder);
                if (renderDataHolder.updateEverytime)
                {
                    this.updateEverytimeList.push(renderDataHolder);
                }
                this.addRenderElement(renderDataHolder.elements);
                this.addInvalidateShader(renderDataHolder);
                renderDataHolder.addEventListener(Object3DRenderAtomic.ADD_RENDERELEMENT, this.onAddElement, this);
                renderDataHolder.addEventListener(Object3DRenderAtomic.REMOVE_RENDERELEMENT, this.onRemoveElement, this);
                renderDataHolder.addEventListener(Object3DRenderAtomic.ADD_RENDERHOLDER, this.onAddRenderHolder, this);
                renderDataHolder.addEventListener(Object3DRenderAtomic.REMOVE_RENDERHOLDER, this.onRemoveRenderHolder, this);
            }else{
                for (var i = 0; i < renderDataHolder.length; i++) {
                    this.addRenderDataHolder(renderDataHolder[i]);
                }
            }
        }

        public removeRenderDataHolder(renderDataHolder: RenderDataHolder|RenderDataHolder[])
        {
            if(renderDataHolder instanceof Array)
            {
                for (var i = 0; i < renderDataHolder.length; i++) {
                    this.removeRenderDataHolder(renderDataHolder[i]);
                }
            }else{
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
                renderDataHolder.removeEventListener(Object3DRenderAtomic.ADD_RENDERELEMENT, this.onAddElement, this);
                renderDataHolder.removeEventListener(Object3DRenderAtomic.REMOVE_RENDERELEMENT, this.onRemoveElement, this);
                renderDataHolder.removeEventListener(Object3DRenderAtomic.ADD_RENDERHOLDER, this.onAddRenderHolder, this);
                renderDataHolder.removeEventListener(Object3DRenderAtomic.REMOVE_RENDERHOLDER, this.onRemoveRenderHolder, this);
            }
        }

        public update(renderContext: RenderContext)
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

        public clear()
        {
            this.renderDataHolders.forEach(element =>
            {
                this.removeRenderDataHolder(element);
            });
        }
    }
}