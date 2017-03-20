module feng3d
{

    /**
     * 对象工具
     * @author feng 2017-02-15
     */
    export class ObjectUtils
    {
        /**
         * 深克隆
         * @param source        源数据
         * @returns             克隆数据
         */
        public static deepClone<T>(source: T): T
        {
            if (ClassUtils.isBaseType(source))
                return source;
            var target = ObjectUtils.getInstance(source);
            for (var attribute in source)
            {
                target[attribute] = ObjectUtils.deepClone(source[attribute]);
            }
            return target;
        }

        /**
         * 获取实例
         * @param source 实例对象
         */
        public static getInstance<T>(source: T): T
        {
            var cls = <any>source.constructor;
            var className = ClassUtils.getQualifiedClassName(source);
            var target: T = null;
            switch (className)
            {
                case "Uint16Array":
                case "Int16Array":
                case "Float32Array":
                    target = new cls(source["length"]);
                    break;
                default:
                    target = new cls();
            }
            return target;
        }

        /**
         * （浅）克隆
         * @param source        源数据
         * @returns             克隆数据
         */
        public static clone<T>(source: T): T
        {
            if (ClassUtils.isBaseType(source))
                return source;
            var prototype: any = source["prototype"] ? source["prototype"] : Object.getPrototypeOf(source);
            var target = new prototype.constructor();
            for (var attribute in source)
            {
                target[attribute] = source[attribute];
            }
            return target;
        }

        /**
         * （浅）拷贝数据
         */
        public static copy(target: Object, source: Object)
        {
            var keys = Object.keys(source);
            keys.forEach(element =>
            {
                target[element] = source[element];
            });
        }

        /**
         * 深拷贝数据
         */
        public static deepCopy(target: Object, source: Object)
        {
            var keys = Object.keys(source);
            keys.forEach(element =>
            {
                if (!source[element] || ClassUtils.isBaseType(source[element]))
                {
                    target[element] = source[element];
                }
                else if (!target[element])
                {
                    target[element] = ObjectUtils.deepClone(source[element]);
                }
                else
                {
                    ObjectUtils.copy(target[element], source[element]);
                }
            });
        }

        /**
         * 合并数据
         * @param source        源数据
         * @param mergeData     合并数据
         * @param createNew     是否合并为新对象，默认为false
         * @returns             如果createNew为true时返回新对象，否则返回源数据
         */
        public static merge<T>(source: T, mergeData: Object, createNew = false): T
        {
            if (ClassUtils.isBaseType(mergeData))
                return <any>mergeData;
            var target = createNew ? ObjectUtils.clone(source) : source;
            for (var mergeAttribute in mergeData)
            {
                target[mergeAttribute] = ObjectUtils.merge(source[mergeAttribute], mergeData[mergeAttribute], createNew);
            }
            return target;
        }

    }
}