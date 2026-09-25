<template>
    <div class="accordion" :class="{ 'accordion-collapsed': collapsed }">
        <div class="accordion-header" @click="toggle">
            <el-icon class="accordion-icon" :class="{ 'accordion-icon-rotated': !collapsed }">
                <ArrowRight />
            </el-icon>
            <span class="accordion-title">{{ titleName }}</span>
        </div>
        <div v-show="!collapsed" class="accordion-content">
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ArrowRight } from '@element-plus/icons-vue';

const props = withDefaults(defineProps<{
    titleName?: string;
    defaultCollapsed?: boolean;
}>(), {
    titleName: '',
    defaultCollapsed: false,
});

const collapsed = ref(props.defaultCollapsed);

// 切换折叠状态
function toggle() {
    collapsed.value = !collapsed.value;
}

// 暴露方法
defineExpose({
    toggle,
    collapsed: () => collapsed.value,
    expand: () => { collapsed.value = false; },
    collapse: () => { collapsed.value = true; },
});
</script>

<style scoped>
.accordion {
    border: 1px solid var(--sideBar-border, #3d3d3d);
    border-radius: 2px;
    margin-bottom: 4px;
    background-color: var(--sideBar-background, #2d2d2d);
    overflow: hidden;
}

.accordion-header {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    background-color: var(--input-background, #1d1d1d);
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s;
}

.accordion-header:hover {
    background-color: var(--sideBar-background, #3d3d3d);
}

.accordion-icon {
    margin-right: 8px;
    transition: transform 0.2s;
    font-size: 12px;
    color: var(--sideBarSectionHeader-foreground, #999);
}

.accordion-icon-rotated {
    transform: rotate(90deg);
}

.accordion-title {
    font-size: 12px;
    font-weight: 500;
    color: var(--editor-foreground, #cccccc);
    flex: 1;
}

.accordion-content {
    padding: 4px 0;
    background-color: var(--sideBar-background, #2d2d2d);
}
</style>
