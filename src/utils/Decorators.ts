namespace feng3d
{
    /**
     * 序列化装饰器，被装饰属性将被序列化
     */
    export function serialize(target: any, propertyKey: string)
    {
        if (!target.__serializableMembers)
        {
            target.__serializableMembers = [];
        }
        target.__serializableMembers.push(propertyKey);
    }

    /**
     * 观察装饰器，观察被装饰属性的变化
     * 
     * *对使用watch修饰的属性赋值比未使用的性能差距100倍左右*
     * @param onChange 属性变化回调
     */
    export function watch(onChange: string)
    {
        return (target: any, propertyKey: string) =>
        {
            console.assert(target[onChange], `对象 ${target} 中未找到方法 ${onChange}`);
            var key = "_" + propertyKey;
            Object.defineProperty(target, propertyKey, {
                get: function ()
                {
                    return this[key];
                },
                set: function (value)
                {
                    if (this[key] === value)
                    {
                        return;
                    }
                    var oldValue = this[key];
                    var newValue = this[key] = value;
                    target[onChange].apply(this, [propertyKey, oldValue, newValue]);
                },
                enumerable: true,
                configurable: true
            });
        }
    }
}