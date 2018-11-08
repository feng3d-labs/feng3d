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
            feng3d.feng3dDispatcher.on("assets.scriptChanged", this.onScriptChanged, this);
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
            if (cls)
                this.scriptInstance = new cls();
            else
                warn(`无法初始化脚本 ${this.scriptName}`);

            this.scriptInit = false;
        }

        private onScriptChanged()
        {
            var cls = classUtils.getDefinitionByName(this.scriptName, false);
            if (this.scriptInstance instanceof cls) return;

            var newInstance = new cls();
            Object.setValue(newInstance, <any>this.scriptInstance);
            this.scriptInstance = newInstance;
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

            feng3d.feng3dDispatcher.off("assets.scriptChanged", this.onScriptChanged, this);
        }
    }
}