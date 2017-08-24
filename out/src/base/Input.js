var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var feng3d;
(function (feng3d) {
    /**
     * 鼠标键盘输入，处理js事件中this关键字问题
     * @author feng 2016-12-19
     */
    var Input = (function (_super) {
        __extends(Input, _super);
        function Input() {
            var _this = _super.call(this) || this;
            _this.clientX = 0;
            _this.clientY = 0;
            var mouseKeyType = [
                "click", "dblclick",
                "mousedown", "mousemove", "mouseout", "mouseover", "mouseup", "mousewheel",
                "keydown", "keypress", "keyup"
            ];
            for (var i = 0; i < mouseKeyType.length; i++) {
                window.addEventListener(mouseKeyType[i], _this.onMouseKey.bind(_this));
            }
            return _this;
        }
        /**
         * 键盘按下事件
         */
        Input.prototype.onMouseKey = function (event) {
            if (event["clientX"] != undefined) {
                event = event;
                this.clientX = event.clientX;
                this.clientY = event.clientY;
            }
            var inputEvent = new InputEvent(event);
            this.dispatch(inputEvent.type, inputEvent, true);
        };
        return Input;
    }(feng3d.Event));
    feng3d.Input = Input;
    var InputEvent = (function () {
        function InputEvent(event) {
            this.type = event.type;
            if (event instanceof MouseEvent) {
                this.clientX = event.clientX;
                this.clientY = event.clientY;
                if (["click", "mousedown", "mouseup"].indexOf(event.type) != -1) {
                    var t = ["", "middle", "right"][event.button] + event.type;
                    this.type = t;
                }
            }
            if (event instanceof KeyboardEvent) {
                this.keyCode = event.keyCode;
            }
            if (event instanceof WheelEvent) {
                this.wheelDelta = event.wheelDelta;
            }
        }
        return InputEvent;
    }());
    feng3d.InputEvent = InputEvent;
    /**
     * 键盘鼠标输入
     */
    feng3d.input = new Input();
})(feng3d || (feng3d = {}));
//# sourceMappingURL=Input.js.map