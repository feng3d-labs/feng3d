// namespace feng3d
// {
//     /**
//      * 序列化
//      */
//     export var serialization: Serialization;

//     /**
//      * 序列化装饰器，被装饰属性将被序列化
//      * @param {*} target                序列化原型
//      * @param {string} propertyKey      序列化属性
//      */
//     export function serialize(target: any, propertyKey: string)
//     {
//         var serializeInfo = getSerializeInfo(target);
//         serializeInfo.propertys.push({ property: propertyKey });
//     }

//     /**
//      * 序列化
//      */
//     export class Serialization
//     {
//         /**
//          * 序列化对象
//          * @param target 被序列化的对象
//          * @returns 序列化后可以转换为Json的数据对象 
//          */
//         serialize(target, saveFlags = HideFlags.DontSave)
//         {
//             //基础类型
//             if (isBaseType(target))
//                 return target;

//             // 排除不支持序列化对象
//             if (target.hasOwnProperty("serializable") && !target["serializable"])
//                 return undefined;

//             if (target instanceof Feng3dObject && !!(target.hideFlags & saveFlags))
//                 return undefined;

//             //处理数组
//             if (target.constructor === Array)
//             {
//                 var arr: any[] = [];
//                 for (var i = 0; i < target.length; i++)
//                 {
//                     arr[i] = this.serialize(target[i]);
//                 }
//                 return arr;
//             }

//             var object = <any>{};

//             //处理普通Object
//             if (target.constructor === Object)
//             {
//                 for (var key in target)
//                 {
//                     if (target.hasOwnProperty(key))
//                     {
//                         if (target[key] !== undefined)
//                         {
//                             object[key] = this.serialize(target[key]);
//                         }
//                     }
//                 }
//                 return object;
//             }

//             //处理方法
//             if (typeof target == "function")
//             {
//                 object[CLASS_KEY] = "function";
//                 object.data = target.toString();
//                 return object;
//             }

//             object[CLASS_KEY] = classUtils.getQualifiedClassName(target);

//             if (target["serialize"])
//                 return target["serialize"](object);

//             //使用默认序列化
//             var defaultInstance = getDefaultInstance(target);
//             this.different(target, defaultInstance, object);
//             return object;
//         }

//         /**
//          * 比较两个对象的不同，提取出不同的数据
//          * @param target 用于检测不同的数据
//          * @param defaultInstance   模板（默认）数据
//          * @param different 比较得出的不同（简单结构）数据
//          * @returns 比较得出的不同（简单结构）数据
//          */
//         different(target: Object, defaultInstance: Object, different?: Object)
//         {
//             different = different || {};
//             if (target == defaultInstance) return different;
//             if (defaultInstance == null)
//             {
//                 different = this.serialize(target);
//                 return different;
//             }
//             var serializableMembers = getSerializableMembers(target);
//             if (target.constructor == Object)
//                 serializableMembers = Object.keys(target).map(v => { return { property: v } });
//             for (var i = 0; i < serializableMembers.length; i++)
//             {
//                 var property = serializableMembers[i].property;
//                 if (target[property] === defaultInstance[property])
//                     continue;
//                 if (isBaseType(target[property]))
//                 {
//                     different[property] = target[property];
//                     continue;
//                 }
//                 if (defaultInstance[property] == null)
//                 {
//                     different[property] = this.serialize(target[property]);
//                     continue;
//                 }
//                 if (defaultInstance[property].constructor != target[property].constructor)
//                 {
//                     different[property] = this.serialize(target[property]);
//                     continue;
//                 }
//                 if (target[property].constructor == Array)
//                 {
//                     if (target[property].length == 0)
//                     {
//                         if (defaultInstance[property].length == 0)
//                             continue;
//                         different[property] = [];
//                         continue;
//                     }
//                     different[property] = this.serialize(target[property]);
//                     continue;
//                 }
//                 // 处理资源
//                 if (target[property] instanceof AssetData && target[property].assetId != undefined)
//                 {
//                     var diff0 = <any>{};
//                     diff0[CLASS_KEY] = classUtils.getQualifiedClassName(target[property]);
//                     diff0.assetId = target[property].assetId;
//                     different[property] = diff0;
//                     continue;
//                 }
//                 var diff = this.different(target[property], defaultInstance[property]);
//                 if (Object.keys(diff).length > 0)
//                     different[property] = diff;
//             }
//             return different;
//         }

//         /**
//          * 反序列化
//          * 
//          * 注意！ 如果反序列前需要把包含的资源提前加载，否则会报错！
//          * 
//          * @param object 换为Json的对象
//          * @returns 反序列化后的数据
//          */
//         deserialize(object)
//         {
//             //基础类型
//             if (isBaseType(object)) return object;

//             if (debuger && object.constructor == Object)
//             {
//                 let assetids = this.getAssets(object);
//                 var assets = assetids.reduce((pv, cv) => { var r = rs.getAssetData(cv); if (r) pv.push(r); return pv; }, []);
//                 console.assert(assetids.length == assets.length, `存在资源未加载，请使用 deserializeWithAssets 进行反序列化`)
//             }

//             //处理数组
//             if (Array.isArray(object))
//             {
//                 var arr = object.map(v => this.deserialize(v));
//                 return arr;
//             }
//             if (object.constructor != Object)
//             {
//                 return object;
//             }
//             // 获取类型
//             var className: string = object[CLASS_KEY];
//             // 处理普通Object
//             if (className == "Object" || className == null)
//             {
//                 var target = {};
//                 for (var key in object)
//                 {
//                     if (key != CLASS_KEY) target[key] = this.deserialize(object[key]);
//                 }
//                 return target;
//             }

//             //处理方法
//             if (className == "function")
//             {
//                 var f;
//                 eval("f=" + object.data);
//                 return f;
//             }

//             var cls = classUtils.getDefinitionByName(className);
//             if (!cls)
//             {
//                 console.warn(`无法序列号对象 ${className}`);
//                 return undefined;
//             }
//             target = new cls();
//             // 处理资源
//             if (target instanceof AssetData && object.assetId != undefined)
//             {
//                 var result = rs.getAssetData(object.assetId);
//                 debuger && console.assert(!!result)
//                 return result;
//             }
//             //处理自定义反序列化对象
//             if (target["deserialize"])
//                 return target["deserialize"](object);

//             //默认反序列
//             this.setValue(target, object);
//             return target;
//         }

//         /**
//          * 从数据对象中提取数据给目标对象赋值
//          * @param target 目标对象
//          * @param object 数据对象
//          */
//         setValue<T>(target: T, object: gPartial<T>)
//         {
//             if (!object) return target;

//             for (const property in object)
//             {
//                 if (object.hasOwnProperty(property))
//                 {
//                     this.setPropertyValue(target, object, property);
//                 }
//             }
//             return target;
//         }

//         /**
//          * 给目标对象的指定属性赋值
//          * @param target 目标对象
//          * @param object 数据对象
//          * @param property 属性名称
//          */
//         private setPropertyValue<T>(target: T, object: gPartial<T>, property: string)
//         {
//             if (target[property] == object[property])
//                 return;

//             var objvalue = object[property];
//             // 当原值等于null时直接反序列化赋值
//             if (target[property] == null)
//             {
//                 target[property] = this.deserialize(objvalue);
//                 return;
//             }
//             if (isBaseType(objvalue))
//             {
//                 target[property] = objvalue;
//                 return;
//             }
//             if (objvalue.constructor == Array)
//             {
//                 target[property] = this.deserialize(objvalue);
//                 return;
//             }
//             // 处理同为Object类型
//             if (objvalue[CLASS_KEY] == undefined)
//             {
//                 if (target[property].constructor == Object)
//                 {
//                     for (const key in objvalue)
//                     {
//                         this.setPropertyValue(target[property], objvalue, key);
//                     }
//                 } else
//                 {
//                     this.setValue(target[property], objvalue);
//                 }
//                 return;
//             }
//             // 处理资源
//             if (target[property] instanceof AssetData)
//             {
//                 target[property] = this.deserialize(objvalue);
//                 return;
//             }
//             var targetClassName = classUtils.getQualifiedClassName(target[property]);
//             if (targetClassName == objvalue[CLASS_KEY])
//             {
//                 this.setValue(target[property], objvalue);
//             } else
//             {
//                 target[property] = this.deserialize(objvalue);
//             }
//         }

//         /**
//          * 获取需要反序列化对象中的资源id列表
//          */
//         getAssets(object: any, assetids: string[] = [])
//         {
//             //基础类型
//             if (isBaseType(object)) return assetids;

//             //处理数组
//             if (Array.isArray(object))
//             {
//                 object.forEach(v => this.getAssets(v, assetids));
//                 return assetids;
//             }

//             // 获取类型
//             var className: string = object[CLASS_KEY];
//             // 处理普通Object
//             if (className == "Object" || className == null)
//             {
//                 for (var key in object)
//                 {
//                     if (key != CLASS_KEY) this.getAssets(object[key], assetids);
//                 }
//                 return assetids;
//             }
//             //处理方法
//             if (className == "function") return assetids;

//             var cls = classUtils.getDefinitionByName(className);
//             if (!cls)
//             {
//                 console.warn(`无法序列号对象 ${className}`);
//                 return assetids;
//             }
//             var target = new cls();
//             // 处理资源
//             if (target instanceof AssetData && object.assetId != undefined)
//             {
//                 assetids.push(object.assetId);
//                 return assetids;
//             }
//             return assetids;
//         }

//         /**
//          * 反序列化包含资源的对象
//          * 
//          * @param object 反序列化的对象
//          * @param callback 完成回调
//          */
//         deserializeWithAssets(object, callback: (result: any) => void)
//         {
//             var assetids = this.getAssets(object);
//             var result = [];
//             var fns = assetids.map(v => (callback) =>
//             {
//                 rs.readAssetData(v, (err, data) =>
//                 {
//                     result.push(data);
//                 });
//             });
//             task.parallel(fns)(() =>
//             {
//                 debuger && console.assert(assetids.length == result.filter(v => v != null).length);
//                 var r = this.deserialize(object);
//                 callback(r);
//             });
//         }

//         /**
//          * 克隆
//          * @param target 被克隆对象
//          */
//         clone<T>(target: T): T
//         {
//             return this.deserialize(this.serialize(target));
//         }
//     }

//     export var CLASS_KEY = "__class__";

//     var SERIALIZE_KEY = "_serialize__";

//     interface SerializeInfo
//     {
//         propertys: { property: string, asset?: boolean }[];
//         default: Object;
//     }

//     /**
//      * 判断是否为基础类型（在序列化中不发生变化的对象）
//      */
//     function isBaseType(object)
//     {
//         //基础类型
//         if (
//             object == undefined
//             || object == null
//             || typeof object == "boolean"
//             || typeof object == "string"
//             || typeof object == "number"
//         )
//             return true;
//     }

//     /**
//      * 获取默认实例
//      */
//     function getDefaultInstance(object: Object)
//     {
//         var serializeInfo: SerializeInfo = getSerializeInfo(object);
//         serializeInfo.default = serializeInfo.default || new (<any>object.constructor)();
//         return serializeInfo.default;
//     }

//     /**
//      * 获取序列号信息
//      * @param object 对象
//      */
//     function getSerializeInfo(object: Object)
//     {
//         if (!Object.getOwnPropertyDescriptor(object, SERIALIZE_KEY))
//         {
//             Object.defineProperty(object, SERIALIZE_KEY, {
//                 /**
//                  * uv数据
//                  */
//                 value: { propertys: [] },
//                 enumerable: false,
//                 configurable: true
//             });
//         }
//         var serializeInfo: SerializeInfo = object[SERIALIZE_KEY];
//         return serializeInfo;
//     }

//     /**
//      * 获取序列化属性列表
//      */
//     function getSerializableMembers(object: Object, serializableMembers?: { property: string; asset?: boolean; }[])
//     {
//         serializableMembers = serializableMembers || [];
//         if (object["__proto__"])
//         {
//             getSerializableMembers(object["__proto__"], serializableMembers);
//         }
//         var serializeInfo = getSerializeInfo(object);
//         if (serializeInfo)
//         {
//             var propertys = serializeInfo.propertys;
//             for (let i = 0, n = propertys.length; i < n; i++)
//             {
//                 serializableMembers.push(propertys[i]);
//             }
//         }
//         return serializableMembers;
//     }

//     export interface SerializationTempInfo
//     {
//         loadingNum?: number;
//         onLoaded?: () => void;
//     }

//     function initTempInfo(tempInfo?: SerializationTempInfo)
//     {
//         tempInfo = tempInfo || { loadingNum: 0, onLoaded: () => { } };
//         tempInfo.loadingNum = tempInfo.loadingNum || 0;
//         return tempInfo;
//     }

//     serialization = new Serialization();
// }

// // [Float32Array, Float64Array, Int8Array, Int16Array, Int32Array, Uint8Array, Uint16Array, Uint32Array, Uint8ClampedArray].forEach(element =>
// // {
// //     element.prototype["serialize"] = function (object: { value: number[] })
// //     {
// //         object.value = Array.from(this);
// //         return object;
// //     }

// //     element.prototype["deserialize"] = function (object: { value: number[] })
// //     {
// //         return new (<any>(this.constructor))(object.value);
// //     }
// // });