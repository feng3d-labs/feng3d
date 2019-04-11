declare module '@feng3d/watcher' {
    export = feng3d;
}
declare namespace feng3d {
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
    function watch(onChange: string): (target: any, property: string) => void;
    var watcher: Watcher;
    class Watcher {
        /**
         * 注意：使用watch后获取该属性值的性能将会是原来的1/60，禁止在feng3d引擎内部使用watch
         * @param host
         * @param property1
         * @param handler
         * @param thisObject
         */
        watch<T, K extends keyof T, V extends T[K]>(host: T, property: K, handler: (host: T, property: string, oldvalue: V) => void, thisObject?: any): void;
        unwatch<T, K extends keyof T, V extends T[K]>(host: T, property: K, handler?: (host: T, property: string, oldvalue: V) => void, thisObject?: any): void;
        watchchain(host: any, property: string, handler?: (host: any, property: string, oldvalue: any) => void, thisObject?: any): void;
        unwatchchain(host: any, property: string, handler?: (host: any, property: string, oldvalue: any) => void, thisObject?: any): void;
    }
}
//# sourceMappingURL=index.d.ts.map