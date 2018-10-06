namespace feng3d
{
    /**
     * 3d对象脚本
     */
    export class Script
    {
        /**
         * The game object this component is attached to. A component is always attached to a game object.
         */
        get gameObject()
        {
            return this.component.gameObject;
        }

        /**
         * The Transform attached to this GameObject (null if there is none attached).
         */
        get transform()
        {
            return this.gameObject.transform;
        }

        /**
         * 宿主组件
         */
        component: ScriptComponent;

        constructor()
        {
        }

        /**
         * Use this for initialization
         */
        init()
        {

        }

        /**
         * Update is called once per frame
         * 每帧执行一次
         */
        update()
        {

        }

        /**
         * 销毁
         */
        dispose()
        {

        }
    }
}