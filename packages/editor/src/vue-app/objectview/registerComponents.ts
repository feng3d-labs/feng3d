import { objectview } from 'feng3d';
import type { AttributeViewInfo } from 'feng3d';
import { createOAVComponent } from './utils/createOAVComponent';
import { createOBVComponent } from './utils/createOBVComponent';
import { createOVComponent } from './utils/createOVComponent';

// 导入 OV 组件
import OVDefaultVue from './ov/OVDefault.vue';
import OVBaseDefaultVue from './ov/OVBaseDefault.vue';
import OVFolderAssetVue from './ov/OVFolderAsset.vue';

// 导入 OBV 组件
import OBVDefaultVue from './obv/OBVDefault.vue';

// 导入 OAV 组件
import OAVDefaultVue from './oav/OAVDefault.vue';
import OAVBooleanVue from './oav/OAVBoolean.vue';
import OAVNumberVue from './oav/OAVNumber.vue';
import OAVStringVue from './oav/OAVString.vue';
import OAVEnumVue from './oav/OAVEnum.vue';
import OAVVector2Vue from './oav/OAVVector2.vue';
import OAVVector3Vue from './oav/OAVVector3.vue';
import OAVVector4Vue from './oav/OAVVector4.vue';
import OAVMultiTextVue from './oav/OAVMultiText.vue';
import OAVObjectViewVue from './oav/OAVObjectView.vue';
import OAVArrayVue from './oav/OAVArray.vue';
import OAVImageVue from './oav/OAVImage.vue';
import OAVTexture2DVue from './oav/OAVTexture2D.vue';
import OAVColorPickerVue from './oav/OAVColorPicker.vue';
// 文件名是 OAVGameObjectName.vue，但注册键沿用 oav 系统的 'OAVObject3DName'
import OAVObject3DNameVue from './oav/OAVGameObjectName.vue';
import OAVFunctionVue from './oav/OAVFunction.vue';
import OAVPickVue from './oav/OAVPick.vue';
import OAVMaterialNameVue from './oav/OAVMaterialName.vue';
import OAVAccordionObjectViewVue from './oav/OAVAccordionObjectView.vue';
import OAVCubeMapVue from './oav/OAVCubeMap.vue';
import OAVComponentListVue from './oav/OAVComponentList.vue';
import OAVParticleComponentListVue from './oav/OAVParticleComponentList.vue';
import OAVMinMaxCurveVue from './oav/OAVMinMaxCurve.vue';
import OAVMinMaxGradientVue from './oav/OAVMinMaxGradient.vue';
import OAVMinMaxCurveVector3Vue from './oav/OAVMinMaxCurveVector3.vue';
import OAVFeng3dPreViewVue from './oav/OAVFeng3dPreView.vue';

/**
 * 数字类属性视图的组件参数。
 *
 * 主仓 `AttributeViewInfo.componentParam` 只声明为 `unknown`（扩展点，见
 * `packages/objectview/src/ObjectView.ts:823`），具体形状由各属性视图自行约定；
 * 这里显式声明编辑器侧的数字/枚举参数形状，避免直接访问 `unknown` 成员。
 */
interface OAVNumberComponentParam
{
    /** 单步增量 */
    step?: number;
    /** 上下键增量 */
    stepDownup?: number;
    /** 最小值 */
    minValue?: number;
    /** 最大值 */
    maxValue?: number;
}

/**
 * 枚举属性视图的组件参数（`enumClass` 为枚举构造/枚举对象，`options` 为候选标签列表）
 */
interface OAVEnumComponentParam
{
    enumClass?: object;
    options?: unknown;
}

/**
 * 把 `AttributeViewInfo.componentParam`（主仓声明为 `unknown`）窄化为属性视图约定的参数形状。
 *
 * 参数对象由编辑器侧 `@oav({ componentParam })` 提供，形状由调用点决定，
 * 因此这里是必要的边界声明而非类型放宽。
 *
 * @param info 属性视图信息
 */
function getComponentParam<T>(info: AttributeViewInfo): T | undefined
{
    return info.componentParam as T | undefined;
}

/**
 * 注册所有 Vue 版本的 objectview 组件
 */
export function registerObjectViewComponents()
{
    // ============ 对象视图组件 ============

    /** 默认对象视图 - 渲染整个对象的所有属性块 */
    createOVComponent('OVDefault', OVDefaultVue);

    /** 基础默认对象视图 - 显示简单文本或图片 */
    createOVComponent('OVBaseDefault', OVBaseDefaultVue, (info) => ({
        owner: info.owner,
        objectViewInfo: info,
    }));

    /** 文件夹资源对象视图 */
    createOVComponent('OVFolderAsset', OVFolderAssetVue, (info) => ({
        owner: info.owner,
        objectViewInfo: info,
    }));

    // ============ 块视图组件 ============

    /** 默认块视图 - 渲染一组属性（可折叠） */
    createOBVComponent('OBVDefault', OBVDefaultVue);

    // ============ 属性视图组件 ============

    /** 默认属性视图 - 文本输入 */
    createOAVComponent('OAVDefault', OAVDefaultVue);

    /** 布尔值属性视图 - 开关 */
    createOAVComponent('OAVBoolean', OAVBooleanVue);

    /** 数字属性视图 - 数字输入 */
    createOAVComponent('OAVNumber', OAVNumberVue, (info) => {
        const param = getComponentParam<OAVNumberComponentParam>(info);

        return {
            name: info.name,
            owner: info.owner,
            editable: info.editable,
            attributeViewInfo: info,
            step: param?.step || 0.001,
            stepDownup: param?.stepDownup || 0.001,
            minValue: param?.minValue,
            maxValue: param?.maxValue,
        };
    });

    /** 字符串属性视图 - 文本输入 */
    createOAVComponent('OAVString', OAVStringVue);

    /** 枚举属性视图 - 下拉选择 */
    createOAVComponent('OAVEnum', OAVEnumVue, (info) => {
        const param = getComponentParam<OAVEnumComponentParam>(info);

        return {
            name: info.name,
            owner: info.owner,
            editable: info.editable,
            attributeViewInfo: info,
            enumClass: param?.enumClass,
            options: param?.options,
        };
    });

    /** Vector2 属性视图 - 二维向量输入 */
    createOAVComponent('OAVVector2', OAVVector2Vue, (info) => {
        const param = getComponentParam<OAVNumberComponentParam>(info);

        return {
            name: info.name,
            owner: info.owner,
            editable: info.editable,
            attributeViewInfo: info,
            step: param?.step || 0.001,
            stepDownup: param?.stepDownup || 10,
            minValue: param?.minValue,
            maxValue: param?.maxValue,
        };
    });

    /** Vector3 属性视图 - 三维向量输入 */
    createOAVComponent('OAVVector3', OAVVector3Vue, (info) => {
        const param = getComponentParam<OAVNumberComponentParam>(info);

        return {
            name: info.name,
            owner: info.owner,
            editable: info.editable,
            attributeViewInfo: info,
            step: param?.step || 0.001,
            stepDownup: param?.stepDownup || 0.001,
            minValue: param?.minValue,
            maxValue: param?.maxValue,
        };
    });

    /** Vector4 属性视图 - 四维向量输入 */
    createOAVComponent('OAVVector4', OAVVector4Vue, (info) => {
        const param = getComponentParam<OAVNumberComponentParam>(info);

        return {
            name: info.name,
            owner: info.owner,
            editable: info.editable,
            attributeViewInfo: info,
            step: param?.step || 0.001,
            stepDownup: param?.stepDownup || 0.001,
            minValue: param?.minValue,
            maxValue: param?.maxValue,
        };
    });

    /** 多行文本属性视图 - 只读多行文本 */
    createOAVComponent('OAVMultiText', OAVMultiTextVue);

    /** 对象视图属性视图 - 嵌套对象视图 */
    createOAVComponent('OAVObjectView', OAVObjectViewVue);

    /** 数组属性视图 - 数组编辑器 */
    createOAVComponent('OAVArray', OAVArrayVue);

    /** 图片属性视图 - 图片显示 */
    createOAVComponent('OAVImage', OAVImageVue);

    /** 纹理2D属性视图 - 纹理选择器 */
    createOAVComponent('OAVTexture2D', OAVTexture2DVue);

    /** 颜色选择器属性视图 - 颜色选择器 */
    createOAVComponent('OAVColorPicker', OAVColorPickerVue);

    /** 游戏对象名称属性视图 - 游戏对象名称和可见性控制 */
    createOAVComponent('OAVObject3DName', OAVObject3DNameVue);

    /** 函数属性视图 - 函数执行按钮 */
    createOAVComponent('OAVFunction', OAVFunctionVue);

    /** 对象拾取属性视图 - 对象拾取器 */
    createOAVComponent('OAVPick', OAVPickVue);

    /** 材质名称属性视图 - 材质 Shader 选择器 */
    createOAVComponent('OAVMaterialName', OAVMaterialNameVue);

    /** 手风琴对象视图属性视图 - 可折叠的组件视图 */
    createOAVComponent('OAVAccordionObjectView', OAVAccordionObjectViewVue);

    /** 立方体贴图属性视图 - 立方体贴图编辑器 */
    createOAVComponent('OAVCubeMap', OAVCubeMapVue);

    /** 组件列表属性视图 - Object3D 组件列表 */
    createOAVComponent('OAVComponentList', OAVComponentListVue);

    /** 粒子组件列表属性视图 - ParticleSystem 组件列表 */
    createOAVComponent('OAVParticleComponentList', OAVParticleComponentListVue);

    /** 最小最大曲线属性视图 - 曲线编辑器 */
    createOAVComponent('OAVMinMaxCurve', OAVMinMaxCurveVue);

    /** 最小最大渐变属性视图 - 渐变编辑器 */
    createOAVComponent('OAVMinMaxGradient', OAVMinMaxGradientVue);

    /** 最小最大曲线向量3属性视图 - 三维曲线编辑器 */
    createOAVComponent('OAVMinMaxCurveVector3', OAVMinMaxCurveVector3Vue);

    /** Feng3d 预览属性视图 - 3D对象预览 */
    createOAVComponent('OAVFeng3dPreView', OAVFeng3dPreViewVue);

    // ============ 配置默认视图组件 ============

    // 注意：这些配置可能会覆盖现有的配置，需要谨慎处理
    // 如果已有配置，可以选择不设置或合并配置
    if (!objectview.defaultBaseObjectViewClass) {
        objectview.defaultBaseObjectViewClass = 'OVDefault';
    }
    if (!objectview.defaultObjectViewClass) {
        objectview.defaultObjectViewClass = 'OVDefault';
    }
    if (!objectview.defaultObjectAttributeViewClass) {
        objectview.defaultObjectAttributeViewClass = 'OAVDefault';
    }
    if (!objectview.defaultObjectAttributeBlockView) {
        objectview.defaultObjectAttributeBlockView = 'OBVDefault';
    }

    // 配置默认类型属性视图（如果尚未配置）
    if (!objectview.defaultTypeAttributeView['Boolean']) {
        objectview.setDefaultTypeAttributeView('Boolean', { component: 'OAVBoolean' });
    }
    if (!objectview.defaultTypeAttributeView['number']) {
        objectview.setDefaultTypeAttributeView('number', { component: 'OAVNumber' });
    }
    if (!objectview.defaultTypeAttributeView['String']) {
        objectview.setDefaultTypeAttributeView('String', { component: 'OAVString' });
    }
}
