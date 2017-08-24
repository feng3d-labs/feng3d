declare namespace feng3d {
    /**
     * 对象工具
     * @author feng 2017-02-15
     */
    class ObjectUtils {
        /**
         * 深克隆
         * @param source        源数据
         * @returns             克隆数据
         */
        static deepClone<T>(source: T): T;
        /**
         * 获取实例
         * @param source 实例对象
         */
        static getInstance<T>(source: T): T;
        /**
         * （浅）克隆
         * @param source        源数据
         * @returns             克隆数据
         */
        static clone<T>(source: T): T;
        /**
         * （浅）拷贝数据
         */
        static copy(target: Object, source: Object): void;
        /**
         * 深拷贝数据
         */
        static deepCopy(target: Object, source: Object): void;
        /**
         * 合并数据
         * @param source        源数据
         * @param mergeData     合并数据
         * @param createNew     是否合并为新对象，默认为false
         * @returns             如果createNew为true时返回新对象，否则返回源数据
         */
        static merge<T>(source: T, mergeData: Object, createNew?: boolean): T;
    }
}
