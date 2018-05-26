namespace feng3d
{
    export enum ScriptFlag
    {
        feng3d = 1 << 0,
        editor = 1 << 1,
        all = (1 << 8) - 1,
    }

    /**
     * Behaviours are Components that can be enabled or disabled.
     * 
     * 行为
     * 
     * 可以控制开关的组件
     */
    export class Behaviour extends Component
    {
        /**
         * Enabled Behaviours are Updated, disabled Behaviours are not.
         */
        @oav()
        @serialize
        enabled = true;

        flag = ScriptFlag.all;

        /**
         * Has the Behaviour had enabled called.
         * 是否所在GameObject显示且该行为已启动。
         */
        get isVisibleAndEnabled()
        {
            var v = this.enabled && this.gameObject && this.gameObject.visible;
            return v;
        }

        /**
         * 每帧执行
         */
        update(interval?: number)
        {
        }

        dispose()
        {
            this.enabled = false;
            super.dispose();
        }
    }
}