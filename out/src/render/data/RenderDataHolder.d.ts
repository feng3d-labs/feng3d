declare namespace feng3d {
    interface RenderDataHolderEventMap {
        /**
         * 添加渲染元素
         */
        addRenderElement: any;
        /**
         * 移除渲染元素
         */
        removeRenderElement: any;
        /**
         * 添加渲染数据拥有者
         */
        addRenderHolder: any;
        /**
         * 移除渲染数据拥有者
         */
        removeRenderHolder: any;
        /**
         * 渲染数据拥有者数据失效
         */
        invalidateRenderHolder: any;
    }
    interface RenderDataHolder {
        once<K extends keyof RenderDataHolderEventMap>(type: K, listener: (event: RenderDataHolderEventMap[K]) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof RenderDataHolderEventMap>(type: K, data?: RenderDataHolderEventMap[K], bubbles?: boolean): any;
        has<K extends keyof RenderDataHolderEventMap>(type: K): boolean;
        on<K extends keyof RenderDataHolderEventMap>(type: K, listener: (event: RenderDataHolderEventMap[K]) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof RenderDataHolderEventMap>(type?: K, listener?: (event: RenderDataHolderEventMap[K]) => any, thisObject?: any): any;
    }
    /**
     * 渲染数据拥有者
     * @author feng 2016-6-7
     */
    class RenderDataHolder extends RenderData {
        /**
         * 是否每次必须更新
         */
        readonly updateEverytime: boolean;
        protected _updateEverytime: boolean;
        readonly childrenRenderDataHolder: RenderDataHolder[];
        private _childrenRenderDataHolder;
        /**
         * 创建GL数据缓冲
         */
        constructor();
        /**
         * 收集渲染数据拥有者
         * @param renderAtomic 渲染原子
         */
        collectRenderDataHolder(renderAtomic?: Object3DRenderAtomic): void;
        addRenderDataHolder(renderDataHolder: RenderDataHolder): void;
        removeRenderDataHolder(renderDataHolder: RenderDataHolder): void;
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext: RenderContext, renderData: RenderAtomic): void;
        invalidateRenderHolder(): void;
    }
}
