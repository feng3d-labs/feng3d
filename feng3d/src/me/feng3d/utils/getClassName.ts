module me.feng3d {

    /**
     * 获取对象的类名
     * @author feng 2016-4-24
     */
    export function getClassName(value: any): string {
        var prototype: any = value.prototype ? value.prototype : Object.getPrototypeOf(value);
        var className: string = prototype.constructor.name;
        return className;
    }
}