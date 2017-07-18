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
        script: string = "";

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
            if (this._enabled)
                Event.off(ticker, "enterFrame", this.update, this);
            this._enabled = value;
            if (this._enabled)
                Event.on(ticker, "enterFrame", this.update, this);
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
    }
}