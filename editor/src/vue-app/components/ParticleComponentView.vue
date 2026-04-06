<template>
    <div class="particle-component-view">
        <Accordion
            :title-name="componentName"
            :default-collapsed="false"
            ref="accordionRef"
        >
            <div ref="componentViewRef" class="particle-component-view-content"></div>
        </Accordion>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ParticleModule, classUtils, objectview } from 'feng3d';
import Accordion from './Accordion.vue';

const props = defineProps<{
    component: ParticleModule;
}>();

const accordionRef = ref<InstanceType<typeof Accordion> | null>(null);
const componentViewRef = ref<HTMLElement | null>(null);

// 组件名称
const componentName = computed(() => {
    return classUtils.getQualifiedClassName(props.component).split('.').pop() || '';
});

// 对象视图
let componentView: any = null;

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
    });
    
    if (componentView?.dom) {
        componentViewRef.value.appendChild(componentView.dom);
    }
}

// 刷新视图
function refreshView() {
    if (componentView?.updateView) {
        componentView.updateView();
    }
}

onMounted(() => {
    createComponentView();
});

onUnmounted(() => {
    if (componentView?.destroy) {
        componentView.destroy();
    }
    componentView = null;
});

// 暴露方法
defineExpose({
    updateView: refreshView,
    component: props.component,
});
</script>

<style scoped>
.particle-component-view {
    width: 100%;
    margin-bottom: 4px;
}

.particle-component-view-content {
    padding: 4px 0;
}
</style>
