<script setup lang="ts">
import { useOAVComponents, type OAVComponentsProps } from './useOAVComponents';
import ObjectView from '../ObjectView.vue';

const props = defineProps<OAVComponentsProps>();
const { r_componentItems, toggleCollapse } = useOAVComponents(props);
</script>

<template>
    <div class="oav-components">
        <div v-for="(item, index) in r_componentItems" :key="index" class="obv-default">
            <!-- 块头部 -->
            <div class="block-header" @click="toggleCollapse(index)">
                <span class="collapse-icon material-symbols-outlined">
                    {{ item.collapsed ? 'chevron_right' : 'expand_more' }}
                </span>
                <span class="block-icon material-symbols-outlined">{{ item.icon }}</span>
                <span class="block-name">{{ item.name }}</span>
                <button class="block-menu" title="组件菜单" @click.stop>
                    <span class="material-symbols-outlined">more_vert</span>
                </button>
            </div>

            <!-- 内容区域 -->
            <div class="block-content" :style="{ display: item.collapsed ? 'none' : '' }">
                <ObjectView :object="item.component" />
            </div>
        </div>

        <!-- 添加组件按钮 -->
        <button class="add-component-btn">
            <span class="material-symbols-outlined">add</span>
            添加组件
        </button>
    </div>
</template>
