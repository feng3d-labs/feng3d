declare namespace feng3d {
    /**
     * 观察装饰器，观察被装饰属性的变化
     *
     * @param onChange 属性变化回调  例如参数为“onChange”时，回调将会调用this.onChange(property, oldValue, newValue)
     *
     * 使用@watch后会自动生成一个带"_"的属性，例如 属性"a"会生成"_a"
     *
     * 通过使用 eval 函数 生成出 与自己手动写的set get 一样的函数，性能已经接近 手动写的get set函数。
     *
     * 性能比Watcher.watch更加高效，但还是建议使用 Watcher.watch 替代 @watch ，由于 @watch 没有对onChange更好的约束 使用 时容易出现运行时报错。
     */
    function watch(onChange: string): (target: any, property: string) => void;
    var watcher: Watcher;
    class Watcher {
        /**
         * 监听对象属性的变化
         *
         * 注意：使用watch后获取该属性值的性能将会是原来的1/60，避免在运算密集处使用该函数。
         *
         * @param object 被监听对象
         * @param property 被监听属性
         * @param handler 变化回调函数 (object: T, property: string, oldValue: V) => void
         * @param thisObject 变化回调函数 this值
         */
        watch<T, K extends PropertyNames<T>, V extends T[K]>(object: T, property: K, handler: (newValue: V, oldValue: V, object: T, property: string) => void, thisObject?: any): void;
        /**
         * 取消监听对象属性的变化
         *
         * @param object 被监听对象
         * @param property 被监听属性
         * @param handler 变化回调函数 (object: T, property: string, oldValue: V) => void
         * @param thisObject 变化回调函数 this值
         */
        unwatch<T, K extends PropertyNames<T>, V extends T[K]>(object: T, property: K, handler?: (newValue: V, oldValue: V, object: T, property: string) => void, thisObject?: any): void;
        private _binds;
        /**
         * 绑定两个对象的指定属性，保存两个属性值同步。
         *
         * @param object0 第一个对象。
         * @param property0 第一个对象的属性名称。
         * @param object1 第二个对象。
         * @param property1 第二个对象的属性名称。
         */
        bind<T0, T1, K0 extends PropertyNames<T0>, K1 extends PropertyNames<T1>>(object0: T0, property0: K0, object1: T1, property1: K1): void;
        /**
         * 解除两个对象的指定属性的绑定。
         *
         * @param object0 第一个对象。
         * @param property0 第一个对象的属性名称。
         * @param object1 第二个对象。
         * @param property1 第二个对象的属性名称。
         */
        unbind<T0, T1, K0 extends PropertyNames<T0>, K1 extends PropertyNames<T1>>(object0: T0, property0: K0, object1: T1, property1: K1): void;
        /**
         * 监听对象属性链值变化
         *
         * @param object 被监听对象
         * @param property 被监听属性 例如："a.b"
         * @param handler 变化回调函数 (newValue: any, oldValue: any, object: any, property: string) => void
         * @param thisObject 变化回调函数 this值
         */
        watchchain(object: any, property: string, handler: (newValue: any, oldValue: any, object: any, property: string) => void, thisObject?: any): void;
        /**
         * 取消监听对象属性链值变化
         *
         * @param object 被监听对象
         * @param property 被监听属性 例如："a.b"
         * @param handler 变化回调函数 (object: T, property: string, oldValue: V) => void
         * @param thisObject 变化回调函数 this值
         */
        unwatchchain(object: any, property: string, handler?: (newValue: any, oldValue: any, object: any, property: string) => void, thisObject?: any): void;
        /**
         * 监听对象属性链值变化
         *
         * @param object 被监听对象
         * @param property 被监听属性 例如：{a:{b:null,d:null}} 表示监听 object.a.b 与 object.a.d 值得变化，如果property == object时表示监听对象中所有叶子属性变化。
         * @param handler 变化回调函数 (object: T, property: string, oldValue: V) => void
         * @param thisObject 变化回调函数 this值
         */
        watchobject<T>(object: T, property: gPartial<T>, handler: (object: any, property: string, oldValue: any) => void, thisObject?: any): void;
        /**
         * 取消监听对象属性链值变化
         *
         * @param object 被监听对象
         * @param property 被监听属性 例如：{a:{b:null,d:null}} 表示监听 object.a.b 与 object.a.d 值得变化，如果property == object时表示监听对象中所有叶子属性变化。
         * @param handler 变化回调函数 (object: T, property: string, oldValue: V) => void
         * @param thisObject 变化回调函数 this值
         */
        unwatchobject<T>(object: T, property: gPartial<T>, handler?: (object: any, property: string, oldValue: any) => void, thisObject?: any): void;
    }
    const __watchs__ = "__watchs__";
    const __watchchains__ = "__watchchains__";
}
//# sourceMappingURL=watcher.d.ts.map