<template>
    <div class="component-view">
        <Accordion
            :title-name="componentName"
            :default-collapsed="false"
            ref="accordionRef"
        >
            <div class="component-view-header">
                <el-switch
                    v-if="isBehaviour"
                    :model-value="enabled"
                    size="small"
                    @update:model-value="onEnabledChange"
                />
                <!-- 组件图标（暂时不显示，需要资源加载） -->
                <!-- <Icon
                    v-if="componentIcon"
                    :icon="componentIcon"
                    :size="16"
                    style="margin-left: 8px"
                /> -->
                <div class="component-view-actions">
                    <el-button
                        text
                        size="small"
                        @click="onHelpClick"
                    >
                        <el-icon><QuestionFilled /></el-icon>
                    </el-button>
                    <el-button
                        v-if="!isTransform"
                        text
                        size="small"
                        @click="onOperationClick"
                    >
                        <el-icon><MoreFilled /></el-icon>
                    </el-button>
                </div>
            </div>
            <div ref="componentViewRef" class="component-view-content"></div>
            <div v-if="scriptViewRef" ref="scriptViewRef" class="component-view-script-content"></div>
        </Accordion>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { classUtils, objectview, watcher, globalEmitter, logic, reactive, effect, toRaw } from 'feng3d';
import type { Effect, Components, Behaviour, Object3D } from 'feng3d';
import { QuestionFilled, MoreFilled } from '@element-plus/icons-vue';
import Accordion from './Accordion.vue';
import Icon from './Icon.vue';
import { MenuAdapter } from './MenuAdapter';
import { useI18n } from '../composables/useI18n';

// 组件图标映射
const componentIconMap = new Map<any, string>();
// 这些图标需要从资源中加载，暂时使用占位符
// componentIconMap.set(Transform, 'Transform_png');
// componentIconMap.set(Camera, 'Camera_png');
// ... 其他组件图标

const props = defineProps<{
    component: Components;
}>();

const accordionRef = ref<InstanceType<typeof Accordion> | null>(null);
const componentViewRef = ref<HTMLElement | null>(null);
const scriptViewRef = ref<HTMLElement | null>(null);

// 组件名称
const componentName = computed(() => {
    return classUtils.getQualifiedClassName(props.component).split('.').pop() || '';
});

/**
 * 取组件的「可开关」能力视图。
 *
 * `Behaviour` 现为纯数据 interface（运行时不存在，`instanceof Behaviour` 会抛 TypeError），
 * 因此按纯数据字段做**能力探测**：带 `enabled` 字段的组件即 Behaviour 派生组件
 * （`Behaviour.enabled?: boolean`，见 packages/feng3d/src/component/Behaviour.ts）。
 * 待主仓提供官方判别工具后替换。
 *
 * @param component 待判别的组件
 * @returns 带 `enabled` 字段的组件视图，或 null（非 Behaviour 组件）
 */
function asBehaviour(component: Components): Behaviour | null
{
    return 'enabled' in component ? (component as Behaviour) : null;
}

// 是否是 Behaviour 组件
const isBehaviour = computed(() => asBehaviour(props.component) !== null);

// 是否是 Transform 组件
// TODO(P1 API 迁移)：`Transform` 组件已从主仓移除（变换信息直接挂在 Object3D 的 logic 上），
// 且纯 interface 不能用 `instanceof`，该判别恒为 false，待组件面板迁移后移除。
const isTransform = computed(() => {
    // return props.component instanceof Transform;
    return false;
});

// 是否是脚本组件
// TODO(P1 API 迁移)：`ScriptComponent` 已从主仓移除（脚本组件由 `Script` 纯数据类型承载），
// 新判别方式待定，迁移完成前恒为 false（脚本属性视图暂不显示）。
function isScriptComponent(_component: Components): boolean {
    return false;
}

// 是否启用
const enabled = computed(() => {
    return asBehaviour(props.component)?.enabled ?? true;
});

// 组件图标
const componentIcon = computed(() => {
    const icon = componentIconMap.get(props.component.constructor);
    return icon || null;
});

// 对象视图
let componentView: any = null;
let scriptView: any = null;

// 启用状态变化
function onEnabledChange(newValue: boolean) {
    const behaviour = asBehaviour(props.component);
    if (!behaviour) return;

    // 纯数据字段类型上一律 readonly（根规范 §8.5），写入必须经响应式代理（§11.3）
    reactive(behaviour).enabled = newValue;
}

/**
 * 从宿主对象上移除组件。
 *
 * 旧的 `component.object3D.removeComponent(component)` 已不存在：`Component3D` 没有
 * `object3D` 字段（宿主对象经 `logic(component).entity` 取），`Object3D` 也没有命令式的
 * `removeComponent`。新范式中「移除组件」等价于把该项从宿主实体的 `components` 里剔除，
 * 由主仓 `EntityLogic` 的 effect 完成解绑——与 shortcut/Editorshortcut.ts 的
 * `removeObject3D` 同型（从数组剔除 + 经响应式代理写回）。
 *
 * @param component 要移除的组件
 */
function removeComponent(component: Components): void
{
    const entity = logic(component)?.entity as Object3D | null;
    if (!entity) return;

    const components = entity.components;
    if (!components || components.length === 0) return;

    const raw = toRaw(component);
    const rest = components.filter((item) => toRaw(item) !== raw);
    if (rest.length === components.length) return;

    reactive(entity).components = rest;
}

// 操作按钮点击
function onOperationClick() {
    const menus: any[] = [];
    
    if (!isTransform.value) {
        const { t } = useI18n();
        menus.push({
            label: t('contextMenu.removeComponent'),
            click: () => {
                removeComponent(props.component);
            },
        });
    }
    
    if (menus.length > 0) {
        const menuAdapter = new MenuAdapter();
        menuAdapter.popup(menus);
    }
}

// 帮助按钮点击
function onHelpClick() {
    window.open('http://gitee.io/#/script');
}

// 创建组件视图
function createComponentView() {
    if (!componentViewRef.value) return;
    
    // 清理旧视图
    if (componentView?.destroy) {
        componentView.destroy();
    }
    componentViewRef.value.innerHTML = '';
    
    // 创建新视图
    componentView = objectview.getObjectView(props.component, {
        autocreate: false,
        excludeAttrs: ['enabled'],
    });
    
    if (componentView?.dom) {
        componentViewRef.value.appendChild(componentView.dom);
    }
}

// 初始化脚本视图
function initScriptView() {
    if (!(isScriptComponent(props.component))) return;
    
    if (!scriptViewRef.value) {
        // 等待下一个 tick 确保 ref 已挂载
        nextTick(() => {
            if (scriptViewRef.value) {
                createScriptView();
            }
        });
        return;
    }
    
    createScriptView();
}

// 创建脚本视图
function createScriptView() {
    if (!scriptViewRef.value || !(isScriptComponent(props.component))) return;
    
    // 清理旧视图
    if (scriptView?.destroy) {
        scriptView.destroy();
    }
    scriptViewRef.value.innerHTML = '';
    
    // `objectview.getObjectView(object: object)` 只接受对象：脚本实例在迁移期尚无确切类型，
    // 从 `unknown` 收敛为 `object`（旧写法收窄成 unknown，无法传给 getObjectView）。
    const scriptComponent = props.component as unknown as { scriptInstance?: object };
    if (scriptComponent.scriptInstance) {
        scriptView = objectview.getObjectView(scriptComponent.scriptInstance, {
            autocreate: false,
        });
        
        if (scriptView?.dom) {
            scriptViewRef.value.appendChild(scriptView.dom);
        }
    }
}

// 移除脚本视图
function removeScriptView() {
    if (scriptView?.destroy) {
        scriptView.destroy();
    }
    scriptView = null;
    
    if (scriptViewRef.value) {
        scriptViewRef.value.innerHTML = '';
    }
}

// 刷新视图
function refreshView() {
    createComponentView();
    if (isScriptComponent(props.component)) {
        removeScriptView();
        initScriptView();
    }
}

// 监听组件刷新事件
function onRefreshView() {
    refreshView();
}

/** 组件就绪监听句柄（替代已废除的组件实例事件，需在 onUnmounted 中停止） */
let componentLoadedEffect: Effect | null = null;

/**
 * 监听组件「未就绪 → 就绪」跃迁并刷新视图。
 *
 * 旧写法 `props.component.on('refreshView', onRefreshView)` 依赖**组件实例事件**——
 * 主仓已整体废除（`Entity` / `Container` 改用响应式 effect 驱动结构同步，
 * 见 packages/editor/docs/API_MIGRATION.md §3.4），组件上不再有 `on/off`。
 * 这里改为 `effect()` 读组件 logic 的 `isLoaded`，与 `ui/assets/AssetNode.ts` 的
 * `#whenLoaded()` 同型：以「未就绪 → 就绪」跃迁作为刷新时机（异步资源就绪后补建视图）。
 *
 * 初始状态不触发刷新（视图已在 onMounted 中创建），避免重复构建。
 */
function watchComponentLoaded()
{
    const componentLogic = logic(props.component) as { readonly isLoaded?: boolean } | null;
    if (!componentLogic || typeof componentLogic.isLoaded !== 'boolean') return;

    let wasLoaded = componentLogic.isLoaded;
    componentLoadedEffect = effect(() =>
    {
        const isLoaded = componentLogic.isLoaded; // 经 getter 建立响应式依赖
        const justLoaded = isLoaded && !wasLoaded;
        wasLoaded = isLoaded;
        if (!justLoaded) return;

        // 视图重建是 DOM 副作用，不放在 effect 同步体内执行
        queueMicrotask(() => { onRefreshView(); });
    });
}

// 监听脚本变化
function onScriptChanged() {
    setTimeout(() => {
        removeScriptView();
        initScriptView();
    }, 10);
}

onMounted(() => {
    createComponentView();
    initScriptView();
    
    // 监听组件加载就绪（替代已废除的组件实例事件 'refreshView'，见 watchComponentLoaded）
    watchComponentLoaded();
    
    // 监听 enabled 属性变化（如果是 Behaviour）
    if (isBehaviour.value) {
        watcher.watch(props.component as any, 'enabled' as any, () => {
            // enabled 变化时自动更新（通过 computed 响应）
        });
    }
    
    // 监听脚本变化（如果是 ScriptComponent）
    if (isScriptComponent(props.component)) {
        watcher.watch(props.component as any, 'scriptName' as any, onScriptChanged);
        globalEmitter.on('asset.scriptChanged', onScriptChanged);
    }
});

onUnmounted(() => {
    componentLoadedEffect?.stop();
    componentLoadedEffect = null;
    
    if (isBehaviour.value) {
        watcher.unwatch(props.component as any, 'enabled' as any, () => {});
    }
    
    if (isScriptComponent(props.component)) {
        watcher.unwatch(props.component as any, 'scriptName' as any, onScriptChanged);
        globalEmitter.off('asset.scriptChanged', onScriptChanged);
    }
    
    if (componentView?.destroy) {
        componentView.destroy();
    }
    componentView = null;
    
    removeScriptView();
});

// 暴露方法
defineExpose({
    updateView: refreshView,
    component: props.component,
});
</script>

<style scoped>
.component-view {
    width: 100%;
    margin-bottom: 4px;
}

.component-view-header {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    gap: 8px;
}

.component-view-actions {
    margin-left: auto;
    display: flex;
    gap: 4px;
}

.component-view-content {
    padding: 4px 0;
}

.component-view-script-content {
    padding: 4px 0;
    border-top: 1px solid var(--sideBar-border, #3d3d3d);
    margin-top: 4px;
}
</style>
