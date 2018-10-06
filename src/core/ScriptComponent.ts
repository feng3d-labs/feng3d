namespace feng3d
{

    export interface ComponentMap { ScriptComponent: ScriptComponent; }

    /**
     * 3d对象脚本

     */
    export class ScriptComponent extends Behaviour
    {

        runEnvironment = RunEnvironment.feng3d;

        @serialize
        @watch("scriptChanged")
        @oav({ component: "OAVPick", componentParam: { accepttype: "file_script" } })
        scriptName: string;

        /**
         * 脚本对象
         */
        @serialize
        scriptInstance: Script;

        private scriptInit = false;

        init(gameObject: GameObject)
        {
            super.init(gameObject);
        }

        private scriptChanged(property, oldValue: Script, newValue: Script)
        {
            if (this.scriptInstance)
            {
                this.scriptInstance.component = null;
                this.scriptInstance.dispose();
                this.scriptInstance = null;
            }

            var cls = classUtils.getDefinitionByName(this.scriptName, false);
            cls && (this.scriptInstance = new cls());

            this.scriptInit = false;
        }

        /**
         * 每帧执行
         */
        update()
        {
            if (this.scriptInstance && !this.scriptInit)
            {
                this.scriptInstance.component = this;
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

            if (this.scriptInstance)
            {
                this.scriptInstance.component = null;
                this.scriptInstance.dispose();
                this.scriptInstance = null;
            }
            super.dispose();
        }
    }
}