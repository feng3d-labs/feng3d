module feng3d
{

    /**
     * 属性描述工具类
     * @author feng 2017-02-23
     */
    export class PropertyDescriptorUtils
    {

        /**
         * 判断是否为函数
         * 
         * @static
         * @param {PropertyDescriptor} propertyDescriptor 属性描述
         * @returns 
         * 
         * @memberOf PropertyDescriptorUtils
         */
        public static isFunction(propertyDescriptor: PropertyDescriptor)
        {
            return Boolean(propertyDescriptor.value && typeof propertyDescriptor.value == "function");
        }

        /**
         * 判断是否写
         * 
         * @static
         * @param {PropertyDescriptor} propertyDescriptor 属性描述
         * @returns 
         * 
         * @memberOf PropertyDescriptorUtils
         */
        public static isWritable(propertyDescriptor: PropertyDescriptor)
        {
            return Boolean(propertyDescriptor.writable || propertyDescriptor.set);
        }

        /**
         * 获取属性描述
         * 
         * @static
         * @param {Object} object 
         * @param {string} name 
         * @returns 
         * 
         * @memberOf PropertyDescriptorUtils
         */
        public static getPropertyDescriptor(object: Object, name: string)
        {
            return Object.getOwnPropertyDescriptor(object, name) || Object.getOwnPropertyDescriptor(object.constructor.prototype, name);
        }

        /**
         * 获取所有属性描述（不包含函数）
         * 
         * @static
         * @param {Object} object 对象
         * @returns 
         * 
         * @memberOf PropertyDescriptorUtils
         */
        public static getAttributes(object: Object)
        {
            var attributePropertyDescriptors: { [propertyKey: string]: PropertyDescriptor } = {};
            var propertyDescriptors = this.getPropertyDescriptors(object);
            for (var property in propertyDescriptors)
            {
                var element = propertyDescriptors[property];
                if (!this.isFunction(element))
                    attributePropertyDescriptors[property] = element;
            }
            return attributePropertyDescriptors;
        }

        /**
         * 获取所有属性描述
         * 
         * @static
         * @param {Object} object 
         * @returns 
         * 
         * @memberOf PropertyDescriptorUtils
         */
        public static getPropertyDescriptors(object: Object)
        {
            var propertyDescriptors: { [propertyKey: string]: PropertyDescriptor } = {};
            var names = Object.getOwnPropertyNames(object);
            names.forEach(element =>
            {
                propertyDescriptors[element] = this.getPropertyDescriptor(object, element);
            });
            if (object.constructor != Object)
            {
                var names = Object.getOwnPropertyNames(object.constructor.prototype);
                names.forEach(element =>
                {
                    propertyDescriptors[element] = this.getPropertyDescriptor(object, element);
                });
            }
            delete propertyDescriptors["constructor"];
            return propertyDescriptors;
        }
    }
}