<script setup lang="ts">
import { computed } from 'vue';
import { useOAVArray, type OAVArrayProps } from './useOAVArray';
import ObjectAttributeView from '../ObjectAttributeView.vue';
import Icon from '../../components/Icon.vue';

const props = defineProps<OAVArrayProps>();
const { isExpanded, toggleExpanded, arraySize, arrayItems, onSizeChange } = useOAVArray(props);

const label = computed(() => {
    const name = props.attributeViewInfo?.label || props.name;
    return name
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
});
</script>

<template>
    <div class="oav-array">
        <div class="oav-array-header" @click="toggleExpanded">
            <Icon
                icon="mdi:chevron-right"
                :size="16"
                :class="`oav-array-icon ${isExpanded ? 'oav-array-icon-expanded' : ''}`"
            />
            <label class="oav-label" :title="props.name">{{ label }}</label>
            <div class="oav-array-size">
                <el-input-number
                    :model-value="arraySize"
                    :min="0"
                    :disabled="!props.editable"
                    size="small"
                    style="width: 80px"
                    @update:model-value="onSizeChange"
                    @click.stop
                />
            </div>
        </div>
        <div v-show="isExpanded" class="oav-array-content">
            <ObjectAttributeView
                v-for="(itemInfo, index) in arrayItems"
                :key="index"
                :attrInfo="itemInfo"
            />
        </div>
    </div>
</template>

<style scoped>
.oav-array {
    border: 1px solid var(--sideBar-border, #3d3d3d);
    border-radius: 2px;
    margin-bottom: 4px;
    background-color: var(--sideBar-background, #252526);
}

.oav-array-header {
    display: flex;
    align-items: center;
    padding: 6px 8px;
    cursor: pointer;
    user-select: none;
    background-color: var(--list-inactiveSelectionBackground, #2d2d2d);
}

.oav-array-header:hover {
    background-color: var(--list-hoverBackground, #2a2d2e);
}

.oav-array-icon {
    margin-right: 4px;
    transition: transform 0.2s;
    color: var(--sideBar-foreground, #cccccc);
}

.oav-array-icon-expanded {
    transform: rotate(90deg);
}

.oav-label {
    flex: 1;
    font-size: 12px;
    color: var(--sideBar-foreground, #cccccc);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.oav-array-size {
    margin-left: 8px;
}

.oav-array-content {
    padding: 4px 0;
    padding-left: 20px;
}
</style>
