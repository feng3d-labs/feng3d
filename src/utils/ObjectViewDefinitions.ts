namespace feng3d
{
    export interface OAVComponentParamMap
    {
        OAVDefault: OAVDefaultParam;
        OAVArray: OAVArrayParam;
        OAVPick: OAVPickParam;
        OAVEnum: OAVEnumParam;

        OAVCubeMap: { component: "OAVCubeMap", componentParam: Object };
        OAVImage: { component: "OAVImage", componentParam: Object };
        OAVObjectView: { component: "OAVObjectView", componentParam: Object };
        OAVParticleComponentList: { component: "OAVParticleComponentList", componentParam: Object };
        OAVComponentList: { component: "OAVComponentList", componentParam: Object };
        OAVEntityName: { component: "OAVEntityName", componentParam: Object };
        OAVMaterialName: { component: "OAVMaterialName", componentParam: Object };
        OAVMultiText: { component: "OAVMultiText", componentParam: Object };
        OAVFeng3dPreView: { component: "OAVFeng3dPreView", componentParam: Object };
        OAVAccordionObjectView: { component: "OAVAccordionObjectView", componentParam: Object };
        OAVVector3: OAVVector3Param;
    }

	/**
	 * OAVVector3 组件参数
	 */
    export interface OAVVector3Param
    {
        component: "OAVVector3", componentParam: {
            label?: string,

            /**
             * 步长，精度
             */
            step?: number;

            /**
             * 按下上下方向键时增加的步长数量
             */
            stepDownup?: number;

            /**
             * 移动一个像素时增加的步长数量
             */
            stepScale?: number;

            /**
             * 最小值
             */
            minValue?: number;

            /**
             * 最小值
             */
            maxValue?: number;

            editable?: boolean
        }
    }

	/**
	 * OAVDefault 组件参数
	 */
    export interface OAVDefaultParam
    {
        component: "OAVDefault";

        componentParam: {
            /**
             * 拾取参数
             */
            dragparam?: {
                /**
                 * 可接受数据类型
                 */
                accepttype: string,
                /**
                 * 提供数据类型
                 */
                datatype?: string,
            }
        }
    }

	/**
	 * OAVArray 组件参数
	 */
    export interface OAVArrayParam 
    {
        component: "OAVArray";

        componentParam: {
            /**
             * 拾取参数
             */
            dragparam?: {
                /**
                 * 可接受数据类型
                 */
                accepttype: string,
                /**
                 * 提供数据类型
                 */
                datatype?: string,
            },
            /**
             * 添加item时默认数据，赋值 ()=>any
             */
            defaultItem: any
        }
    }

	/**
	 * OAVPick 组件参数
	 */
    export interface OAVPickParam 
    {
        component: "OAVPick";

        componentParam: {
            /**
             * 可接受数据类型
             */
            accepttype: string,
            /**
             * 提供数据类型
             */
            datatype?: string,
        }
    }

	/**
	 * OAVEnum 组件参数
	 */
    export interface OAVEnumParam 
    {
        component: "OAVEnum";

        componentParam: {
            /**
             * 枚举类型
             */
            enumClass: any,
        }
    }
}