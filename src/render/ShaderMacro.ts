module feng3d
{

    /**
     * 着色器宏定义
     * @author feng 2016-12-17
     */
    export class ShaderMacro
    {

        /**
         * 值类型宏
         */
        public valueMacros = new ValueMacros();
        /**
         * Boolean类型宏
         */
        public boolMacros = new BoolMacros();
        /**
         * 递增类型宏
         */
        public addMacros = new IAddMacros();
    }

    /**
     * 值类型宏
     * 没有默认值
     */
    export class ValueMacros
    {

        /** 
         * 点光源数量
         */
        public NUM_POINTLIGHT: number;

        /**
         * 骨骼关节数量
         */
        public NUM_SKELETONJOINT: number;
    }

    /**
     * Boolean类型宏
     * 没有默认值
     */
    export class BoolMacros
    {

    }

    /**
     * 递增类型宏
     * 所有默认值为0
     */
    export class IAddMacros
    {
        /** 
         * 是否需要属性uv
         */
        public A_UV_NEED: number = 0;
        /** 
         * 是否需要变量uv
         */
        public V_UV_NEED: number = 0;
        /** 
         * 是否需要变量全局坐标
         */
        public V_GLOBAL_POSITION_NEED: number = 0;
        /**
         * 是否需要属性法线
         */
        public A_NORMAL_NEED: number = 0;
        /**
         * 是否需要变量法线
         */
        V_NORMAL_NEED: number = 0;
        /**
         * 是否需要摄像机矩阵
         */
        public U_CAMERAmATRIX_NEED: number = 0;
    }
}