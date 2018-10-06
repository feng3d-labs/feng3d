namespace feng3d
{

    export interface ComponentMap { ScriptComponent: ScriptComponent; }

    /**
     * 3d对象脚本

     */
    export class ScriptComponent extends Behaviour
    {

        runEnvironment = RunEnvironment.feng3d;

        /**
         * 脚本对象
         */
        @serialize
        @watch("scriptChanged")
        @oav({ component: "OAVPick", componentParam: { accepttype: "file_script" } })
        scriptInstance: Script;

        private scriptInit = false;

        init(gameObject: GameObject)
        {
            super.init(gameObject);
        }

        private scriptChanged(property, oldValue: Script, newValue: Script)
        {
            if (oldValue) oldValue.dispose();
            this.scriptInit = false;
        }

        /**
         * 每帧执行
         */
        update()
        {
            if (this.scriptInstance && !this.scriptInit)
            {
                this.scriptInstance.init();
                this.scriptInit = true;
            }
            this.scriptInstance && this.scriptInstance.update();
        }

        /**
         * 销毁
         */
        dispose()
        {
            this.enabled = false;

            this.scriptInstance && this.scriptInstance.dispose();
            this.scriptInstance = null;
            super.dispose();
        }
    }
}