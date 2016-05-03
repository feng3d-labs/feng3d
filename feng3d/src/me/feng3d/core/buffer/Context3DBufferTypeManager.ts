module me.feng3d {

    /**
	 * 3d环境缓存类型管理者
	 * @author feng 2014-9-3
	 */
    export class Context3DBufferTypeManager {

        NAME_REGEXP: string = "[a-zA-Z0-9$]";

        /** 缓存类型字典 */
        private bufferTypeDic = {};

        private typeClassDic = {};

        private config = [ //

        ];

		/**
		 * 获取或创建3d缓存类型
		 * @param typeId 		3d缓存类型编号
		 * @return				3d缓存类型实例
		 */
        public getBufferType(typeId: string): Context3DBufferType {
            var bufferType: Context3DBufferType = this.bufferTypeDic[typeId];

            if (bufferType)
                return bufferType;

            this.bufferTypeDic[typeId] = bufferType = new Context3DBufferType();

            var types = typeId.split("_");
            bufferType.registerType = types[1];
            bufferType.dataType = types[2];

            return bufferType;
        }

        /**
		 * 获取3d缓存类定义
		 * @param typeId 		3d缓存类型编号
		 * @return				3d缓存类定义
		 */
        public getBufferClass(typeId: string) {
            var cls = this.typeClassDic[typeId];
            if (cls == null) {
                for (var i: number = 0; i < this.config.length; i++) {
                    var result = typeId.match(this.config[i][0]);
                    if (result != null && result.input == result[0]) {
                        return this.config[i][1];
                    }
                }
            }
            throw ("无法为" + typeId + "匹配到3d缓存类");
        }
    }

    /**
     * 3d环境缓存类型管理者
     */
    export var context3DBufferTypeManager = new Context3DBufferTypeManager();
}