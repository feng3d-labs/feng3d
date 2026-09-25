<script setup lang="ts">
import { useOBVDefault, type OBVDefaultProps } from './useOBVDefault';
import ObjectAttributeView from '../ObjectAttributeView.vue';
import Icon from '../../components/Icon.vue';

const props = defineProps<OBVDefaultProps>();
const { isExpanded, toggleExpanded, showTitle } = useOBVDefault(props);
</script>

<template>
    <div class="obv-default">
        <div v-if="showTitle" class="obv-header" @click="toggleExpanded">
            <Icon
                icon="mdi:chevron-right"
                :size="16"
                :class="`obv-icon ${isExpanded ? 'obv-icon-expanded' : ''}`"
            />
            <span class="obv-title">{{ props.name }}</span>
        </div>
        <div v-show="isExpanded || !showTitle" class="obv-content">
            <ObjectAttributeView
                v-for="(attrInfo, index) in props.itemList"
                :key="index"
                :attrInfo="attrInfo"
            />
        </div>
    </div>
</template>

<style scoped>
.obv-default {
    border: 1px solid var(--sideBar-border, #3d3d3d);
    border-radius: 2px;
    margin-bottom: 4px;
    background-color: var(--sideBar-background, #252526);
}

.obv-header {
    display: flex;
    align-items: center;
    padding: 6px 8px;
    cursor: pointer;
    user-select: none;
    background-color: var(--list-inactiveSelectionBackground, #2d2d2d);
}

.obv-header:hover {
    background-color: var(--list-hoverBackground, #2a2d2e);
}

.obv-icon {
    margin-right: 4px;
    transition: transform 0.2s;
    font-size: 12px;
    color: var(--sideBar-foreground, #cccccc);
}

.obv-icon-expanded {
    transform: rotate(90deg);
}

.obv-title {
    font-size: 12px;
    font-weight: 500;
    color: var(--sideBar-foreground, #cccccc);
}

.obv-content {
    padding: 4px 0;
}
</style>
