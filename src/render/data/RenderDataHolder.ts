module feng3d {

    /**
	 * 渲染数据拥有者
	 * @author feng 2016-6-7
	 */
    export class RenderDataHolder extends Component {

        protected shaderName: string;

        //
        private _subRenderDataHolders: RenderDataHolder[] = [];

		/**
		 * 创建Context3D数据缓冲
		 */
        constructor() {

            super();
        }

		/**
		 * 激活
		 * @param renderData	渲染数据
		 */
        public activate(renderData: RenderAtomic, camera: Camera3D) {

            this._subRenderDataHolders.forEach(element => {
                element.activate(renderData, camera);
            });
        }

		/**
		 * 释放
		 * @param renderData	渲染数据
		 */
        public deactivate(renderData: RenderAtomic) {

            this._subRenderDataHolders.forEach(element => {
                element.deactivate(renderData);
            });
        }

		/**
		 * 添加组件到指定位置
		 * @param component		被添加的组件
		 * @param index			插入的位置
		 */
        public addComponentAt(component: IComponent, index: number): void {

            super.addComponentAt(component, index);
            if (component != null && is(component, RenderDataHolder)) {
                var renderDataHolder: RenderDataHolder = as(component, RenderDataHolder);
                var index = this._subRenderDataHolders.indexOf(renderDataHolder);
                if (index == -1) {
                    this._subRenderDataHolders.splice(index, 0, renderDataHolder);
                }
            }
        }

		/**
         * 移除组件
         * @param index		要删除的 Component 的子索引。
         */
        public removeComponentAt(index: number): IComponent {

            var component = this.components[index];
            if (component != null && is(component, RenderDataHolder)) {
                var renderDataHolder: RenderDataHolder = as(component, RenderDataHolder);
                var index = this._subRenderDataHolders.indexOf(renderDataHolder);
                if (index != -1) {
                    this._subRenderDataHolders.splice(index, 1);
                }
            }

            return super.removeComponentAt(index);
        }
    }
}