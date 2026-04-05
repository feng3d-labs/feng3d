import { objectview } from 'feng3d';
import { onMounted, onUnmounted, ref } from 'vue';
import { createOAVComponent } from './utils/createOAVComponent';
import { createOBVComponent } from './utils/createOBVComponent';
import { createOVComponent } from './utils/createOVComponent';

// 导入对象视图的 Vue 组件
import OVDefaultVue from './ov/OVDefault.vue';

// 导入块视图的 Vue 组件
import OBVDefaultVue from './obv/OBVDefault.vue';

// 导入属性视图的 Vue 组件
import OAVBooleanVue from './oav/OAVBoolean.vue';
import OAVComponentsVue from './oav/OAVComponents.vue';
import OAVDefaultVue from './oav/OAVDefault.vue';
import OAVEnumVue from './oav/OAVEnum.vue';
import OAVNumberVue from './oav/OAVNumber.vue';
import OAVVector3Vue from './oav/OAVVector3.vue';

// ============ 对象视图组件 ============

/** 默认对象视图 - 渲染整个对象的所有属性块 */
createOVComponent('OVDefault', OVDefaultVue);

// ============ 块视图组件 ============

/** 默认块视图 - 渲染一组属性（可折叠） */
createOBVComponent('OBVDefault', OBVDefaultVue);

// ============ 属性视图组件 ============

/** 默认属性视图 - 文本输入 */
createOAVComponent('OAVDefault', OAVDefaultVue);

/** 布尔值属性视图 - 复选框 */
createOAVComponent('OAVBoolean', OAVBooleanVue);

/** 数字属性视图 - 数字输入 */
createOAVComponent('OAVNumber', OAVNumberVue);

/** 枚举/下拉选择属性视图 */
createOAVComponent('OAVEnum', OAVEnumVue, (info) => ({
    name: info.name,
    owner: info.owner,
    editable: info.editable,
    options: info.componentParam?.options || [],
}));

/** Vector3 属性视图 - XYZ 输入 */
createOAVComponent('OAVVector3', OAVVector3Vue);

/** 组件数组属性视图 - 显示多个组件 */
createOAVComponent('OAVComponents', OAVComponentsVue);

// ============ 配置默认视图组件 ============

objectview.defaultBaseObjectViewClass = 'OVDefault';
objectview.defaultObjectViewClass = 'OVDefault';
objectview.defaultObjectAttributeViewClass = 'OAVDefault';
objectview.defaultObjectAttributeBlockView = 'OBVDefault';

// 配置默认类型属性视图
objectview.setDefaultTypeAttributeView('Boolean', { component: 'OAVBoolean' });
objectview.setDefaultTypeAttributeView('number', { component: 'OAVNumber' });

// ============ ObjectView 组合式函数 ============

/**
 * ObjectView 组件的 Props 类型
 */
export interface ObjectViewProps
{
    /** 要显示的对象 */
    object: object;
}

/**
 * ObjectView 组合式函数
 *
 * 使用 objectview 库获取对象视图并挂载到 DOM
 */
export function useObjectView(props: ObjectViewProps)
{
    const containerRef = ref<HTMLElement | null>(null);
    let view: { dom?: HTMLElement; destroy?: () => void } | null = null;

    onMounted(() =>
    {
        if (!containerRef.value || !props.object) return;

        // 使用 objectview.getObjectView 获取视图
        view = objectview.getObjectView(props.object) as { dom?: HTMLElement; destroy?: () => void };

        // 将视图的 DOM 添加到容器
        if (view.dom)
        {
            containerRef.value.appendChild(view.dom);
        }
    });

    onUnmounted(() =>
    {
        // 清理视图
        if (view?.destroy)
        {
            view.destroy();
        }
        view = null;
    });

    return {
        containerRef,
    };
}
