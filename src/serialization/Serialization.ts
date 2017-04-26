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
        public readObject(data: { __className__?: string })
        {
            //处理简单类型
            if (ClassUtils.isBaseType(data))
            {
                return data;
            }
            //处理数组
            if (data instanceof Array)
            {
                var arr = [];
                for (var i = 0; i < data.length; i++)
                {
                    arr[i] = this.readObject(data[i]);
                }
                return arr;
            }

            //处理其他数据结构
            var cls = ClassUtils.getDefinitionByName(data.__className__);
            debuger && assert(cls != null);
            var object = new cls();

            var keys = Object.keys(data);
            for (var i = 0; i < keys.length; i++)
            {
                var key = keys[i];
                var ishandle = this.handle(object, key, data[key]);
                if (ishandle)
                    continue;
                object[key] = this.readObject(data[key]);
            }
            return object;
        }

        private handle(object, key, data)
        {
            if (ClassUtils.is(object, GameObject) && key == "children_")
            {
                var children: GameObject[] = this.readObject(data);
                var object3D: GameObject = object;
                for (var i = 0; i < children.length; i++)
                {
                    children[i] && object3D.setChildAt(children[i], i);
                }
                return true;
            }
            if (ClassUtils.is(object, Component) && key == "components_")
            {
                var components: Component[] = this.readObject(data);
                var component: Component = object;
                for (var i = 0; i < components.length; i++)
                {
                    component.setComponentAt(components[i], i);
                }
                return true;
            }
            if (ClassUtils.is(object, SegmentGeometry) && key == "segments_")
            {
                var segments: Segment[] = this.readObject(data);
                var segmentGeometry: SegmentGeometry = object;
                for (var i = 0; i < segments.length; i++)
                {
                    segmentGeometry.setSegmentAt(segments[i], i);
                }
                return true;
            }
            return false;
        }

        /**
         * 由复杂类型（例如feng3d对象）转换为纯数据对象（无循环引用）
         */
        public writeObject(object: Object)
        {
            //排除指定对象
            if (serializationConfig.excludeObject.indexOf(object) != -1)
            {
                return undefined;
            }

            if (ClassUtils.isBaseType(object))
            {
                return object;
            }
            if (object instanceof Array)
            {
                var arr = [];
                for (var i = 0; i < object.length; i++)
                {
                    var item = this.writeObject(object[i]);
                    if (item !== undefined)
                    {
                        arr.push(item);
                    }
                }
                if (arr.length == 0)
                    return undefined;
                return arr;
            }

            var className = ClassUtils.getQualifiedClassName(object);
            var toJson = serializationConfig.classConfig[className] && serializationConfig.classConfig[className].toJson;
            if (toJson)
            {
                return toJson(object);
            }

            var attributeNames = this.getAttributes(object);
            attributeNames = attributeNames.sort();

            //没有属性时不保存该对象
            if (attributeNames.length == 0)
                return undefined;

            var json: { __className__: string } = <any>{};
            json.__className__ = className;

            for (var i = 0; i < attributeNames.length; i++)
            {
                var attributeName = attributeNames[i];
                var value = this.writeObject(object[attributeName]);
                if (value !== undefined)
                {
                    json[attributeName] = value;
                }
            }
            return json;
        }

        private getAttributes(object: Object)
        {
            var className = ClassUtils.getQualifiedClassName(object);

            //保存以字母开头或者纯数字的所有属性
            var filterReg = /([a-zA-Z](\w*)|(\d+))/;
            if (className == "Array" || className == "Object")
            {
                var attributeNames = Object.keys(object);
            } else
            {
                //
                var attributeNames = Object.keys(this.getNewObject(className));
                attributeNames = attributeNames.filter((value: string, index: number, array: string[]) =>
                {
                    var result = filterReg.exec(value);
                    return result[0] == value;
                });
            }
            return attributeNames;
        }

        /**
         * 获取新对象来判断存储的属性
         */
        private getNewObject(className: string)
        {
            if (tempObjectMap[className])
            {
                return tempObjectMap[className];
            }
            var cls = ClassUtils.getDefinitionByName(className);
            tempObjectMap[className] = new cls();
            return tempObjectMap[className];
        }
    }

    var tempObjectMap = {};

    export var serializationConfig: {
        excludeObject: any[],
        excludeClass: any[];
        classConfig: {
            [className: string]: {
                toJson?: Function
            };
        };
    } = {
            // export var serializationConfig = {
            excludeObject: [],
            excludeClass: [], classConfig: {
                // "feng3d.Transform": {
                //     toJson: (object: Transform) =>
                //     {
                //         return "[" + object.matrix3d.rawData.toString() + "]";
                //     }
                // }
            }
        };
}