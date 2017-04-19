module feng3d
{

    /**
     * 渲染原子（该对象会收集一切渲染所需数据以及参数）
     * @author feng 2016-06-20
     */
    export class RenderAtomic
    {
        /**
         * 顶点索引缓冲
         */
        public indexBuffer: IndexRenderData;

        /**
         * 顶点渲染程序代码
         */
        public vertexCode: string;

        /**
         * 片段渲染程序代码
         */
        public fragmentCode: string;

        /**
         * 属性数据列表
         */
        public attributes: { [name: string]: AttributeRenderData } = {};

        /**
         * 常量数据（包含纹理）列表
         */
        public uniforms: { [name: string]: number | number[] | Matrix3D | Vector3D | TextureInfo | Vector3D[] | Matrix3D[] } = {};

        /**
         * 渲染参数
         */
        public shaderParams: ShaderParams = <any>{};

        /**
         * 着色器宏定义
         */
        public shaderMacro = new ShaderMacro();

        /**
         * 渲染实例数量
         */
        public instanceCount: number;
    }

    export class Object3DRenderAtomic extends RenderAtomic
    {
        /**
         * 数据是否失效，需要重新收集数据
         */
        public static INVALIDATE = "invalidate";
        /**
         * 渲染拥有者失效，需要重新收集渲染数据拥有者
         */
        public static INVALIDATE_RENDERHOLDER = "invalidateRenderHolder";

        private _invalidateRenderDataHolderList: RenderDataHolder[] = [];
        public renderHolderInvalid = true;

        private invalidate(event: Event)
        {
            var renderDataHolder = <RenderDataHolder>event.target;
            this.addInvalidateHolders(renderDataHolder);
        }

        private invalidateRenderHolder()
        {
            this.renderHolderInvalid = true;
        }

        private addInvalidateHolders(renderDataHolder: RenderDataHolder)
        {
            if (this._invalidateRenderDataHolderList.indexOf(renderDataHolder) == -1)
            {
                this._invalidateRenderDataHolderList.push(renderDataHolder)
            }
        }

        private renderDataHolders: RenderDataHolder[] = [];
        private updateEverytimeList: RenderDataHolder[] = [];

        public addRenderDataHolder(renderDataHolder: RenderDataHolder)
        {
            this.renderDataHolders.push(renderDataHolder);
            if (renderDataHolder.updateEverytime)
            {
                this.updateEverytimeList.push(renderDataHolder);
            }
            this.addInvalidateHolders(renderDataHolder);
            renderDataHolder.addEventListener(Object3DRenderAtomic.INVALIDATE, this.invalidate, this)
            renderDataHolder.addEventListener(Object3DRenderAtomic.INVALIDATE_RENDERHOLDER, this.invalidateRenderHolder, this)
        }

        public update(renderContext: RenderContext)
        {
            renderContext.updateRenderData(this);
            this.updateEverytimeList.forEach(element =>
            {
                element.updateRenderData(renderContext, this);
            });
            this._invalidateRenderDataHolderList.forEach(element =>
            {
                element.updateRenderData(renderContext, this);
            });
            this._invalidateRenderDataHolderList.length = 0;
        }

        public clear()
        {
            this.renderDataHolders.forEach(element =>
            {
                element.removeEventListener(Object3DRenderAtomic.INVALIDATE, this.invalidate, this)
                element.removeEventListener(Object3DRenderAtomic.INVALIDATE_RENDERHOLDER, this.invalidateRenderHolder, this)
            });

            this.renderDataHolders.length = 0;
            this.updateEverytimeList.length = 0;
        }
    }
}