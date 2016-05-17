module me.feng3d{
    
    /**
     * 程序唯一属性(常量)
     * @author feng 2016-05-11
     */
    export class ProgramUniform {

        /**
         * 名称
         */
        name: string;
        
        /**
         * 类型
         */
        type: string;
        
        /**
         * gpu地址？
         */
        location: WebGLUniformLocation;
    }
}