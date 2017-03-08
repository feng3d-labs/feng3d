module feng3d
{

    /**
     * 绑定工具类
     */
    export class Binding
    {

        /**
         * （单向）绑定属性
         * @param host 用于承载要监视的属性或属性链的对象。
         * 当 <code>host</code>上<code>chain</code>所对应的值发生改变时，<code>target</code>上的<code>prop</code>属性将被自动更新。
         * @param chain 用于指定要监视的属性链的值。例如，要监视属性 <code>host.a.b.c</code>，需按以下形式调用此方法：<code>bindProperty(host, ["a","b","c"], ...)。</code>
         * @param target 本次绑定要更新的目标对象。
         * @param prop 本次绑定要更新的目标属性名称。
         * @returns 如果已为 chain 参数至少指定了一个属性名称，则返回 Watcher 实例；否则返回 null。
         */
        public static bindProperty(host: any, chain: string[], target: any, prop: string): Watcher
        {
            let watcher = Watcher.watch(host, chain, null, null);
            if (watcher)
            {
                let assign = function (value: any): void
                {
                    target[prop] = value;
                };
                watcher.setHandler(assign, null);
            }
            return watcher;
        }

        /**
         * 双向绑定属性
         */
        public static bothBindProperty(hosta: any, chaina: string[], hostb: any, chainb: string[])
        {
            var bothBind = new BothBind(hosta, chaina, hostb, chainb);
            return bothBind;
        }
    }

    export class BothBind
    {
        private _watchera: Watcher;
        private _watcherb: Watcher;

        constructor(hosta: any, chaina: string[], hostb: any, chainb: string[])
        {
            this._watchera = Watcher.watch(hosta, chaina, this.todata, this);
            this._watcherb = Watcher.watch(hostb, chainb, this.fromdata, this);
        }

        private todata()
        {
            var value = this._watchera.getValue();
            if (value !== undefined)
            {
                this._watcherb.setValue(value);
            }
        }

        private fromdata()
        {
            var value = this._watcherb.getValue();
            if (value !== undefined)
            {
                this._watchera.setValue(value);
            }
        }

        public unwatch()
        {
            this._watchera.unwatch();
            this._watcherb.unwatch();
        }
    }
}