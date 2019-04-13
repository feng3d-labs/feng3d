namespace feng3d
{
    /**
     * Object 工具
     * 
     * 增强Object功能
     */
    export var objectutils: ObjectUtils;

    /**
     * Object 工具
     * 
     * 增强Object功能
     */
    export class ObjectUtils
    {
        /**
         * 从对象以及对象的原型中获取属性描述
         * @param obj 对象
         * @param property 属性名称
         */
        getPropertyDescriptor(host: Object, property: string): PropertyDescriptor
        {
            var data = Object.getOwnPropertyDescriptor(host, property);
            if (data) return data;
            var prototype = Object.getPrototypeOf(host);
            if (prototype) return this.getPropertyDescriptor(prototype, property);
            return null;
        }

        /**
         * 属性是否可写
         * @param obj 对象
         * @param property 属性名称
         */
        propertyIsWritable(host: Object, property: string): boolean
        {
            var data = this.getPropertyDescriptor(host, property);
            if (!data) return false;
            if (data.get && !data.set) return false;
            return true;
        }

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
        runFunc<T>(obj: T, func: (obj: T) => void): T
        {
            func(obj);
            return obj;
        }
    }

    objectutils = new ObjectUtils();
}