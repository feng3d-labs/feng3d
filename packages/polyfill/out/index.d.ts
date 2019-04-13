declare module '@feng3d/polyfill' {
    export = feng3d;
}
declare namespace feng3d {
    /**
     * Object 工具
     *
     * 增强Object功能
     */
    var objectutils: ObjectUtils;
    /**
     * Object 工具
     *
     * 增强Object功能
     */
    class ObjectUtils {
        /**
         * 从对象以及对象的原型中获取属性描述
         * @param obj 对象
         * @param property 属性名称
         */
        getPropertyDescriptor(host: Object, property: string): PropertyDescriptor;
        /**
         * 属性是否可写
         * @param obj 对象
         * @param property 属性名称
         */
        propertyIsWritable(host: Object, property: string): boolean;
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
}
declare namespace feng3d {
    /**
     * 增强Map功能
     */
    var maputils: MapUtils;
    /**
     * 增强Map功能
     */
    class MapUtils {
        /**
         * 获取所有键
         *
         * @param map Map对象
         */
        getKeys<K, V>(map: Map<K, V>): K[];
        /**
         * 获取所有值
         *
         * @param map Map对象
         */
        getValues<K, V>(map: Map<K, V>): V[];
    }
}
declare namespace feng3d {
    /**
     * 数组工具，增强Array功能
     */
    var arrayutils: ArrayUtils;
    /**
     * 数组工具，增强Array功能
     */
    class ArrayUtils {
        /**
         * 使数组变得唯一，不存在两个相等的元素
         *
         * @param arr 数组
         * @param compare 比较函数
         *
         * @returns 返回传入的数组
         */
        unique<T>(arr: T[], compare?: (a: T, b: T) => boolean): T[];
        /**
         * 删除第一个指定元素
         *
         * @param arr 数组
         * @param item 被删除元素
         *
         * @returns 被删除元素在数组中的位置
         */
        delete<T>(arr: T[], item: T): number;
    }
}
//# sourceMappingURL=index.d.ts.map