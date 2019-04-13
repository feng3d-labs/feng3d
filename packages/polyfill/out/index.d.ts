declare module '@feng3d/polyfill' {
    export = feng3d;
}
interface ObjectConstructor {
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
interface Map<K, V> {
    getKeys(): K[];
    getValues(): V[];
}
interface Array<T> {
    /**
     * 使数组变得唯一，不存在两个相等的元素
     *
     * @param compare 比较函数
     */
    unique(compare?: (a: T, b: T) => boolean): this;
    /**
     * 删除元素
     *
     * @param item 被删除元素
     * @returns 被删除元素在数组中的位置
     */
    delete(item: T): number;
}
//# sourceMappingURL=index.d.ts.map