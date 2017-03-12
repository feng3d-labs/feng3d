module feng3d
{
    /**
     * 数据持久化
     * @author feng 2017-03-11
     */
    export class Serialization
    {
        /**
         * 由纯数据对象（无循环引用）转换为复杂类型（例如feng3d对象）
         */
        public readObject()
        {

        }

        /**
         * 由复杂类型（例如feng3d对象）转换为纯数据对象（无循环引用）
         */
        public writeObject(object3d: Object3D)
        {
            var className = ClassUtils.getQualifiedClassName(object3d);

            //处理排除类名
            if (serializationConfig.excludeClass.indexOf(className) != -1)
            {
                return undefined;
            }

            //新增命名规范过滤
            var filterFuns = [this.namenormFilter(/[a-zA-Z](\w+)/)];

            var classConfig = this.getClassConfig(object3d);
            if (classConfig && classConfig.excludeAttributes)
            {
                filterFuns.push(this.excludeAttributeFilter(classConfig.excludeAttributes));
            }
            var attributeFilter = this.attributeFilter(filterFuns);

            var propertyDescriptors = PropertyDescriptorUtils.getAttributes(object3d);
            var attributeNames = Object.keys(propertyDescriptors);
            attributeNames = attributeNames.filter(attributeFilter);
            attributeNames = attributeNames.sort();

            var object: { __className__: string } = <any>{};
            object.__className__ = className;

            for (var i = 0; i < attributeNames.length; i++)
            {
                var attributeName = attributeNames[i];
                var attributeValue = object3d[attributeName];
                if (ClassUtils.isBaseType(attributeValue))
                {
                    object[attributeName] = attributeValue;
                } else
                {
                    var data = this.writeObject(attributeValue);
                    if (data !== undefined)
                    {
                        object[attributeName] = data;
                    }
                }
            }
            return object;
        }

        /**
         * 命名规范过滤
         */
        private attributeFilter(filters: ((value: string, index: number, array: string[]) => boolean)[])
        {
            return (value: string, index: number, array: string[]) =>
            {
                for (var i = 0; i < filters.length; i++)
                {
                    var result = filters[i].call(null, value, index, array);
                    if (!result)
                        return false;
                }
                return true;
            }
        }

        /**
         * 排除属性过滤
         */
        private excludeAttributeFilter(excludeAttributes: string[])
        {
            return (value: string, index: number, array: string[]) =>
            {
                return excludeAttributes.indexOf(value) == -1;
            }
        }

        /**
         * 命名规范过滤
         */
        private namenormFilter(filterReg: RegExp)
        {
            return (value: string, index: number, array: string[]) =>
            {
                var result = filterReg.exec(value);
                return result[0] == value;
            }
        }

        /**
         * 获取类配置，允许继承
         */
        private getClassConfig(object: Object): { excludeAttributes: string[]; }
        {
            if (object == null || object == Object.prototype)
                return null;
            var className = ClassUtils.getQualifiedClassName(object);
            var config = serializationConfig.classConfig[className];
            if (config)
            {
                return config;
            }
            var superCls = ClassUtils.getSuperClass(object);
            return this.getClassConfig(superCls);
        }
    }

    export var serializationConfig: {
        excludeClass: any[];
        classConfig: {
            [className: string]: {
                excludeAttributes: string[];
            };
        };
    } = {
            // export var serializationConfig = {
            excludeClass: [], classConfig: {
                "feng3d.Scene3D": {
                    excludeAttributes: ["lights", "renderers", "transform"]
                }
            }
        };
}