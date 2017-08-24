var feng3d;
(function (feng3d) {
    /**
     * 按键捕获
     * @author feng 2016-4-26
     */
    var KeyCapture = (function () {
        /**
         * 构建
         * @param stage		舞台
         */
        function KeyCapture(shortCut) {
            /**
             * 捕获的按键字典
             */
            this._mouseKeyDic = {};
            this._keyState = shortCut.keyState;
            //
            feng3d.input.on("keydown", this.onKeydown, this);
            feng3d.input.on("keyup", this.onKeyup, this);
            this._boardKeyDic = {};
            this.defaultSupportKeys();
            //监听鼠标事件
            var mouseEvents = [
                "dblclick",
                "click",
                "mousedown",
                "mouseup",
                "middleclick",
                "middlemousedown",
                "middlemouseup",
                "rightclick",
                "rightmousedown",
                "rightmouseup",
                "mousemove",
                "mouseover",
                "mouseout",
            ];
            for (var i = 0; i < mouseEvents.length; i++) {
                feng3d.input.on(mouseEvents[i], this.onMouseOnce, this);
            }
            feng3d.input.on("mousewheel", this.onMousewheel, this);
        }
        /**
         * 默认支持按键
         */
        KeyCapture.prototype.defaultSupportKeys = function () {
            this._boardKeyDic[17] = "ctrl";
            this._boardKeyDic[16] = "shift";
            this._boardKeyDic[32] = "escape";
            this._boardKeyDic[18] = "alt";
            this._boardKeyDic[46] = "del";
        };
        /**
         * 鼠标事件
         */
        KeyCapture.prototype.onMouseOnce = function (event) {
            var mouseKey = event.type;
            this._keyState.pressKey(mouseKey, event.data);
            this._keyState.releaseKey(mouseKey, event.data);
        };
        /**
         * 鼠标事件
         */
        KeyCapture.prototype.onMousewheel = function (event) {
            var mouseKey = event.type;
            this._keyState.pressKey(mouseKey, event.data);
            this._keyState.releaseKey(mouseKey, event.data);
        };
        /**
         * 键盘按下事件
         */
        KeyCapture.prototype.onKeydown = function (event) {
            var boardKey = this.getBoardKey(event.data.keyCode);
            if (boardKey != null)
                this._keyState.pressKey(boardKey, event.data);
        };
        /**
         * 键盘弹起事件
         */
        KeyCapture.prototype.onKeyup = function (event) {
            var boardKey = this.getBoardKey(event.data.keyCode);
            if (boardKey)
                this._keyState.releaseKey(boardKey, event.data);
        };
        /**
         * 获取键盘按键名称
         */
        KeyCapture.prototype.getBoardKey = function (keyCode) {
            var boardKey = this._boardKeyDic[keyCode];
            if (boardKey == null && 65 <= keyCode && keyCode <= 90) {
                boardKey = String.fromCharCode(keyCode).toLocaleLowerCase();
            }
            return boardKey;
        };
        return KeyCapture;
    }());
    feng3d.KeyCapture = KeyCapture;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=KeyCapture.js.map