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

        /**
         * 脚本路径
         */
        @oav({ componentParam: { dragparam: { accepttype: "file_script" } } })
        get url()
        {
            return this._url;
        }
        set url(value)
        {
            if (this._url == value)
                return;
            this._url = value;
            if (value)
            {
                GameObjectUtil.addScript(this.gameObject, value.replace(/\.ts\b/, ".js"), () =>
                {
                    this.gameObject.removeComponent(this);
                });
            }
        }
        private _url = "";

        private _enabled = false;

        init(gameObject: GameObject)
        {
            super.init(gameObject);
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