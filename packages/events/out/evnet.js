"use strict";
var feng3d;
(function (feng3d) {
    /**
     * 事件
     */
    var FEvent = /** @class */ (function () {
        function FEvent() {
            this.feventMap = new Map();
        }
        FEvent.prototype.getBubbleTargets = function (target) {
            return [target["parent"]];
        };
        /**
         * 监听一次事件后将会被移除
         * @param type						事件的类型。
         * @param listener					处理事件的监听器函数。
         * @param thisObject                listener函数作用域
         * @param priority					事件监听器的优先级。数字越大，优先级越高。默认为0。
         */
        FEvent.prototype.once = function (obj, type, listener, thisObject, priority) {
            if (thisObject === void 0) { thisObject = null; }
            if (priority === void 0) { priority = 0; }
            this.on(obj, type, listener, thisObject, priority, true);
        };
        /**
         * 派发事件
         *
         * 当事件重复流向一个对象时将不会被处理。
         *
         * @param e                 事件对象。
         * @returns                 返回事件是否被该对象处理。
         */
        FEvent.prototype.dispatchEvent = function (obj, e) {
            var targets = e.targets = e.targets || [];
            if (targets.indexOf(obj) != -1)
                return false;
            targets.push(obj);
            e.handles = [];
            this.handleEvent(obj, e);
            this.handelEventBubbles(obj, e);
            return true;
        };
        /**
         * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEvent 对象。
         * @param type                      事件的类型。类型区分大小写。
         * @param data                      事件携带的自定义数据。
         * @param bubbles                   表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
         */
        FEvent.prototype.dispatch = function (obj, type, data, bubbles) {
            if (bubbles === void 0) { bubbles = false; }
            var e = this.makeEvent(type, data, bubbles);
            this.dispatchEvent(obj, e);
            return e;
        };
        /**
         * 检查 被监听对象 是否为特定事件类型注册了任何监听器.
         *
         * @param obj                       被监听对象。
         * @param type		                事件的类型。
         * @return 			                如果指定类型的监听器已注册，则值为 true；否则，值为 false。
         */
        FEvent.prototype.has = function (obj, type) {
            var objectListener = this.feventMap.get(obj);
            if (!objectListener)
                return false;
            return !!(objectListener[type] && objectListener[type].length);
        };
        /**
         * 为监听对象新增指定类型的事件监听。
         *
         * @param obj                       被监听对象。
         * @param type						事件的类型。
         * @param listener					处理事件的监听器函数。
         * @param thisObject                监听器的上下文。可选。
         * @param priority					事件监听器的优先级。数字越大，优先级越高。默认为0。
         * @param once                      值为true时在监听一次事件后该监听器将被移除。默认为false。
         */
        FEvent.prototype.on = function (obj, type, listener, thisObject, priority, once) {
            if (priority === void 0) { priority = 0; }
            if (once === void 0) { once = false; }
            if (listener == null)
                return;
            var objectListener = this.feventMap.get(obj);
            if (!objectListener) {
                objectListener = { __anyEventType__: [] };
                this.feventMap.set(obj, objectListener);
            }
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
         *
         * @param obj                       被监听对象。
         * @param type						事件的类型。可选。该值为空时所有被监听对象上的监听均将被移除。
         * @param listener					要删除的监听器对象。可选。该值为空时所有指定类型的监听均将被移除。
         * @param thisObject                监听器的上下文。可选。
         */
        FEvent.prototype.off = function (obj, type, listener, thisObject) {
            if (!type) {
                this.feventMap.delete(obj);
                return;
            }
            var objectListener = this.feventMap.get(obj);
            if (!objectListener)
                return;
            if (!listener) {
                delete objectListener[type];
                return;
            }
            var listeners = objectListener[type];
            if (listeners) {
                for (var i = listeners.length - 1; i >= 0; i--) {
                    var element = listeners[i];
                    if (element.listener == listener && element.thisObject == thisObject) {
                        listeners.splice(i, 1);
                    }
                }
                if (listeners.length == 0) {
                    delete objectListener[type];
                }
            }
        };
        /**
         * 监听对象的任意事件，该对象的任意事件都将触发该监听器的调用。
         *
         * @param obj                       被监听对象。
         * @param listener                  处理事件的监听器函数。
         * @param thisObject                监听器的上下文。可选。
         * @param priority                  事件监听器的优先级。数字越大，优先级越高。默认为0。
         */
        FEvent.prototype.onAny = function (obj, listener, thisObject, priority) {
            if (priority === void 0) { priority = 0; }
            var objectListener = this.feventMap.get(obj);
            if (!objectListener) {
                objectListener = { __anyEventType__: [] };
                this.feventMap.set(obj, objectListener);
            }
            var listeners = objectListener.__anyEventType__;
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
            listeners.splice(i, 0, { listener: listener, thisObject: thisObject, priority: priority, once: false });
        };
        /**
         * 移除监听对象的任意事件。
         *
         * @param obj                       被监听对象。
         * @param listener                  处理事件的监听器函数。
         * @param thisObject                监听器的上下文。可选。
         */
        FEvent.prototype.offAny = function (obj, listener, thisObject) {
            var objectListener = this.feventMap.get(obj);
            if (!listener) {
                if (objectListener)
                    objectListener.__anyEventType__.length = 0;
                return;
            }
            if (objectListener) {
                var listeners = objectListener.__anyEventType__;
                for (var i = listeners.length - 1; i >= 0; i--) {
                    var element = listeners[i];
                    if (element.listener == listener && element.thisObject == thisObject) {
                        listeners.splice(i, 1);
                    }
                }
            }
        };
        /**
         * 初始化事件对象
         *
         * @param type                      事件的类型。类型区分大小写。
         * @param data                      事件携带的自定义数据。
         * @param bubbles                   表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
         */
        FEvent.prototype.makeEvent = function (type, data, bubbles) {
            if (bubbles === void 0) { bubbles = false; }
            return { type: type, data: data, bubbles: bubbles, target: null, currentTarget: null, isStop: false, isStopBubbles: false, targets: [], handles: [] };
        };
        /**
         * 处理事件
         * @param e 事件
         */
        FEvent.prototype.handleEvent = function (obj, e) {
            //设置目标
            e.target || (e.target = obj);
            try {
                //使用 try 处理 MouseEvent 等无法更改currentTarget的对象
                e.currentTarget = obj;
            }
            catch (error) { }
            //
            var objectListener = this.feventMap.get(obj);
            if (!objectListener)
                return;
            var listeners = objectListener[e.type];
            if (listeners) {
                //遍历调用事件回调函数
                var listeners0 = listeners.concat();
                for (var i = 0; i < listeners0.length && !e.isStop; i++) {
                    listeners0[i].listener.call(listeners0[i].thisObject, e); //此处可能会删除当前事件，所以上面必须拷贝
                    e.handles.push(listeners0[i]);
                }
                for (var i = listeners.length - 1; i >= 0; i--) {
                    if (listeners[i].once)
                        listeners.splice(i, 1);
                }
                if (listeners.length == 0)
                    delete objectListener[e.type];
            }
            // Any_EVENT_Type
            listeners = objectListener.__anyEventType__;
            if (listeners) {
                //遍历调用事件回调函数
                var listeners0 = listeners.concat();
                for (var i = 0; i < listeners0.length && !e.isStop; i++) {
                    listeners0[i].listener.call(listeners0[i].thisObject, e); //此处可能会删除当前事件，所以上面必须拷贝
                }
                for (var i = listeners.length - 1; i >= 0; i--) {
                    if (listeners[i].once)
                        listeners.splice(i, 1);
                }
            }
        };
        /**
         * 处理事件冒泡
         * @param e 事件
         */
        FEvent.prototype.handelEventBubbles = function (obj, e) {
            if (e.bubbles && !e.isStopBubbles) {
                var bubbleTargets = this.getBubbleTargets(obj);
                for (var i = 0, n = bubbleTargets.length; i < n; i++) {
                    var bubbleTarget = bubbleTargets[i];
                    if (!e.isStop && bubbleTarget) {
                        if (bubbleTarget.dispatchEvent) {
                            bubbleTarget.dispatchEvent(e);
                        }
                        else {
                            this.dispatchEvent(bubbleTarget, e);
                        }
                    }
                }
            }
        };
        return FEvent;
    }());
    feng3d.FEvent = FEvent;
    feng3d.event = new FEvent();
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 事件适配器
     */
    var EventDispatcher = /** @class */ (function () {
        function EventDispatcher() {
        }
        /**
         * 监听一次事件后将会被移除
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        EventDispatcher.prototype.once = function (type, listener, thisObject, priority) {
            if (thisObject === void 0) { thisObject = null; }
            if (priority === void 0) { priority = 0; }
            feng3d.event.on(this, type, listener, thisObject, priority, true);
        };
        /**
         * 派发事件
         *
         * 当事件重复流向一个对象时将不会被处理。
         *
         * @param e   事件对象
         * @returns 返回事件是否被该对象处理
         */
        EventDispatcher.prototype.dispatchEvent = function (e) {
            return feng3d.event.dispatchEvent(this, e);
        };
        /**
         * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEvent 对象。
         * @param type                      事件的类型。类型区分大小写。
         * @param data                      事件携带的自定义数据。
         * @param bubbles                   表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
         */
        EventDispatcher.prototype.dispatch = function (type, data, bubbles) {
            if (bubbles === void 0) { bubbles = false; }
            return feng3d.event.dispatch(this, type, data, bubbles);
        };
        /**
         * 检查 Event 对象是否为特定事件类型注册了任何侦听器.
         *
         * @param type		事件的类型。
         * @return 			如果指定类型的侦听器已注册，则值为 true；否则，值为 false。
         */
        EventDispatcher.prototype.has = function (type) {
            return feng3d.event.has(this, type);
        };
        /**
         * 添加监听
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        EventDispatcher.prototype.on = function (type, listener, thisObject, priority, once) {
            if (priority === void 0) { priority = 0; }
            if (once === void 0) { once = false; }
            feng3d.event.on(this, type, listener, thisObject, priority, once);
        };
        /**
         * 移除监听
         * @param dispatcher 派发器
         * @param type						事件的类型。
         * @param listener					要删除的侦听器对象。
         */
        EventDispatcher.prototype.off = function (type, listener, thisObject) {
            feng3d.event.off(this, type, listener, thisObject);
        };
        /**
         * 监听对象的任意事件，该对象的任意事件都将触发该监听器的调用。
         *
         * @param listener                  处理事件的监听器函数。
         * @param thisObject                监听器的上下文。可选。
         * @param priority                  事件监听器的优先级。数字越大，优先级越高。默认为0。
         */
        EventDispatcher.prototype.onAny = function (listener, thisObject, priority) {
            if (priority === void 0) { priority = 0; }
            feng3d.event.onAny(this, listener, thisObject, priority);
        };
        /**
         * 移除监听对象的任意事件。
         *
         * @param listener                  处理事件的监听器函数。
         * @param thisObject                监听器的上下文。可选。
         */
        EventDispatcher.prototype.offAny = function (listener, thisObject) {
            feng3d.event.offAny(this, listener, thisObject);
        };
        /**
         * 处理事件
         * @param e 事件
         */
        EventDispatcher.prototype.handleEvent = function (e) {
            feng3d.event["handleEvent"](this, e);
        };
        /**
         * 处理事件冒泡
         * @param e 事件
         */
        EventDispatcher.prototype.handelEventBubbles = function (e) {
            feng3d.event["handelEventBubbles"](this, e);
        };
        return EventDispatcher;
    }());
    feng3d.EventDispatcher = EventDispatcher;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 只针对Object的事件
     */
    feng3d.objectevent = feng3d.event;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=evnet.js.map