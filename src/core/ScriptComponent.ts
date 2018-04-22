namespace feng3d
{
    export enum ScriptFlag
    {
        feng3d = 1,
        editor = 2,
    }

    /**
     * 3d对象脚本
     * @author feng 2017-03-11
     */
    export class ScriptComponent extends Behaviour
    {
        flag = ScriptFlag.feng3d;
        /**
         * 脚本对象
         */
        private _script: Script;

        /**
         * 脚本路径
         */
        @oav({ componentParam: { dragparam: { accepttype: "file_script" }, textEnabled: false } })
        @serialize()
        get url()
        {
            return this._url;
        }
        set url(value)
        {
            if (this._url == value)
                return;
            this._url = value;
            this.initScript();
        }
        private _url = "";

        init(gameObject: GameObject)
        {
            super.init(gameObject);
            this.initScript();
            this.enabled = this.enabled;
        }

        private initScript()
        {
            if (this._url && this.gameObject && runEnvironment == RunEnvironment.feng3d)
            {
                GameObjectUtil.addScript(this.gameObject, this._url, (scriptClass) =>
                {
                    this._script = new scriptClass(this);
                });
            }
        }

        /**
         * 每帧执行
         */
        update()
        {
            this._script && this._script.update();
        }

        /**
         * 销毁
         */
        dispose()
        {
            this.enabled = false;
            this._script && this._script.dispose();
            this._script = null;
            super.dispose();
        }
    }
}