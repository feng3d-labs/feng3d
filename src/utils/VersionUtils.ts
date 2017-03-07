module feng3d
{

    export class VersionUtils
    {
        /**
         * 获取对象版本
         * @param object 对象
         */
        public static getVersion(object: Object)
        {
            this.assertObject(object);
            if (!object.hasOwnProperty(_versionKey))
            {
                return -1;
            }
            return ~~object[_versionKey];
        }

        /**
         * 升级对象版本（版本号+1）
         * @param object 对象
         */
        public static upgradeVersion(object: Object)
        {
            this.assertObject(object);
            if (!object.hasOwnProperty(_versionKey))
            {
                Object.defineProperty(object, _versionKey, {
                    value: 0,
                    enumerable: false,
                    writable: true
                });
            }

            object[_versionKey] = ~~object[_versionKey] + 1;
        }

        /**
         * 设置版本号
         * @param object 对象
         * @param version 版本号
         */
        public static setVersion(object: Object, version: number)
        {
            this.assertObject(object);
            object[_versionKey] = ~~version;
        }

        /**
         * 判断两个对象的版本号是否相等
         */
        public static equal(a: Object, b: Object)
        {
            var va = this.getVersion(a);
            var vb = this.getVersion(b);
            if (va == -1 && vb == -1)
                return false;
            return va == vb;
        }

        /**
         * 断言object为对象类型
         */
        private static assertObject(object)
        {
            if (typeof object != "object")
            {
                throw `无法获取${object}的UID`;
            }
        }
    }

    /**
     * 版本号键名称
     */
    var _versionKey = "__version__";
}