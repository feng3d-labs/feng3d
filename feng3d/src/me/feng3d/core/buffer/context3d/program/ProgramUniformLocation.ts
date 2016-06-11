module me.feng3d {

    /**
     * 程序Uniform地址
     */
    export class ProgramUniformLocation {

        /**
         * 名称
         */
        name: string;

        /**
         * 类型
         */
        type: string;

        /**
         * gpu地址
         */
        location: WebGLUniformLocation;
    }
}