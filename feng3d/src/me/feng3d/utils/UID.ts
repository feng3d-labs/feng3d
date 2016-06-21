module me.feng3d {

    /**
     * 获取对象UID
     * @author feng 2016-05-08
     */
    export function getUID(object: { __uid__?: string }) {

        if (typeof object != "object") {
            throw `无法获取${object}的UID`;
        }

        if (object.hasOwnProperty(uidKey)) {
            return object[uidKey];
        }
        var uid = createUID(object);
        Object.defineProperty(object, uidKey, {
            value: uid,
            enumerable: false,
            writable: false
        });
        return uid;
    }

    /**
     * 创建对象的UID
     * @param object 对象
     */
    function createUID(object: any) {

        var className = getClassName(object);
        var uid = [//
            className,//类名
            StringUtils.getString(~~uidStart[className], 8, "0", false),//类id
            Date.now(),//时间戳
        ].join("-");

        uidStart[className] = ~~uidStart[className] + 1;
        return uid;
    }

    /**
     * uid自增长编号
     */
    var uidStart: { [className: string]: number } = {};

    /**
     * uid属性名称
     */
    var uidKey = "__uid__";
}