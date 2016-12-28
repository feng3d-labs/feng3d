module feng3d {

    /**
     * 着色器宏定义
     * @author feng 2016-12-17
     */
    export class ShaderMacro {

        DIFFUSE_INPUT_TYPE: 0 | 1 | 2 = 0;
        /** 是否需要属性uv */
        NEED_UV: number = 0;
        /** 是否需要变量uv */
        NEED_UV_V: number = 0;
    }
}