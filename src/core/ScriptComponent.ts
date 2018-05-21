namespace feng3d
{
    /**
     * 3d对象脚本
     * @author feng 2017-03-11
     */
    export class ScriptComponent extends Behaviour
    {
        /**
         * 脚本路径
         */
        @oav({ component: "OAVPick", componentParam: { accepttype: "file_script" } })
        @serialize
        @watch("scriptChanged")
        script = "";

        /**
         * 脚本对象
         */
        @serialize
        scriptInstance: Script;

        init(gameObject: GameObject)
        {
            super.init(gameObject);
            if (runEnvironment == RunEnvironment.feng3d)
            {
                this.scriptInstance && this.scriptInstance.init();
            }
        }

        private scriptChanged()
        {
            if (this.scriptInstance)
            {
                if (runEnvironment == RunEnvironment.feng3d)
                {
                    this.scriptInstance.dispose();
                }
                this.scriptInstance = null;
            }
            if (this.script)
            {
                var cls = classUtils.getDefinitionByName(this.script);
                this.scriptInstance = new cls(this);
                if (runEnvironment == RunEnvironment.feng3d)
                {
                    if (this.gameObject)
                        this.scriptInstance.init();
                }
            }
        }

        /**
         * 每帧执行
         */
        update()
        {
            if (runEnvironment == RunEnvironment.feng3d)
            {
                this.scriptInstance && this.scriptInstance.update();
            }
        }

        /**
         * 销毁
         */
        dispose()
        {
            this.enabled = false;

            if (runEnvironment == RunEnvironment.feng3d)
            {
                this.scriptInstance && this.scriptInstance.dispose();
            }
            this.scriptInstance = null;
            super.dispose();
        }
    }
}