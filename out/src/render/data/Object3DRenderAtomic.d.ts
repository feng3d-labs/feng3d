declare namespace feng3d {
    class Object3DRenderAtomic extends RenderAtomic {
        private _invalidateRenderDataHolderList;
        renderHolderInvalid: boolean;
        private onInvalidate(event);
        private onAddElement(event);
        private onRemoveElement(event);
        private onInvalidateShader(event);
        private onAddRenderHolder(event);
        private onRemoveRenderHolder(event);
        private addInvalidateHolders(renderDataHolder);
        private addInvalidateShader(renderDataHolder);
        private renderDataHolders;
        private updateEverytimeList;
        addRenderDataHolder(renderDataHolder: RenderDataHolder | RenderDataHolder[]): void;
        removeRenderDataHolder(renderDataHolder: RenderDataHolder | RenderDataHolder[]): void;
        update(renderContext: RenderContext): void;
        clear(): void;
    }
}
