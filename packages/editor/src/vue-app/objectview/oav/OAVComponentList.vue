<template>
    <div class="oav-component-list">
        <div class="oav-row">
            <label class="oav-label" :title="props.name">{{ label }}</label>
        </div>
        <div class="oav-component-list-content">
            <ComponentView
                v-for="component in visibleComponents"
                :key="getComponentKey(component)"
                :component="component"
                ref="componentViewRefs"
            />
        </div>
        <div v-if="props.editable" class="oav-component-list-actions">
            <el-button
                size="small"
                @click="onAddComponentClick"
            >
                <el-icon><Plus /></el-icon>
                添加组件
            </el-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, reactive, onMounted, onUnmounted, ref, watch, nextTick } from 'vue';
import { Component, Components, GameObject, HideFlags, IEvent } from 'feng3d';
import { menuConfig } from '../../../configs/CommonConfig';
import ComponentView from '../../components/ComponentView.vue';
import { MenuAdapter } from '../../components/MenuAdapter';
import { Plus } from '@element-plus/icons-vue';

const props = defineProps<{
    name: string;
    owner: Record<string, unknown>;
    editable: boolean;
    attributeViewInfo?: any;
}>();

// 在组件内部创建响应式对象
const r_owner = reactive(props.owner);

// 获取 GameObject
const gameObject = computed(() => r_owner as unknown as GameObject);

// 格式化标签名
const label = computed(() => {
    const name = props.attributeViewInfo?.label || props.name;
    return name
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
});

// 获取组件列表
const components = computed(() => {
    const value = r_owner[props.name];
    return (value as Component[]) || [];
});

// 可见的组件（过滤掉 HideInInspector 的组件）
const visibleComponents = computed(() => {
    return components.value.filter(comp => {
        return !(comp.hideFlags & HideFlags.HideInInspector);
    });
});

// 组件视图引用
const componentViewRefs = ref<InstanceType<typeof ComponentView>[]>([]);

// 获取组件唯一键
function getComponentKey(component: Components) {
    // 使用组件的唯一标识符
    return (component as any).__id || component.constructor.name + '_' + Math.random();
}

// 添加组件按钮点击
function onAddComponentClick() {
    if (!gameObject.value) return;
    
    const menus = menuConfig.getCreateComponentMenu(gameObject.value);
    const menuAdapter = new MenuAdapter();
    menuAdapter.popup(menus);
}

// 添加组件视图
function addComponentView(component: Components) {
    // 组件视图会通过 v-for 自动创建
    // 这里只需要确保响应式更新
}

// 移除组件视图
function removeComponentView(component: Components) {
    // 组件视图会通过 v-for 自动移除
    // 这里只需要确保响应式更新
}

// 更新所有组件视图
function updateAllComponentViews() {
    componentViewRefs.value.forEach(view => {
        if (view && typeof view.updateView === 'function') {
            view.updateView();
        }
    });
}

// 组件添加事件处理
function onAddComponent(event: IEvent<{ gameobject: GameObject; component: Component }>) {
    if (event.data.component.gameObject === gameObject.value) {
        addComponentView(event.data.component);
    }
}

// 组件移除事件处理
function onRemoveComponent(event: IEvent<{ gameobject: GameObject; component: Component }>) {
    if (event.data.component.gameObject === gameObject.value) {
        removeComponentView(event.data.component);
    }
}

// 监听组件列表变化
watch(() => components.value, () => {
    // 组件列表变化时，视图会自动更新（通过 v-for）
    nextTick(() => {
        updateAllComponentViews();
    });
}, { deep: true });

onMounted(() => {
    // 监听组件添加和移除事件
    if (gameObject.value) {
        gameObject.value.on('addComponent', onAddComponent);
        gameObject.value.on('removeComponent', onRemoveComponent);
    }
});

onUnmounted(() => {
    // 移除事件监听
    if (gameObject.value) {
        gameObject.value.off('addComponent', onAddComponent);
        gameObject.value.off('removeComponent', onRemoveComponent);
    }
});
</script>

<script lang="ts">
export default {
    name: 'OAVComponentList',
};
</script>

<style scoped>
.oav-component-list {
    padding: 4px 0;
}

.oav-row {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    min-height: 24px;
}

.oav-label {
    flex: 0 0 120px;
    font-size: 12px;
    color: var(--editor-foreground, #cccccc);
    user-select: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.oav-component-list-content {
    padding: 4px 0;
}

.oav-component-list-actions {
    padding: 8px;
    border-top: 1px solid var(--sideBar-border, #3d3d3d);
}
</style>
