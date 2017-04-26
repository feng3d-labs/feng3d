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
         * 光源数量
         */
        public NUM_LIGHT: number;

        /** 
         * 点光源数量
         */
        public NUM_POINTLIGHT: number;

        /** 
         * 方向光源数量
         */
        public NUM_DIRECTIONALLIGHT: number;

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
        /**
         * 是否有漫反射贴图
         */
        public HAS_DIFFUSE_SAMPLER: boolean;
        /**
         * 是否有法线贴图
         */
        public HAS_NORMAL_SAMPLER: boolean;
        /**
         * 是否有镜面反射光泽图
         */
        public HAS_SPECULAR_SAMPLER: boolean;
        /**
         * 是否有环境贴图
         */
        public HAS_AMBIENT_SAMPLER: boolean;
        /**
         * 是否有骨骼动画
         */
        public HAS_SKELETON_ANIMATION: boolean;
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
        public V_NORMAL_NEED: number = 0;
        /**
         * 是否需要摄像机矩阵
         */
        public U_CAMERAMATRIX_NEED: number = 0;
    }
}