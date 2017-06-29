var feng3d;
(function (feng3d) {
    /**
     * 事件适配器
     */
    var Event = (function () {
        function Event() {
        }
        Event.getBubbleTargets = function (target) {
            return [target["parent"]];
        };
        /**
         * 监听一次事件后将会被移除
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        Event.once = function (target, type, listener, thisObject, priority) {
            if (priority === void 0) { priority = 0; }
            this.on(target, type, listener, thisObject, priority, true);
        };
        /**
         * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEvent 对象。
         * @param target                    事件主体
         * @param type                      事件的类型。类型区分大小写。
         * @param data                      事件携带的自定义数据。
         * @param bubbles                      表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
         */
        Event.dispatch = function (target, type, data, bubbles) {
            if (data === void 0) { data = null; }
            if (bubbles === void 0) { bubbles = false; }
            var eventVO = { type: type, data: data, bubbles: bubbles };
            this._dispatch(target, eventVO);
        };
        /**
         * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEvent 对象。
         * @param target                    事件主体
         * @param event						调度到事件流中的 Event 对象。
         */
        Event._dispatch = function (target, event) {
            //设置目标
            event.target || (event.target = target);
            event.currentTarget = target;
            var type = event.type;
            var uuid = target.uuid;
            var listeners = uuid && this.listenermap[uuid] && this.listenermap[uuid][type];
            if (listeners) {
                //遍历调用事件回调函数
                for (var i = 0; i < listeners.length && !event.isStop; i++) {
                    listeners[i].listener.call(listeners[i].thisObject, event);
                }
                for (var i = listeners.length - 1; i >= 0; i--) {
                    if (listeners[i].once)
                        listeners.splice(i, 1);
                }
                if (listeners.length == 0)
                    delete this.listenermap[target.uuid][type];
            }
            //事件冒泡(冒泡阶段)
            if (event.bubbles && !event.isStopBubbles) {
                var bubbleTargets = this.getBubbleTargets(target);
                for (var i = 0, n = bubbleTargets.length; i < n; i++) {
                    if (!event.isStop)
                        bubbleTargets[i] && Event._dispatch(bubbleTargets[i], event);
                }
            }
        };
        /**
         * 检查 Event 对象是否为特定事件类型注册了任何侦听器.
         *
         * @param type		事件的类型。
         * @return 			如果指定类型的侦听器已注册，则值为 true；否则，值为 false。
         */
        Event.has = function (target, type) {
            return !!(this.listenermap[target.uuid] && this.listenermap[target.uuid][type] && this.listenermap[target.uuid][type].length);
        };
        /**
         * 添加监听
         * @param dispatcher 派发器
         * @param target                    事件主体
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        Event.on = function (target, type, listener, thisObject, priority, once) {
            if (thisObject === void 0) { thisObject = null; }
            if (priority === void 0) { priority = 0; }
            if (once === void 0) { once = false; }
            var uuid = target.uuid || (target.uuid = generateUUID());
            var objectListener = this.listenermap[uuid] || (this.listenermap[uuid] = {});
            var listeners = objectListener[type] = objectListener[type] || [];
            for (var i = 0; i < listeners.length; i++) {
                var element = listeners[i];
                if (element.listener == listener && element.thisObject == thisObject) {
                    listeners.splice(i, 1);
                    break;
                }
            }
            for (var i = 0; i < listeners.length; i++) {
                var element = listeners[i];
                if (priority > element.priority) {
                    break;
                }
            }
            listeners.splice(i, 0, { listener: listener, thisObject: thisObject, priority: priority, once: once });
        };
        /**
         * 移除监听
         * @param dispatcher 派发器
         * @param target                    事件主体
         * @param type						事件的类型。
         * @param listener					要删除的侦听器对象。
         * @param thisObject                listener函数作用域
         */
        Event.off = function (target, type, listener, thisObject) {
            if (type === void 0) { type = null; }
            if (thisObject === void 0) { thisObject = null; }
            if (!type) {
                if (target.uuid)
                    delete this.listenermap[target.uuid];
                return;
            }
            if (!listener) {
                if (this.listenermap[target.uuid])
                    delete this.listenermap[target.uuid][type];
                return;
            }
            var listeners = target.uuid && this.listenermap[target.uuid] && this.listenermap[target.uuid][type];
            if (listeners) {
                for (var i = listeners.length - 1; i >= 0; i--) {
                    var element = listeners[i];
                    if (element.listener == listener && element.thisObject == thisObject) {
                        listeners.splice(i, 1);
                    }
                }
                if (listeners.length == 0) {
                    delete this.listenermap[target.uuid][type];
                }
            }
        };
        return Event;
    }());
    Event.listenermap = {};
    feng3d.Event = Event;
    /**
     * 生成uuid
     */
    var generateUUID = function () {
        // http://www.broofa.com/Tools/Math.uuid.htm
        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
        var uuid = new Array(36);
        var rnd = 0, r;
        return function generateUUID() {
            for (var i = 0; i < 36; i++) {
                if (i === 8 || i === 13 || i === 18 || i === 23) {
                    uuid[i] = '-';
                }
                else if (i === 14) {
                    uuid[i] = '4';
                }
                else {
                    if (rnd <= 0x02)
                        rnd = 0x2000000 + (Math.random() * 0x1000000) | 0;
                    r = rnd & 0xf;
                    rnd = rnd >> 4;
                    uuid[i] = chars[(i === 19) ? (r & 0x3) | 0x8 : r];
                }
            }
            return uuid.join('');
        };
    }();
})(feng3d || (feng3d = {}));
//# sourceMappingURL=event.js.map