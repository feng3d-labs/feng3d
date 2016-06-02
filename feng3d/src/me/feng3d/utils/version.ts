module me.feng3d {

    /**
     * 获取对象版本
     * @param object 对象
     */
    export function getVersion(object) {

        assertObject(object);
        return ~~object[versionKey];
    }

    /**
     * 升级对象版本
     * @param object 对象
     */
    export function upgradeVersion(object) {

        assertObject(object);
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
    export function setVersion(object, version: number) {

        assertObject(object);
        object[versionKey] = ~~version;
    }

    function assertObject(object) {
        if (typeof object != "object") {
            throw `无法获取${object}的UID`;
        }
    }

    /**
     * 版本号键名称
     */
    var versionKey = "__version__";
}