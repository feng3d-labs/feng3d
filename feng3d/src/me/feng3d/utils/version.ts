module me.feng3d {

    export class Version {

        /**
         * 获取对象版本
         * @param object 对象
         */
        getVersion(object: Object) {

            this.assertObject(object);
            if (!object.hasOwnProperty(versionKey)) {
                return -1;
            }
            return ~~object[versionKey];
        }

        /**
         * 升级对象版本（版本号+1）
         * @param object 对象
         */
        upgradeVersion(object: Object) {

            this.assertObject(object);
            if (!object.hasOwnProperty(versionKey)) {
                Object.defineProperty(object, versionKey, {
                    value: 0,
                    enumerable: false,
                    writable: true
                });
            }

            object[versionKey] = ~~object[versionKey] + 1;
        }

        /**
         * 设置版本号
         * @param object 对象
         * @param version 版本号
         */
        setVersion(object: Object, version: number) {

            this.assertObject(object);
            object[versionKey] = ~~version;
        }

        /**
         * 判断两个对象的版本号是否相等
         */
        equal(a: Object, b: Object) {
            return this.getVersion(a) == this.getVersion(b);
        }

        /**
         * 断言object为对象类型
         */
        private assertObject(object) {
            if (typeof object != "object") {
                throw `无法获取${object}的UID`;
            }
        }
    }

    /**
     * 版本号键名称
     */
    var versionKey = "__version__";

    /**
     * 对象版本
     */
    export var version = new Version();
}