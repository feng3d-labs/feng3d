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
        @oav({ component: "OAVPick", componentParam: { accepttype: "file_script" } })
        get scriptName()
        {
            return this._scriptName;
        }
        set scriptName(v)
        {
            if (this._scriptName == v) return;
            this._scriptName = v;
            this.invalidateScriptInstance();
        }
        private _scriptName: string;

        /**
         * 脚本对象
         */
        @serialize
        get scriptInstance()
        {
            if (this._invalid) this.updateScriptInstance();
            return this._scriptInstance;
        }
        private _scriptInstance: Script;

        private _invalid = true;

        private scriptInit = false;

        init()
        {
            super.init();
            feng3d.globalDispatcher.on("asset.scriptChanged", this.invalidateScriptInstance, this);
        }

        private updateScriptInstance()
        {
            var oldInstance = this._scriptInstance;
            this._scriptInstance = null;
            if (!this.scriptName) return;

            var cls = classUtils.getDefinitionByName(this.scriptName, false);

            if (cls) this._scriptInstance = new cls();
            else console.warn(`无法初始化脚本 ${this.scriptName}`);

            this.scriptInit = false;

            // 移除旧实例
            if (oldInstance)
            {
                // 如果两个类定义名称相同，则保留上个对象数据
                if (classUtils.getQualifiedClassName(oldInstance) == this.scriptName)
                {
                    serialization.setValue(this._scriptInstance, oldInstance);
                }
                oldInstance.component = null;
                oldInstance.dispose();
            }
            this._invalid = false;
        }

        private invalidateScriptInstance()
        {
            this._invalid = true;
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

            if (this._scriptInstance)
            {
                this._scriptInstance.component = null;
                this._scriptInstance.dispose();
                this._scriptInstance = null;
            }
            super.dispose();

            feng3d.globalDispatcher.off("asset.scriptChanged", this.invalidateScriptInstance, this);
        }
    }
}