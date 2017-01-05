module feng3d {

    /**
     * 着色器宏定义
     * @author feng 2016-12-17
     */
    export class ShaderMacro {

        /**
         * 值类型宏
         */
        valueMacros = new ValueMacros();
        /**
         * Boolean类型宏
         */
        boolMacros = new BoolMacros();
        /**
         * 递增类型宏
         */
        addMacros = new IAddMacros();
    }

    /**
     * 值类型宏
     * 没有默认值
     */
    export class ValueMacros {

        DIFFUSE_INPUT_TYPE: 0 | 1 | 2;
        /** 
         * 点光源数量
         */
        NUM_POINTLIGHT: number;
    }

    /**
     * Boolean类型宏
     * 没有默认值
     */
    export class BoolMacros {

    }

    /**
     * 递增类型宏
     * 所有默认值为0
     */
    export class IAddMacros {
        /** 
         * 是否需要属性uv
         */
        A_UV_NEED: number = 0;
        /** 
         * 是否需要变量uv
         */
        V_UV_NEED: number = 0;
        /** 
         * 是否需要变量全局坐标
         */
        V_GLOBAL_POSITION_NEED: number = 0;
        /**
         * 是否需要属性法线
         */
        A_NORMAL_NEED: number = 0;
        /**
         * 是否需要变量法线
         */
        V_NORMAL_NEED: number = 0;
    }
}