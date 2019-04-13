interface ObjectConstructor
{
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