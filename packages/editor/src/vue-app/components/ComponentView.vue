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
import { Components, Behaviour, ScriptComponent, Transform, classUtils, objectview, watcher, globalEmitter } from 'feng3d';
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

// 是否是 Behaviour 组件
const isBehaviour = computed(() => {
    return props.component instanceof Behaviour;
});

// 是否是 Transform 组件
const isTransform = computed(() => {
    return props.component instanceof Transform;
});

// 是否启用
const enabled = computed(() => {
    if (props.component instanceof Behaviour) {
        return props.component.enabled;
    }
    return true;
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
    if (props.component instanceof Behaviour) {
        props.component.enabled = newValue;
    }
}

// 操作按钮点击
function onOperationClick() {
    const menus: any[] = [];
    
    if (!isTransform.value) {
        const { t } = useI18n();
        menus.push({
            label: t('contextMenu.removeComponent'),
            click: () => {
                if (props.component.gameObject) {
                    props.component.gameObject.removeComponent(props.component);
                }
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
    if (!(props.component instanceof ScriptComponent)) return;
    
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
    if (!scriptViewRef.value || !(props.component instanceof ScriptComponent)) return;
    
    // 清理旧视图
    if (scriptView?.destroy) {
        scriptView.destroy();
    }
    scriptViewRef.value.innerHTML = '';
    
    const scriptComponent = props.component as ScriptComponent;
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
    if (props.component instanceof ScriptComponent) {
        removeScriptView();
        initScriptView();
    }
}

// 监听组件刷新事件
function onRefreshView() {
    refreshView();
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
    
    // 监听组件刷新事件
    props.component.on('refreshView', onRefreshView);
    
    // 监听 enabled 属性变化（如果是 Behaviour）
    if (props.component instanceof Behaviour) {
        watcher.watch(props.component as any, 'enabled' as any, () => {
            // enabled 变化时自动更新（通过 computed 响应）
        });
    }
    
    // 监听脚本变化（如果是 ScriptComponent）
    if (props.component instanceof ScriptComponent) {
        watcher.watch(props.component as any, 'scriptName' as any, onScriptChanged);
        globalEmitter.on('asset.scriptChanged', onScriptChanged);
    }
});

onUnmounted(() => {
    props.component.off('refreshView', onRefreshView);
    
    if (props.component instanceof Behaviour) {
        watcher.unwatch(props.component as any, 'enabled' as any, () => {});
    }
    
    if (props.component instanceof ScriptComponent) {
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
