<script setup lang="ts">
import { useOBVDefault, type OBVDefaultProps } from './useOBVDefault';
import ObjectAttributeView from '../ObjectAttributeView.vue';

const props = defineProps<OBVDefaultProps>();
const { r_collapsed, showHeader, collapseIcon, blockIcon, onHeaderClick } = useOBVDefault(props);
</script>

<template>
    <!-- 块头部 -->
    <div v-if="showHeader" class="block-header" @click="onHeaderClick">
        <span class="collapse-icon material-symbols-outlined">{{ collapseIcon }}</span>
        <span class="block-icon material-symbols-outlined">{{ blockIcon }}</span>
        <span class="block-name">{{ props.name }}</span>
        <button class="block-menu" title="组件菜单">
            <span class="material-symbols-outlined">more_vert</span>
        </button>
    </div>

    <!-- 内容区域 -->
    <div class="block-content" :style="{ display: r_collapsed ? 'none' : '' }">
        <ObjectAttributeView
            v-for="(attrInfo, index) in props.itemList"
            :key="index"
            :attrInfo="attrInfo"
        />
    </div>
</template>
