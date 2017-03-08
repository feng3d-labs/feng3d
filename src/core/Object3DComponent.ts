module feng3d
{

    /**
     * 3D对象组件
     * @author feng 2016-09-02
     */
    export class Object3DComponent extends RenderDataHolder
    {

        /**
         * 父组件
         */
        protected _parentComponent: Object3D;

        /**
         * 所属对象
         */
        public get object3D(): Object3D { return this._parentComponent; }

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
        public dispatchEvent(event: Event): void
        {
            super.dispatchEvent(event);
            this.object3D && this.object3D.dispatchEvent(event);
        }
    }
}