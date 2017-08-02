namespace feng3d
{
    /**
     * 3d对象脚本
     * @author feng 2017-03-11
     */
    export class Script extends Component
    {
        /**
         * 脚本路径
         */
        url = "";

        private _enabled = false;

        constructor(gameObject: GameObject)
        {
            super(gameObject);
            this.init();
        }

        /**
         * Enabled Behaviours are Updated, disabled Behaviours are not.
         */
        get enabled()
        {
            return this._enabled;
        }
        set enabled(value)
        {
            if (this._enabled == value)
                return;
            if (this._enabled)
                ticker.off("enterFrame", this.update, this);
            this._enabled = value;
            if (this._enabled)
                ticker.on("enterFrame", this.update, this);
        }

        /**
         * 初始化
         */
        init()
        {

        }

        /**
         * 更新
         */
        update()
        {

        }

        /**
         * 销毁
         */
        dispose()
        {
            this.enabled = false;
        }
    }
}