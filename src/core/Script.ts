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
    export class Script extends Component
    {
        flag = ScriptFlag.feng3d;
        scriptcomponent: Component;

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
            if (value && this.gameObject && runEnvironment == RunEnvironment.feng3d)
            {
                GameObjectUtil.addScript(this.gameObject, value, (scriptcomponent) =>
                {
                    this.scriptcomponent && this.gameObject.removeComponent(this.scriptcomponent);
                    this.scriptcomponent = scriptcomponent;
                });
            }
        }
        private _url = "";

        private _enabled = false;

        init(gameObject: GameObject)
        {
            super.init(gameObject);
            if (this._url && this.gameObject && runEnvironment == RunEnvironment.feng3d)
            {
                GameObjectUtil.addScript(this.gameObject, this._url, (scriptcomponent) =>
                {
                    this.scriptcomponent = scriptcomponent;
                });
            }
            this.start();
        }

        /**
         * 初始化时调用
         */
        start()
        {

        }

        /**
         * Enabled Behaviours are Updated, disabled Behaviours are not.
         */
        @oav()
        @serialize()
        enabled = false;

        /**
         * 更新
         */
        update()
        {

        }

        /**
         * 销毁时调用
         */
        end()
        {

        }

        /**
         * 销毁
         */
        dispose()
        {
            this.end();
            this.enabled = false;
            super.dispose();
        }
    }
}