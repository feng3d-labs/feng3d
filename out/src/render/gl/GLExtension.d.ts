declare namespace feng3d {
    /**
     * GL扩展
     */
    class GLExtension {
        constructor(gl: GL);
        /**
         * 扩展GL
         * @param gl GL实例
         */
        private extensionWebGL(gl);
        /**
         * 缓存GL查询
         * @param gl GL实例
         */
        private cacheGLQuery(gl);
    }
}
