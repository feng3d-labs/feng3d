module feng3d
{

    /**
     * 3D对象组件
     * @author feng 2016-09-02
     */
    export abstract class Object3DComponent extends RenderDataHolder
    {
        /**
         * 父组件,所属3d对象
         */
        public parentComponent: GameObject;

        /**
         * 构建3D对象组件
         */
        constructor()
        {
            super();
        }

        /**
         * 派发事件，该事件将会强制冒泡到3D对象中
		 * @param event						调度到事件流中的 Event 对象。
         */
        public dispatchEvent(event: Event): boolean
        {
            var result = super.dispatchEvent(event);
            if (result)
            {
                this.parentComponent && this.parentComponent.dispatchEvent(event);
            }
            return result;
        }
    }
}