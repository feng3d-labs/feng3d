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
        get entity()
        {
            return this.component.entity;
        }

        /**
         * The Transform attached to this Entity (null if there is none attached).
         */
        get node3d()
        {
            return this.component.node3d;
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