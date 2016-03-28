module feng3d {

	/**
	 * 类工具
	 * @author feng 2015-4-27
	 */
    export class ClassUtils {
		/**
		 * 基础类型列表
		 */
        public static BASETYPES = ["int", "boolean", "Number", "uint", "string", "null"];

		/**
		 * 获取类定义
		 * @param obj
		 * @return
		 */
        public static getClass(obj: any): any {
            if (typeof obj === "string") {
                try {
                    return getDefinitionByName(obj);
                }
                catch (error) {
                    return null;
                }
            }

            var cla = obj;

            var className: string = getQualifiedClassName(obj);
            if (className == "null" || className == "void") {
                return null;
            }

            if (cla == null) {
                cla = getDefinitionByName(className);
            }
            return cla;
        }

		/**
		 * 获取类实例
		 * @param obj
		 * @return
		 */
        public static getInstance(obj: any): any {
            if (typeof obj === "function") {
                return new obj();
            }
            if (typeof obj == "string") {
                var cla = this.getClass(obj);
                return new cla;
            }
            return obj;
        }

		/**
		 * 构造实例
		 * @param cla						类定义
		 * @param params					构造参数
		 * @return							构造出的实例
		 */
        public static structureInstance(cla: any, params: any[]): any {
            if (params == null) {
                return new cla();
            }

            var paramNum: number = params.length;

            switch (paramNum) {
                case 0:
                    return new cla();
                case 1:
                    return new cla(params[0]);
                case 2:
                    return new cla(params[0], params[1]);
                case 3:
                    return new cla(params[0], params[1], params[2]);
                case 4:
                    return new cla(params[0], params[1], params[2], params[3]);
                case 5:
                    return new cla(params[0], params[1], params[2], params[3], params[4]);
                case 6:
                    return new cla(params[0], params[1], params[2], params[3], params[4], params[5]);
                case 7:
                    return new cla(params[0], params[1], params[2], params[3], params[4], params[5], params[6]);
                case 8:
                    return new cla(params[0], params[1], params[2], params[3], params[4], params[5], params[6], params[7]);
                case 9:
                    return new cla(params[0], params[1], params[2], params[3], params[4], params[5], params[6], params[7], params[8]);
                case 10:
                    return new cla(params[0], params[1], params[2], params[3], params[4], params[5], params[6], params[7], params[8], params[9]);
                default:
                    throw new Error("不支持" + paramNum + "个参数的类构造");
            }
        }

		/**
		 * 构造实例
		 * @param space						运行空间
		 * @param funcName					函数名称
		 * @param params					函数参数
		 * @return							函数返回值
		 */
        public static call(space: Object, funcName: string, params: any[]): any {
            var func: Function = space[funcName];
            var result = func.apply(null, params);
            return result;
        }

		/**
		 * 编码参数
		 * @param params		参数数组
		 */
        public static encodeParams(params: any[]): void {
            for (var i: number = 0; i < params.length; i++) {
                var item: Object = params[i];
                var paramType: string = getQualifiedClassName(item);
                params[i] = { paramType: paramType, paramValue: item };
            }
        }

		/**
		 * 解码参数
		 * @param params		参数数组
		 */
        public static decodeParams(params: any[]): void {
            for (var i: number = 0; i < params.length; i++) {
                var item: any = params[i];

                if (item.hasOwnProperty("paramType") && item.hasOwnProperty("paramValue")) {
                    var obj: Object;
                    if (item.paramType == "flash.geom::Matrix3D") {
                        obj = new Matrix3D(item.paramValue.rawData);
                    }
                    else {
                        obj = ClassUtils.getInstance(item.paramType);
                        if (this.isBaseType(item.paramValue)) {
                            obj = item.paramValue;
                        }
                        else {
                            this.copyValue(obj, item.paramValue);
                        }
                    }
                    params[i] = obj;
                }
            }
        }

		/**
		 * 拷贝数据
		 * @param obj			需要赋值的对象
		 * @param value			拥有数据的对象
		 */
        public static copyValue(obj: Object, value: Object): void {
            for (var key in value) {
                var attrValue = value[key];
                var attrType: string = getQualifiedClassName(attrValue);
                var baseType: boolean = this.isBaseType(value[key]);
                if (baseType) {
                    obj[key] = value[key];
                }
                else {
                    this.copyValue(obj[key], value[key]);
                }
            }
        }

		/**
		 * 判断对象是否为基础类型
		 * @param obj			对象
		 * @return				true为基础类型，false为复杂类型
		 */
        public static isBaseType(obj: Object): boolean {
            var type: string = getQualifiedClassName(obj);
            var index: number = ClassUtils.BASETYPES.indexOf(type);
            return index != -1;
        }

		/**
		 * 获取对象默认名称
		 * @param obj				对象
		 * @return					对象默认名称
		 */
        public static getDefaultName(obj: Object): string {
            return getQualifiedClassName(obj).split("::").pop();
        }

		/**
		 * 判断两个对象的完全限定类名是否相同
		 * @param obj1			对象1
		 * @param obj2			对象2
		 * @return
		 */
        public static isSameClass(obj1: any, obj2: any): boolean {
            var className1: string = getQualifiedClassName(obj1);
            var className2: string = getQualifiedClassName(obj2);
            return className1 == className2;
        }
    }
}
