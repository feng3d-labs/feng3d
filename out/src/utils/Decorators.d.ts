declare namespace feng3d {
    /**
     * 观察装饰器，观察被装饰属性的变化
     *
     * *对使用watch修饰的属性赋值比未使用的性能差距100倍左右*
     * @param onChange 属性变化回调
     */
    function watch(onChange: string): (target: any, propertyKey: string) => void;
}
