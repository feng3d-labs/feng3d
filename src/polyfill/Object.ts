/**
 * Object.assignDeep 中 转换结果的函数定义
 */
interface AssignDeepReplacer
{
    /**
     * 
     * @param target 目标对象
     * @param source 源数据
     * @param key 属性名称
     * @param replacers 转换函数
     * @param deep 当前深度
     */
    (target: any, source: any, key: string, replacers: AssignDeepReplacer[], deep: number): boolean;
}

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
     * 判断是否为基础类型 undefined,null,boolean,string,number,function
     */
    isBaseType(object: any): boolean;

    /**
     * 判断是否为Object对象，构造函数是否为Object， 检测 object.constructor == Object
     * 
     * @param object 用于判断的对象
     */
    isObject(object: any): boolean;

    /**
     * 浅赋值
     * 从源数据取所有可枚举属性值赋值给目标对象
     * 
     * @param target 目标对象
     * @param source 源数据
     */
    assignShallow<T>(target: T, source: Partial<T>): T;

    /**
     * 深度赋值
     * 从源数据取所有子代可枚举属性值赋值给目标对象
     * 
     * @param target 被赋值对象
     * @param source 源数据
     * @param replacers 转换结果的函数。返回值为true表示该属性赋值已完成跳过默认属性赋值操作，否则执行默认属性赋值操作。执行在 Object.DefaultAssignDeepReplacers 前。
     * @param deep 赋值深度，deep<1时直接返回。
     */
    assignDeep<T>(target: T, source: feng3d.gPartial<T>, replacers?: AssignDeepReplacer | AssignDeepReplacer[], deep?: number): T;

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
     * Object.assignDeep 中 默认转换结果的函数列表
     */
    DefaultAssignDeepReplacers: AssignDeepReplacer[];
}

Object.isBaseType = function (object: any)
{
    //基础类型
    if (
        object == undefined
        || object == null
        || typeof object == "boolean"
        || typeof object == "string"
        || typeof object == "number"
    )
        return true;
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

Object.isObject = function (obj)
{
    return obj != null && obj.constructor == Object;
}

Object.assignShallow = function (target, source)
{
    if (source == null) return target;
    var keys = Object.keys(source);
    keys.forEach(k =>
    {
        target[k] = source[k];
    });
    return target;
}

Object.assignDeep = function (target, source, replacers = [], deep = Number.MAX_SAFE_INTEGER)
{
    if (source == null) return target;
    if (deep < 1) return target;
    var keys = Object.keys(source);
    keys.forEach(k =>
    {
        //
        var handles = [].concat(replacers).concat(Object.DefaultAssignDeepReplacers);
        for (let i = 0; i < handles.length; i++)
        {
            if (handles[i](target, source, k, replacers, deep)) 
            {
                return;
            }
        }
        //
        target[k] = source[k];
    });
    return target;
}

Object.DefaultAssignDeepReplacers = [
    function (target, source, key, replacers, deep)
    {
        if (target[key] == source[key]) return true;
    },
    function (target, source, key, replacers, deep)
    {
        if (Object.isBaseType(target[key]) || Object.isBaseType(source[key]))
        {
            target[key] = source[key];
            return true
        }
    },
    function (target, source, key, replacers, deep)
    {
        if (Array.isArray(source[key]) || Object.isObject(source[key]))
        {
            Object.assignDeep(target[key], source[key], replacers, deep - 1);
            return true
        }
    },

];