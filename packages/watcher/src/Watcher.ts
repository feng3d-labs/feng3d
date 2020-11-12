namespace feng3d
{

    /**
     * 观察装饰器，观察被装饰属性的变化
     * 
     * @param onChange 属性变化回调  例如参数为“onChange”时，回调将会调用this.onChange(property, oldValue, newValue)
     * 
     * 使用@watch后会自动生成一个带"_"的属性，例如 属性"a"会生成"_a" 
     * 
     * 通过使用 eval 函数 生成出 与自己手动写的set get 一样的函数，性能已经接近 手动写的get set函数。
     * 
     * 性能比Watcher.watch更加高效，但还是建议使用 Watcher.watch 替代 @watch ，由于 @watch 没有对onChange更好的约束 使用 时容易出现运行时报错。
     */
    export function watch(onChange: string)
    {
        return (target: any, property: string) =>
        {
            var key = "_" + property;
            var get = eval(`(function (){return this.${key}})`);
            var set = eval(`(function (value){
                if (this.${key} == value)
                    return;
                var oldValue = this.${key};
                this.${key} = value;
                this.${onChange}("${property}", oldValue, value);
            })`);

            console.assert(target[onChange], `在对象 ${target} 上找不到方法 ${onChange}`)

            Object.defineProperty(target, property, {
                get: get,
                set: set,
                enumerable: true,
                configurable: true,
            });
        }
    }

    export var watcher: Watcher;

    export class Watcher
    {
        /**
         * 监听对象属性的变化
         * 
         * 注意：使用watch后获取该属性值的性能将会是原来的1/60，避免在运算密集处使用该函数。
         * 
         * @param object 被监听对象
         * @param property 被监听属性
         * @param handler 变化回调函数 (object: T, property: string, oldValue: V) => void
         * @param thisObject 变化回调函数 this值 
         */
        watch<T, K extends PropertyNames<T>, V extends T[K]>(object: T, property: K, handler: (newValue: V, oldValue: V, object: T, property: string) => void, thisObject?: any)
        {
            if (!Object.getOwnPropertyDescriptor(object, __watchs__))
            {
                Object.defineProperty(object, __watchs__, {
                    value: {},
                    enumerable: false,
                    configurable: true,
                    writable: false,
                });
            }
            var _property: string = <any>property;
            var watchs: Watchs = object[__watchs__];
            if (!watchs[_property])
            {
                var oldPropertyDescriptor = Object.getOwnPropertyDescriptor(object, _property);
                watchs[_property] = { value: object[_property], oldPropertyDescriptor: oldPropertyDescriptor, handlers: [] };
                //
                var data = Object.getPropertyDescriptor(object, _property);
                if (data && data.set && data.get)
                {
                    data = { enumerable: data.enumerable, configurable: true, get: data.get, set: data.set };
                    var orgSet = data.set;
                    data.set = function (value)
                    {
                        var oldValue = this[<any>_property];
                        if (oldValue != value)
                        {
                            orgSet && orgSet.call(this, value);
                            notifyListener(value, oldValue, this, _property);
                        }
                    };
                }
                else if (!data || (!data.get && !data.set))
                {
                    data = { enumerable: true, configurable: true };
                    data.get = function ()
                    {
                        return this[__watchs__][_property].value;
                    };
                    data.set = function (value)
                    {
                        var oldValue = this[__watchs__][_property].value;
                        if (oldValue != value)
                        {
                            this[__watchs__][_property].value = value;
                            notifyListener(value, oldValue, this, _property);
                        }
                    };
                }
                else
                {
                    console.warn(`watch ${object} . ${_property} 失败！`);
                    return;
                }
                Object.defineProperty(object, _property, data);
            }

            var propertywatchs = watchs[_property];
            var has = propertywatchs.handlers.reduce((v, item) => { return v || (item.handler == handler && item.thisObject == thisObject); }, false);
            if (!has)
                propertywatchs.handlers.push({ handler: handler, thisObject: thisObject });
        }

        /**
         * 取消监听对象属性的变化
         * 
         * @param object 被监听对象
         * @param property 被监听属性
         * @param handler 变化回调函数 (object: T, property: string, oldValue: V) => void
         * @param thisObject 变化回调函数 this值
         */
        unwatch<T, K extends PropertyNames<T>, V extends T[K]>(object: T, property: K, handler?: (newValue: V, oldValue: V, object: T, property: string) => void, thisObject?: any)
        {
            var watchs: Watchs = object[__watchs__];
            if (!watchs) return;
            var _property: string = <any>property;
            if (watchs[_property])
            {
                var handlers = watchs[_property].handlers;
                if (handler === undefined)
                    handlers.length = 0;
                for (var i = handlers.length - 1; i >= 0; i--)
                {
                    if (handlers[i].handler == handler && (handlers[i].thisObject == thisObject || thisObject === undefined))
                        handlers.splice(i, 1);
                }
                if (handlers.length == 0)
                {
                    var value = object[_property];
                    delete object[_property];
                    if (watchs[_property].oldPropertyDescriptor)
                        Object.defineProperty(object, _property, watchs[_property].oldPropertyDescriptor);
                    object[_property] = value;
                    delete watchs[_property];
                }
                if (Object.keys(watchs).length == 0)
                {
                    delete object[__watchs__];
                }
            }
        }

        private _binds: [any, string, () => void, any, string, () => void][] = [];

        /**
         * 绑定两个对象的指定属性，保存两个属性值同步。
         * 
         * @param object0 第一个对象。
         * @param property0 第一个对象的属性名称。
         * @param object1 第二个对象。
         * @param property1 第二个对象的属性名称。
         */
        bind<T0, T1, K0 extends PropertyNames<T0>, K1 extends PropertyNames<T1>>(object0: T0, property0: K0, object1: T1, property1: K1)
        {
            var fun0 = () =>
            {
                object1[property1] = <any>object0[property0];
            }
            var fun1 = () =>
            {
                object0[property0] = <any>object1[property1];
            }
            this.watch(object0, property0, fun0);
            this.watch(object1, property1, fun1);

            this._binds.push([object0, <any>property0, fun0, object1, <any>property1, fun1]);
        }

        /**
         * 解除两个对象的指定属性的绑定。
         * 
         * @param object0 第一个对象。
         * @param property0 第一个对象的属性名称。
         * @param object1 第二个对象。
         * @param property1 第二个对象的属性名称。
         */
        unbind<T0, T1, K0 extends PropertyNames<T0>, K1 extends PropertyNames<T1>>(object0: T0, property0: K0, object1: T1, property1: K1)
        {
            var binds = this._binds;
            for (let i = 0, n = binds.length - 1; i >= 0; i--)
            {
                const v = binds[i];
                if ((v[1] == property0 && v[4] == property1) || (v[1] == property1 && v[4] == property0))
                {
                    if ((v[0] == object0 && v[3] == object1) || (v[0] == object1 && v[3] == object0)) 
                    {
                        this.unwatch(v[0], v[1], v[2]);
                        this.unwatch(v[3], v[4], v[5]);
                        binds.splice(i, 1);
                        break;
                    }
                }
            }
        }

        /**
         * 监听对象属性链值变化
         * 
         * @param object 被监听对象
         * @param property 被监听属性 例如："a.b"
         * @param handler 变化回调函数 (newValue: any, oldValue: any, object: any, property: string) => void
         * @param thisObject 变化回调函数 this值
         */
        watchchain(object: any, property: string, handler: (newValue: any, oldValue: any, object: any, property: string) => void, thisObject?: any)
        {
            var notIndex = property.indexOf(".");
            if (notIndex == -1)
            {
                this.watch(object, property, handler, thisObject);
                return;
            }
            if (!Object.getOwnPropertyDescriptor(object, __watchchains__))
                Object.defineProperty(object, __watchchains__, { value: {}, enumerable: false, writable: false, configurable: true });
            var watchchains: WatchChains = object[__watchchains__];
            if (!watchchains[property])
            {
                watchchains[property] = [];
            }

            var propertywatchs = watchchains[property];
            var has = propertywatchs.reduce((v, item) => { return v || (item.handler == handler && item.thisObject == thisObject); }, false);
            if (!has)
            {
                // 添加下级监听链
                var currentp = property.substr(0, notIndex);
                var nextp = property.substr(notIndex + 1);
                if (object[currentp])
                {
                    this.watchchain(object[currentp], nextp, handler, thisObject);
                }

                // 添加链监听
                var watchchainFun = (newValue: any, oldValue: any) =>
                {
                    if (oldValue) this.unwatchchain(oldValue, nextp, handler, thisObject);
                    if (newValue) this.watchchain(newValue, nextp, handler, thisObject);
                    // 当更换对象且监听值发生改变时触发处理函数
                    var ov = Object.getPropertyValue(oldValue, nextp);
                    var nv = Object.getPropertyValue(newValue, nextp);
                    if (ov != nv)
                    {
                        handler.call(thisObject, nv, ov, newValue, nextp);
                    }
                };
                this.watch(object, currentp, watchchainFun);

                // 记录链监听函数
                propertywatchs.push({ handler: handler, thisObject: thisObject, watchchainFun: watchchainFun });
            }
        }

        /**
         * 取消监听对象属性链值变化
         * 
         * @param object 被监听对象
         * @param property 被监听属性 例如："a.b"
         * @param handler 变化回调函数 (object: T, property: string, oldValue: V) => void
         * @param thisObject 变化回调函数 this值
         */
        unwatchchain(object: any, property: string, handler?: (newValue: any, oldValue: any, object: any, property: string) => void, thisObject?: any)
        {
            var notIndex = property.indexOf(".");
            if (notIndex == -1)
            {
                this.unwatch(object, property, handler, thisObject);
                return;
            }

            var currentp = property.substr(0, notIndex);
            var nextp = property.substr(notIndex + 1);

            //
            var watchchains: WatchChains = object[__watchchains__];
            if (!watchchains || !watchchains[property]) return;

            // 
            var propertywatchs = watchchains[property];
            for (let i = propertywatchs.length - 1; i >= 0; i--)
            {
                const element = propertywatchs[i];
                if (handler == null || (handler == element.handler && thisObject == element.thisObject))
                {
                    // 删除下级监听链
                    if (object[currentp])
                    {
                        this.unwatchchain(object[currentp], nextp, element.handler, element.thisObject);
                    }
                    // 删除链监听
                    this.unwatch(object, currentp, element.watchchainFun);
                    // 清理记录链监听函数
                    propertywatchs.splice(i, 1);
                }
            }
            // 清理空列表
            if (propertywatchs.length == 0) delete watchchains[property];
            if (Object.keys(watchchains).length == 0)
            {
                delete object[__watchchains__];
            }
        }

        /**
         * 监听对象属性链值变化
         * 
         * @param object 被监听对象
         * @param property 被监听属性 例如：{a:{b:null,d:null}} 表示监听 object.a.b 与 object.a.d 值得变化，如果property == object时表示监听对象中所有叶子属性变化。
         * @param handler 变化回调函数 (object: T, property: string, oldValue: V) => void
         * @param thisObject 变化回调函数 this值
         */
        watchobject<T>(object: T, property: gPartial<T>, handler: (object: any, property: string, oldValue: any) => void, thisObject?: any)
        {
            var chains = Object.getPropertyChains(object);
            chains.forEach(v =>
            {
                this.watchchain(object, v, handler, thisObject);
            });
        }

        /**
         * 取消监听对象属性链值变化
         * 
         * @param object 被监听对象
         * @param property 被监听属性 例如：{a:{b:null,d:null}} 表示监听 object.a.b 与 object.a.d 值得变化，如果property == object时表示监听对象中所有叶子属性变化。
         * @param handler 变化回调函数 (object: T, property: string, oldValue: V) => void
         * @param thisObject 变化回调函数 this值
         */
        unwatchobject<T>(object: T, property: gPartial<T>, handler?: (object: any, property: string, oldValue: any) => void, thisObject?: any)
        {
            var chains = Object.getPropertyChains(property);
            chains.forEach(v =>
            {
                this.unwatchchain(object, v, handler, thisObject);
            });
        }
    }

    watcher = new Watcher();

    interface Watchs
    {
        [property: string]: { value: any, oldPropertyDescriptor: any, handlers: { handler: (newValue: any, oldValue: any, host: any, property: string) => void, thisObject: any }[] };
    }

    interface WatchChains
    {
        [property: string]: { handler: (newValue: any, oldValue: any, host: any, property: string) => void, thisObject: any, watchchainFun: (newValue: any, oldValue: any, host: any, property: string) => void }[];
    }

    export const __watchs__ = "__watchs__";
    export const __watchchains__ = "__watchchains__";

    function notifyListener(newValue: any, oldValue: any, host: any, property: string): void
    {
        var watchs: Watchs = host[__watchs__];
        var handlers = watchs[property].handlers;
        handlers.forEach(element =>
        {
            element.handler.call(element.thisObject, newValue, oldValue, host, property);
        });
    }
}
