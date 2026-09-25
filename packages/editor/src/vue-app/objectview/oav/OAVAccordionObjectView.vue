<script setup lang="ts">
import { computed, reactive, onMounted, onUnmounted, ref, watch } from 'vue';
import { objectview, classUtils, watcher } from 'feng3d';
import { ObjectViewEvent } from '../../../objectview/events/ObjectViewEvent';

const props = defineProps<{
    name: string;
    owner: Record<string, unknown>;
    editable: boolean;
    attributeViewInfo?: any;
}>();

// 在组件内部创建响应式对象
const r_owner = reactive(props.owner);

// 获取属性值（组件对象）
const componentValue = computed(() => r_owner[props.name]);

/** 带 enabled 开关的组件数据（`Behaviour.enabled` 为只读字段，写入须经响应式代理） */
type EnabledComponent = { enabled?: boolean };

// 组件名称
const componentName = computed(() => {
    if (!componentValue.value) return '';
    return classUtils.getQualifiedClassName(componentValue.value).split('.').pop() || '';
});

// 是否启用
const enabled = computed(() => {
    return (componentValue.value as EnabledComponent | undefined)?.enabled ?? true;
});

// 对象视图
const objectViewRef = ref<HTMLElement | null>(null);
let objectView: any = null;

// 启用变化处理
function onEnabledChange(newValue: boolean) {
    const component = componentValue.value;
    if (!component || typeof component !== 'object') return;

    // 经响应式代理写入只读数据字段
    const r_component = reactive(component as EnabledComponent);
    r_component.enabled = newValue;

    // 触发值变化事件
    if (props.attributeViewInfo) {
        const event = new ObjectViewEvent();
        event.type = ObjectViewEvent.VALUE_CHANGE;
        (event as any).space = r_owner;
        (event as any).attributeName = 'enabled';
        (event as any).attributeValue = newValue;
    }
}

// 创建对象视图
function createObjectView() {
    const target = componentValue.value;
    if (!objectViewRef.value || !target || typeof target !== 'object') return;
    
    // 清理旧视图
    if (objectView?.destroy) {
        objectView.destroy();
    }
    objectViewRef.value.innerHTML = '';
    
    // 创建新视图
    objectView = objectview.getObjectView(target, {
        autocreate: false,
        excludeAttrs: ['enabled'],
    });
    
    if (objectView?.dom) {
        objectViewRef.value.appendChild(objectView.dom);
    }
}

// 监听组件值变化
watch(() => componentValue.value, () => {
    createObjectView();
}, { deep: true });

onMounted(() => {
    createObjectView();
    
    // 监听 enabled 属性变化
    if (componentValue.value) {
        watcher.watch(componentValue.value as any, 'enabled' as any, () => {
            // enabled 变化时自动更新
        });
    }
});

onUnmounted(() => {
    if (objectView?.destroy) {
        objectView.destroy();
    }
    objectView = null;
    
    if (componentValue.value) {
        watcher.unwatch(componentValue.value as any, 'enabled' as any, () => {});
    }
});
</script>

<template>
    <div class="oav-accordion-object-view">
        <div class="oav-accordion-header">
            <el-switch
                :model-value="enabled"
                :disabled="!props.editable"
                size="small"
                @update:model-value="onEnabledChange"
            />
            <span class="oav-accordion-title">{{ componentName }}</span>
        </div>
        <div class="oav-accordion-content">
            <div ref="objectViewRef" class="oav-accordion-object-view-content"></div>
        </div>
    </div>
</template>


<style scoped>
.oav-accordion-object-view {
    border: 1px solid var(--sideBar-border, #3d3d3d);
    border-radius: 2px;
    margin-bottom: 4px;
    background-color: var(--sideBar-background, #252526);
}

.oav-accordion-header {
    display: flex;
    align-items: center;
    padding: 6px 8px;
    gap: 8px;
    background-color: var(--list-inactiveSelectionBackground, #2d2d2d);
}

.oav-accordion-title {
    font-size: 12px;
    font-weight: 500;
    color: var(--sideBar-foreground, #cccccc);
}

.oav-accordion-content {
    padding: 4px 0;
}
</style>
