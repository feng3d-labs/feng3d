module feng3d
{
    /**
     * 网格渲染器
     * @author feng 2016-12-12
     */
    export class Model extends Object3DComponent
    {
        /**
         * 几何体
         */
        public geometry: Geometry;
        /**
         * 材质
         */
        public material: Material;

        /**
         * 构建
         */
        constructor()
        {
            super();
            this._single = true;

            Watcher.watch(this, ["geometry"], this.invalidateRenderHolder, this);
            Watcher.watch(this, ["material"], this.invalidateRenderHolder, this);
        }

        /**
         * 收集渲染数据拥有者
         * @param renderAtomic 渲染原子
         */
        public collectRenderDataHolder(renderAtomic: Object3DRenderAtomic = null)
        {
            var material = this.material || defaultMaterial;
            var geometry = this.geometry || defaultGeometry;
            geometry && geometry.collectRenderDataHolder(renderAtomic);
            material && material.collectRenderDataHolder(renderAtomic);
            super.collectRenderDataHolder(renderAtomic);
        }
    }
}