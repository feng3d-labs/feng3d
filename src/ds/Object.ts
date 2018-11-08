interface ObjectConstructor
{
    /**
     * Copy the values of all of the enumerable own properties from one or more source objects to a
     * target object. Returns the target object.
     * @param target The target object to copy to.
     * @param source The source object from which to copy properties.
     */
    assign<T, U>(target: T, source: U): T & U;

    /**
     * Copy the values of all of the enumerable own properties from one or more source objects to a
     * target object. Returns the target object.
     * @param target The target object to copy to.
     * @param source1 The first source object from which to copy properties.
     * @param source2 The second source object from which to copy properties.
     */
    assign<T, U, V>(target: T, source1: U, source2: V): T & U & V;

    /**
     * Copy the values of all of the enumerable own properties from one or more source objects to a
     * target object. Returns the target object.
     * @param target The target object to copy to.
     * @param source1 The first source object from which to copy properties.
     * @param source2 The second source object from which to copy properties.
     * @param source3 The third source object from which to copy properties.
     */
    assign<T, U, V, W>(target: T, source1: U, source2: V, source3: W): T & U & V & W;

    /**
     * Copy the values of all of the enumerable own properties from one or more source objects to a
     * target object. Returns the target object.
     * @param target The target object to copy to.
     * @param sources One or more source objects from which to copy properties
     */
    assign(target: object, ...sources: any[]): any;

    /**
     * 从对象以及对象的原型中获取属性描述
     * @param obj 对象
     * @param property 属性名称
     */
    getPropertyDescriptor(obj: Object, property: string): PropertyDescriptor;

    /**
     * 属性是否可写
     * @param obj 对象
     * @param property 属性名称
     */
    propertyIsWritable(obj: Object, property: string): boolean;

    /**
     * 执行方法
     * 
     * 用例：
     * 1. 给一个新建的对象进行初始化 
     * 
     *  ``` startLifetime = Object.runFunc(new MinMaxCurve(), (obj) => { obj.mode = MinMaxCurveMode.Constant; (<MinMaxCurveConstant>obj.minMaxCurve).value = 5; }); ```
     * 
     * @param obj 对象
     * @param func 被执行的方法
     */
    runFunc<T>(obj: T, func: (obj: T) => void): T;

    /**
     * 给指定对象进行深度赋值
     * @param obj 对象
     * @param value 数据
     */
    setValue<T>(obj: T, value: gPartial<T>): T;

    /**
     * 深拷贝
     * @param obj 被拷贝对象
     */
    deepClone<T>(obj: T): T;
}

if (typeof Object.assign != 'function')
{
    // Must be writable: true, enumerable: false, configurable: true
    Object.defineProperty(Object, "assign", {
        value: function assign(target, varArgs)
        { // .length of function is 2
            'use strict';
            if (target == null)
            { // TypeError if undefined or null
                throw new TypeError('Cannot convert undefined or null to object');
            }

            var to = Object(target);

            for (var index = 1; index < arguments.length; index++)
            {
                var nextSource = arguments[index];

                if (nextSource != null)
                { // Skip over if undefined or null
                    for (var nextKey in nextSource)
                    {
                        // Avoid bugs when hasOwnProperty is shadowed
                        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey))
                        {
                            to[nextKey] = nextSource[nextKey];
                        }
                    }
                }
            }
            return to;
        },
        writable: true,
        configurable: true
    });
}

Object.getPropertyDescriptor = function (host: any, property: string): PropertyDescriptor
{
    var data = Object.getOwnPropertyDescriptor(host, property);
    if (data)
    {
        return data;
    }
    var prototype = Object.getPrototypeOf(host);
    if (prototype)
    {
        return Object.getPropertyDescriptor(prototype, property);
    }
    return null;
}

Object.propertyIsWritable = function (host: any, property: string): boolean
{
    var data = Object.getPropertyDescriptor(host, property);
    if (!data) return false;
    if (data.get && !data.set) return false;
    return true;
}

Object.runFunc = function (obj, func)
{
    func(obj);
    return obj;
}

Object.setValue = function (obj, value)
{
    feng3d.serialization.setValue(obj, value);
    return obj;
}

Object.deepClone = function (obj)
{
    return feng3d.serialization.clone(obj);
}