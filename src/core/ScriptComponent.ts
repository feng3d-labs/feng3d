namespace feng3d
{
    /**
     * 3d对象脚本
     * @author feng 2017-03-11
     */
    export class ScriptComponent extends Behaviour
    {
        /**
         * 脚本对象
         */
        private scriptInstance: Script;

        @serialize
        scriptData: Object;

        /**
         * 脚本路径
         */
        @oav({ component: "OAVPick", componentParam: { accepttype: "file_script" } })
        @serialize
        get script()
        {
            return this._script;
        }
        set script(value)
        {
            if (this._script == value)
                return;
            this._script = value;
            this.initScript();
        }
        private _script = "";

        init(gameObject: GameObject)
        {
            super.init(gameObject);
            this.initScript();
            this.enabled = this.enabled;
        }

        private initScript()
        {
            if (this._script && this.gameObject && runEnvironment == RunEnvironment.feng3d)
            {
                var cls = classUtils.getDefinitionByName(this._script);
                this.scriptInstance = new cls(this);
                var scriptData = this.scriptData = this.scriptData || {};
                for (const key in scriptData)
                {
                    if (scriptData.hasOwnProperty(key))
                    {
                        this.scriptInstance[key] = scriptData[key];
                    }
                }
                this.scriptInstance.init();
            }
        }

        /**
         * 每帧执行
         */
        update()
        {
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