module me.feng3d {

    /**
     * 获取对象版本
     * @param object 对象
     */
    export function getVersion(object) {
        if (typeof object != "object") {
            throw `无法获取${object}的UID`;
        }

        return ~~object[versionKey];
    }

    /**
     * 升级对象版本
     * @param object 对象
     */
    export function upgradeVersion(object) {

        if (typeof object != "object") {
            throw `无法获取${object}的版本号`;
        }
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
     * 版本号键名称
     */
    var versionKey = "__version__";
}