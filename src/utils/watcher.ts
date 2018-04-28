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
            var watchs: Watchs = host[bindables] = host[bindables] || {};
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
    };

    interface Watchs
    {
        [property: string]: { value: any, oldPropertyDescriptor: any, handlers: { handler: (host: any, property: string, oldvalue: any) => void, thisObject: any }[] };
    }

    const bindables = "__watchs__";

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
