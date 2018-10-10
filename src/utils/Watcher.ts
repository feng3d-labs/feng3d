namespace feng3d
{

    /**
     * 观察装饰器，观察被装饰属性的变化
     * 
     * @param onChange 属性变化回调  例如参数为“onChange”时，回调将会调用this.onChange(property, oldValue, newValue)
     * @see https://gitee.com/feng3d/feng3d/issues/IGIK0
     * 
     * 使用@watch后会自动生成一个带"_"的属性，例如 属性"a"会生成"_a" 
     * 
     * 通过使用 eval 函数 生成出 与自己手动写的set get 一样的函数，性能已经接近 手动写的get set函数。
     * 
     * 性能：
     * chrome：
     * 测试 get ：
Test.ts:100 watch与getset最大耗时比 1.2222222222222223
Test.ts:101 watch与getset最小耗时比 0.7674418604651163
Test.ts:102 watch与getset平均耗时比 0.9558823529411765
Test.ts:103 watch平均耗时比 13
Test.ts:104 getset平均耗时比 13.6
Test.ts:98 测试 set ：
Test.ts:100 watch与getset最大耗时比 4.5
Test.ts:101 watch与getset最小耗时比 2.409090909090909
Test.ts:102 watch与getset平均耗时比 3.037037037037037
Test.ts:103 watch平均耗时比 57.4
Test.ts:104 getset平均耗时比 18.9

     * 
     * nodejs:
     * 测试 get ：
watch与getset最大耗时比 1.3333333333333333
watch与getset最小耗时比 0.55
watch与getset平均耗时比 1.0075757575757576
watch平均耗时比 13.3
getset平均耗时比 13.2
测试 set ：
watch与getset最大耗时比 4.9
watch与getset最小耗时比 3
watch与getset平均耗时比 4.143497757847534
watch平均耗时比 92.4
getset平均耗时比 22.3
     * 
     * 
     * firefox:
     * 测试 get ：  Test.js:122:5
watch与getset最大耗时比 4.142857142857143  Test.js:124:5
watch与getset最小耗时比 0.4090909090909091  Test.js:125:5
watch与getset平均耗时比 1.0725806451612903  Test.js:126:5
watch平均耗时比 13.3  Test.js:127:5
getset平均耗时比 12.4  Test.js:128:5
测试 set ：  Test.js:122:5
watch与getset最大耗时比 1.5333333333333334  Test.js:124:5
watch与getset最小耗时比 0.6842105263157895  Test.js:125:5
watch与getset平均耗时比 0.9595375722543352  Test.js:126:5
watch平均耗时比 16.6  Test.js:127:5
getset平均耗时比 17.3
     * 
     * 结果分析：
     * chrome、nodejs、firefox运行结果出现差异,firefox运行结果最完美
     * 
     * 使用watch后的get测试的消耗与手动写get消耗一致
     * chrome与nodejs上set消耗是手动写set的消耗(3-4)倍
     * 
     * 注：不适用eval的情况下，chrome表现最好的，与此次测试结果差不多；在nodejs与firfox上将会出现比使用eval情况下消耗的（40-400）倍，其中详细原因不明，求高人解释！
     * 
     */
    export function watch(onChange: string)
    {
        return (target: any, property: string) =>
        {
            var key = "_" + property;
            var get;
            // get = function () { return this[key]; };
            eval(`get = function (){return this.${key}}`);

            var set;
            // set = function (value)
            // {
            //     if (this[key] === value)
            //         return;
            //     var oldValue = this[key];
            //     this[key] = value;
            //     this[onChange](propertyKey, oldValue, this[key]);
            // };
            eval(`set = function (value){
                if (this.${key} == value)
                    return;
                var oldValue = this.${key};
                this.${key} = value;
                this.${onChange}("${property}", oldValue, value);
            }`);

            Object.defineProperty(target, property, {
                get: get,
                set: set,
                enumerable: true,
                configurable: true
            });
        }
    }

    export var watcher: Watcher;

    export class Watcher
    {
        /**
         * 注意：使用watch后获取该属性值的性能将会是原来的1/60，禁止在feng3d引擎内部使用watch
         * @param host 
         * @param property1 
         * @param handler 
         * @param thisObject 
         */
        watch<T extends Object>(host: T, property: keyof T, handler: (host: any, property: string, oldvalue: any) => void, thisObject?: any)
        {
            if (!Object.getOwnPropertyDescriptor(host, bindables))
            {
                Object.defineProperty(host, bindables, {
                    value: {},
                    enumerable: false,
                });
            }
            var watchs: Watchs = host[bindables];
            var property1 = <string>property;
            if (!watchs[property1])
            {
                var oldPropertyDescriptor = Object.getOwnPropertyDescriptor(host, property1);
                watchs[property1] = { value: host[property1], oldPropertyDescriptor: oldPropertyDescriptor, handlers: [] };
                //
                var data: PropertyDescriptor = Object.getPropertyDescriptor(host, property1);
                if (data && data.set && data.get)
                {
                    data = <any>{ enumerable: true, configurable: true, get: data.get, set: data.set };
                    var orgSet = data.set;
                    data.set = function (value: any)
                    {
                        var oldvalue = this[<any>property1];
                        if (oldvalue != value)
                        {
                            orgSet && orgSet.call(this, value);
                            notifyListener(this, property1, oldvalue);
                        }
                    };
                }
                else if (!data || (!data.get && !data.set))
                {
                    data = <any>{ enumerable: true, configurable: true };
                    data.get = function (): any
                    {
                        return this[bindables][property1].value;
                    };
                    data.set = function (value: any)
                    {
                        var oldvalue = this[bindables][property1].value;
                        if (oldvalue != value)
                        {
                            this[bindables][property1].value = value;
                            notifyListener(this, property1, oldvalue);
                        }
                    };
                }
                else
                {
                    feng3d.warn(`watch ${host} . ${property} 失败！`);
                    return;
                }
                Object.defineProperty(host, property1, data);
            }

            var propertywatchs = watchs[property1];
            var has = propertywatchs.handlers.reduce((v, item) => { return v || (item.handler == handler && item.thisObject == thisObject); }, false);
            if (!has)
                propertywatchs.handlers.push({ handler: handler, thisObject: thisObject });
        }

        unwatch<T extends Object>(host: T, property: keyof T, handler?: (host: any, property: string, oldvalue: any) => void, thisObject?: any)
        {
            var watchs: Watchs = host[bindables];
            if (!watchs) return;
            var property1 = <string>property;
            if (watchs[property1])
            {
                var handlers = watchs[property1].handlers;
                if (handler === undefined)
                    handlers.length = 0;
                for (var i = handlers.length - 1; i >= 0; i--)
                {
                    if (handlers[i].handler == handler && (handlers[i].thisObject == thisObject || thisObject === undefined))
                        handlers.splice(i, 1);
                }
                if (handlers.length == 0)
                {
                    var value = host[property1];
                    delete host[property1];
                    if (watchs[property1].oldPropertyDescriptor)
                        Object.defineProperty(host, property1, watchs[property1].oldPropertyDescriptor);
                    host[property1] = value;
                    delete watchs[property1];
                }
                if (Object.keys(watchs).length == 0)
                {
                    delete host[bindables];
                }
            }
        }

        watchchain(host: any, property: string, handler?: (host: any, property: string, oldvalue: any) => void, thisObject?: any)
        {
            var notIndex = property.indexOf(".");
            if (notIndex == -1)
            {
                this.watch(host, property, handler, thisObject);
                return;
            }
            if (!Object.getOwnPropertyDescriptor(host, bindablechains))
                Object.defineProperty(host, bindablechains, { value: {}, enumerable: false, });
            var watchchains: WatchChains = host[bindablechains];
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
                    this.watchchain(host[currentp], nextp, handler, thisObject);
                }

                // 添加链监听
                var watchchainFun = (h, p, oldvalue) =>
                {
                    var newvalue = h[p];
                    if (oldvalue) this.unwatchchain(oldvalue, nextp, handler, thisObject);
                    if (newvalue) this.watchchain(newvalue, nextp, handler, thisObject);
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
                this.watch(host, currentp, watchchainFun);

                // 记录链监听函数
                propertywatchs.push({ handler: handler, thisObject: thisObject, watchchainFun: watchchainFun });
            }
        }

        unwatchchain(host: any, property: string, handler?: (host: any, property: string, oldvalue: any) => void, thisObject?: any)
        {
            var notIndex = property.indexOf(".");
            if (notIndex == -1)
            {
                this.unwatch(host, property, handler, thisObject);
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
                        this.unwatchchain(host[currentp], nextp, element.handler, element.thisObject);
                    }
                    // 删除链监听
                    this.unwatch(host, currentp, element.watchchainFun);
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
        }

    }

    watcher = new Watcher();

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
