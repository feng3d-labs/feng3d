declare namespace feng3d {
    /**
     * 序列化装饰器，被装饰属性将被序列化
     * @param {*} target                序列化原型
     * @param {string} propertyKey      序列化属性
     */
    function serialize(target: any, propertyKey: string): void;
}
declare namespace feng3d {
    var serialization: {
        serialize: (target: any) => any;
        deserialize: (object: any, target?: any) => any;
    };
}
