module feng3d
{

    /**
     * 鼠标键盘输入，处理js事件中this关键字问题
     * @author feng 2016-12-19
     */
    export class MouseKeyInput extends EventDispatcher
    {

        /**
         * 构建
         */
        constructor()
        {
            super();
            this.init();
        }

        /**
         * 初始化
         */
        private init()
        {

            for (var key in $mouseKeyType)
            {
                window.addEventListener(key, this.onMouseKey.bind(this));
            }
        }

        /**
		 * 键盘按下事件
		 */
        private onMouseKey(event: MouseEvent): void
        {

            this.dispatchEvent(new Event(event.type, event, event.bubbles));
        }
    }

    /**
     * 鼠标事件类型
     */
    export var $mouseKeyType = {
        /** 鼠标单击 */
        "click": "click",
        /** 鼠标双击 */
        "dblclick": "dblclick",
        /** 鼠标按下 */
        "mousedown": "mousedown",
        /** 鼠标移动 */
        "mousemove": "mousemove",
        /** 鼠标移出 */
        "mouseout": "mouseout",
        /** 鼠标移入 */
        "mouseover": "mouseover",
        /** 鼠标弹起 */
        "mouseup": "mouseup",
        /** 键盘按下 */
        "keydown": "keydown",
        /** 键盘按着 */
        "keypress": "keypress",
        /** 键盘弹起 */
        "keyup": "keyup"
    };

    /**
     * 鼠标键盘输入
     */
    export var $mouseKeyInput = new MouseKeyInput();
}