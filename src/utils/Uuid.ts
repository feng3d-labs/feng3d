namespace feng3d
{
    /**
     * 通用唯一标识符（Universally Unique Identifier）
     * 
     * 用于给所有对象分配一个通用唯一标识符
     */
    export class Uuid
    {

        /**
         * 获取数组 通用唯一标识符
         * 
         * @param arr 数组
         * @param separator 分割符
         */
        getArrayUuid(arr: any[], separator = "$__uuid__$")
        {
            var uuids = arr.map(v => this.getObjectUuid(v));
            var groupUuid = uuids.join(separator);
            return groupUuid;
        }

        /**
         * 获取对象 通用唯一标识符
         * 
         * 当参数object非Object对象时强制转换为字符串返回
         * 
         * @param object 对象
         */
        getObjectUuid(object: Object)
        {
            if (Object.isBaseType(object))
            {
                return String(object);
            }
            if (!object[__uuid__])
            {
                Object.defineProperty(object, __uuid__, { value: Math.uuid() });
            }
            return object[__uuid__];
        }
        objectUuid = new WeakMap<Object, string>();
    }

    export const __uuid__ = "__uuid__";
    export const uuid = new Uuid();
}