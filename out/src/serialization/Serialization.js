var feng3d;
(function (feng3d) {
    /**
     * 序列化装饰器，被装饰属性将被序列化
     * @param {*} target                序列化原型
     * @param {string} propertyKey      序列化属性
     */
    function serialize(target, propertyKey) {
        if (!Object.getOwnPropertyDescriptor(target, "__serializableMembers"))
            target.__serializableMembers = [];
        target.__serializableMembers.push(propertyKey);
    }
    feng3d.serialize = serialize;
})(feng3d || (feng3d = {}));
Object.defineProperty(Object.prototype, "serializableMembers", {
    get: function () {
        var serializableMembers = [];
        var property = this.__proto__;
        while (property) {
            var superserializableMembers = property.__serializableMembers;
            if (superserializableMembers) {
                serializableMembers = superserializableMembers.concat(serializableMembers);
            }
            property = property.__proto__;
        }
        return serializableMembers;
    },
    enumerable: false,
    configurable: false
});
(function (feng3d) {
    feng3d.serialization = {
        serialize: serialize,
        deserialize: deserialize,
    };
    function serialize(target) {
        //基础类型
        if (typeof target == "boolean"
            || typeof target == "string"
            || typeof target == "number"
            || target == null
            || target == undefined) {
            return target;
        }
        else if (target instanceof Array) {
            var arr = [];
            target.forEach(function (element) {
                var arritem = serialize(element);
                if (arritem !== undefined)
                    arr.push(arritem);
            });
            return arr;
        }
        else {
            if (target.hasOwnProperty("serializable") && !target["serializable"])
                return undefined;
            var object = {};
            object["__class__"] = feng3d.ClassUtils.getQualifiedClassName(target);
            if (target["serialize"]) {
                target["serialize"](object);
            }
            else {
                var serializableMembers = target["serializableMembers"];
                if (serializableMembers) {
                    for (var i = 0, n = serializableMembers.length; i < n; i++) {
                        var property = serializableMembers[i];
                        if (target[property] !== undefined)
                            object[property] = serialize(target[property]);
                    }
                }
                else {
                    for (var key in target) {
                        if (target.hasOwnProperty(key)) {
                            if (target[key] !== undefined && !(target[key] instanceof Function))
                                object[key] = serialize(target[key]);
                        }
                    }
                }
            }
            return object;
        }
    }
    function deserialize(object, target) {
        if (target === void 0) { target = null; }
        //基础类型
        if (typeof object == "boolean"
            || typeof object == "string"
            || typeof object == "number"
            || object == null
            || object == undefined) {
            return object;
        }
        else if (object instanceof Array) {
            var arr = [];
            object.forEach(function (element) {
                arr.push(deserialize(element));
            });
            return arr;
        }
        else {
            if (!target && object.uuid && feng3d.Feng3dObject.get(object.uuid)) {
                target = feng3d.Feng3dObject.get(object.uuid);
            }
            if (!target) {
                var className = object["__class__"];
                if (className) {
                    var cls = feng3d.ClassUtils.getDefinitionByName(className);
                    target = new cls();
                }
                else {
                    target = {};
                }
            }
            if (target["deserialize"]) {
                target["deserialize"](object);
            }
            else {
                var serializableMembers = target["serializableMembers"];
                if (serializableMembers) {
                    for (var i = 0, n = serializableMembers.length; i < n; i++) {
                        var property = serializableMembers[i];
                        target[property] = deserialize(object[property]);
                    }
                }
                else {
                    for (var key in object) {
                        target[key] = deserialize(object[key]);
                    }
                }
            }
            return target;
        }
    }
})(feng3d || (feng3d = {}));
//# sourceMappingURL=Serialization.js.map