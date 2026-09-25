<template>
    <div class="oav-particle-component-list">
        <div class="oav-row">
            <label class="oav-label" :title="props.name">{{ label }}</label>
        </div>
        <div class="oav-particle-component-list-content">
            <ParticleComponentView
                v-for="(component, index) in components"
                :key="getComponentKey(component, index)"
                :component="component"
                ref="componentViewRefs"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue';
import { ParticleModule, ParticleSystem } from 'feng3d';
import ParticleComponentView from '../../components/ParticleComponentView.vue';

const props = defineProps<{
    name: string;
    owner: Record<string, unknown>;
    editable: boolean;
    attributeViewInfo?: any;
}>();

// 在组件内部创建响应式对象
const r_owner = reactive(props.owner);

// 获取 ParticleSystem
const particleSystem = computed(() => r_owner as unknown as ParticleSystem);

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
    return (value as ParticleModule[]) || [];
});

// 组件视图引用
const componentViewRefs = ref<InstanceType<typeof ParticleComponentView>[]>([]);

// 获取组件唯一键
function getComponentKey(component: ParticleModule, index: number) {
    return `particle-module-${index}`;
}

// 更新所有组件视图
function updateAllComponentViews() {
    componentViewRefs.value.forEach(view => {
        if (view && typeof view.updateView === 'function') {
            view.updateView();
        }
    });
}

onMounted(() => {
    // 粒子组件列表通常不需要监听添加/移除事件
    // 因为粒子模块是固定的
});
</script>

<style scoped>
.oav-particle-component-list {
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
    color: var(--sideBar-foreground, #cccccc);
    user-select: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.oav-particle-component-list-content {
    padding: 4px 0;
}
</style>
