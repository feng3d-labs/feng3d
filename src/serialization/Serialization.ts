module feng3d
{
    /**
     * 数据序列化
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

            //保存以字母开头或者纯数字的所有属性
            var filterReg = /([a-zA-Z](\w*)|(\d+))/;
            if (className == "Array" || className == "Object")
            {
                var attributeNames = Object.keys(object3d);
            } else
            {
                //
                var attributeNames = Object.keys(this.getNewObject(className));
                attributeNames = attributeNames.filter((value: string, index: number, array: string[]) =>
                {
                    var result = filterReg.exec(value);
                    return result[0] == value;
                });
                attributeNames = attributeNames.sort();
            }

            var object: { __className__: string };
            if (className == "Array")
            {
                object = <any>[];

            } else
            {
                object = <any>{};
            }
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
         * 获取新对象来判断存储的属性
         */
        private getNewObject(className: string)
        {
            var cls = ClassUtils.getDefinitionByName(className);
            return new cls();
        }
    }

    // export var serializationConfig: {
    //     excludeClass: any[];
    //     classConfig: {
    //         [className: string]: {
    //             excludeAttributes: string[];
    //         };
    //     };
    // } = {
    //         // export var serializationConfig = {
    //         excludeClass: [], classConfig: {
    //             "feng3d.Scene3D": {
    //                 excludeAttributes: ["lights", "renderers", "transform"]
    //             }
    //         }
    //     };
}