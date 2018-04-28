namespace feng3d
{
    export var watcher = {

        /**
         * 注意：使用watch后获取该属性值的性能将会是原来的1/60，禁止在feng3d引擎内部使用watch
         * @param host 
         * @param property 
         * @param handler 
         * @param thisObject 
         */
        watch<T extends Object>(host: T, property: keyof T, handler: (host: any, property: string, oldvalue: any) => void, thisObject?: any)
        {
            var watchs: Watchs = host[bindables] = host[bindables] || {};
            if (!watchs[property])
            {
                var oldPropertyDescriptor = Object.getOwnPropertyDescriptor(host, property);
                watchs[property] = { value: host[property], oldPropertyDescriptor: oldPropertyDescriptor, handlers: [] };
                //
                var data: PropertyDescriptor = getPropertyDescriptor(host, property);
                if (data && data.set && data.get)
                {
                    data = <any>{ enumerable: true, configurable: true, get: data.get, set: data.set };
                    var orgSet = data.set;
                    data.set = function (value: any)
                    {
                        var oldvalue = this[<any>property];
                        if (oldvalue != value)
                        {
                            orgSet && orgSet.call(this, value);
                            notifyListener(this, property, oldvalue);
                        }
                    };
                }
                else if (!data || (!data.get && !data.set))
                {
                    data = <any>{ enumerable: true, configurable: true };
                    data.get = function (): any
                    {
                        return this[bindables][property].value;
                    };
                    data.set = function (value: any)
                    {
                        var oldvalue = this[bindables][property].value;
                        if (oldvalue != value)
                        {
                            this[bindables][property].value = value;
                            notifyListener(this, property, oldvalue);
                        }
                    };
                }
                else
                {
                    throw "watch 失败！";
                }
                Object.defineProperty(host, property, data);
            }

            var propertywatchs = watchs[property];
            var has = propertywatchs.handlers.reduce((v, item) => { return v || (item.handler == handler && item.thisObject == thisObject); }, false);
            if (!has)
                propertywatchs.handlers.push({ handler: handler, thisObject: thisObject });
        },
        unwatch<T extends Object>(host: T, property: keyof T, handler?: (host: any, property: string, oldvalue: any) => void, thisObject?: any)
        {
            var watchs: Watchs = host[bindables];
            if (!watchs) return;
            if (watchs[property])
            {
                var handlers = watchs[property].handlers;
                if (handler === undefined)
                    handlers.length = 0;
                for (var i = handlers.length - 1; i >= 0; i--)
                {
                    if (handlers[i].handler == handler && (handlers[i].thisObject == thisObject || thisObject === undefined))
                        handlers.splice(i, 1);
                }
                if (handlers.length == 0)
                {
                    var value = host[property];
                    delete host[property];
                    if (watchs[property].oldPropertyDescriptor)
                        Object.defineProperty(host, property, watchs[property].oldPropertyDescriptor);
                    host[property] = value;
                    delete watchs[property];
                }
                if (Object.keys(watchs).length == 0)
                {
                    delete host[bindables];
                }
            }
        },
        watchchain(host: any, property: string, handler?: (host: any, property: string, oldvalue: any) => void, thisObject?: any)
        {
            var notIndex = property.indexOf(".");
            if (notIndex == -1)
            {
                watcher.watch(host, property, handler, thisObject);
                return;
            }

            var watchchains: WatchChains = host[bindablechains] = host[bindablechains] || {};
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
                if (host[currentp])
                {
                    feng3d.watcher.watchchain(host[currentp], nextp, handler, thisObject);
                }

                // 添加链监听
                var watchchainFun = (h, p, oldvalue) =>
                {
                    var newvalue = h[p];
                    if (oldvalue) feng3d.watcher.unwatchchain(oldvalue, nextp, handler, thisObject);
                    if (newvalue) feng3d.watcher.watchchain(newvalue, nextp, handler, thisObject);
                    // 当更换对象且监听值发生改变时触发处理函数
                    try
                    {
                        var ov = eval("oldvalue." + nextp + "");
                    } catch (e)
                    {
                        ov = undefined;
                    }
                    try
                    {
                        var nv = eval("newvalue." + nextp + "");
                    } catch (e)
                    {
                        nv = undefined;
                    }
                    if (ov != nv)
                    {
                        handler.call(thisObject, newvalue, nextp, ov);
                    }
                };
                feng3d.watcher.watch(host, currentp, watchchainFun);

                // 记录链监听函数
                propertywatchs.push({ handler: handler, thisObject: thisObject, watchchainFun: watchchainFun });
            }

        },
        unwatchchain(host: any, property: string, handler?: (host: any, property: string, oldvalue: any) => void, thisObject?: any)
        {
            var notIndex = property.indexOf(".");
            if (notIndex == -1)
            {
                watcher.unwatch(host, property, handler, thisObject);
                return;
            }

            var currentp = property.substr(0, notIndex);
            var nextp = property.substr(notIndex + 1);

            //
            var watchchains: WatchChains = host[bindablechains];
            if (!watchchains || !watchchains[property]) return;

            // 
            var propertywatchs = watchchains[property];
            for (let i = propertywatchs.length - 1; i >= 0; i--)
            {
                const element = propertywatchs[i];
                if (handler == null || (handler == element.handler && thisObject == element.thisObject))
                {
                    // 删除下级监听链
                    if (host[currentp])
                    {
                        feng3d.watcher.unwatchchain(host[currentp], nextp, element.handler, element.thisObject);
                    }
                    // 删除链监听
                    feng3d.watcher.unwatch(host, currentp, element.watchchainFun);
                    // 清理记录链监听函数
                    propertywatchs.splice(i, 1);
                }
            }
            // 清理空列表
            if (propertywatchs.length == 0) delete watchchains[property];
            if (Object.keys(watchchains).length == 0)
            {
                delete host[bindablechains];
            }
        },
    };

    interface Watchs
    {
        [property: string]: { value: any, oldPropertyDescriptor: any, handlers: { handler: (host: any, property: string, oldvalue: any) => void, thisObject: any }[] };
    }

    interface WatchChains
    {
        [property: string]: { handler: (host: any, property: string, oldvalue: any) => void, thisObject: any, watchchainFun: (h: any, p: any, oldvalue: any) => void }[];
    }

    const bindables = "__watchs__";
    const bindablechains = "__watchchains__";

    function getPropertyDescriptor(host: any, property: string): any
    {
        var data = Object.getOwnPropertyDescriptor(host, property);
        if (data)
        {
            return data;
        }
        var prototype = Object.getPrototypeOf(host);
        if (prototype)
        {
            return getPropertyDescriptor(prototype, property);
        }
        return null;
    }

    function notifyListener(host: any, property: string, oldview: any): void
    {
        var watchs: Watchs = host[bindables];
        var handlers = watchs[property].handlers;
        handlers.forEach(element =>
        {
            element.handler.call(element.thisObject, host, property, oldview);
        });
    }
}
