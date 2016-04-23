module feng3d {

    /**
     * 获取对象的完全限定类名
     * @author feng 2016-4-24
     */
    export function getQualifiedClassName(value: any): string {
        var type = typeof value;
        if (!value || (type != "object" && !value.prototype)) {
            return type;
        }
        var prototype: any = value.prototype ? value.prototype : Object.getPrototypeOf(value);
        var constructorString: string = prototype.constructor.toString().trim();
        var className = /([\w$]+)\(/.exec(constructorString)[1];
        return className;
    }
}