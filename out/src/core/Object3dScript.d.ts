declare namespace feng3d {
    /**
     * 3d对象脚本
     * @author feng 2017-03-11
     */
    class Script extends Component {
        /**
         * 脚本路径
         */
        url: string;
        private _enabled;
        constructor(gameObject: GameObject);
        /**
         * Enabled Behaviours are Updated, disabled Behaviours are not.
         */
        enabled: boolean;
        /**
         * 初始化
         */
        init(): void;
        /**
         * 更新
         */
        update(): void;
        /**
         * 销毁
         */
        dispose(): void;
    }
}
