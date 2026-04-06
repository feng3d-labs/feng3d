<script setup lang="ts">
import { useOAVNumber, type OAVNumberProps } from './useOAVNumber';

const props = defineProps<OAVNumberProps & {
    step?: number;
    stepDownup?: number;
    minValue?: number;
    maxValue?: number;
}>();

const { label, value, onChange, onKeyDown, precision } = useOAVNumber(props);
</script>

<template>
    <div class="oav-row">
        <label class="oav-label" :title="props.name">{{ label }}</label>
        <div class="oav-value">
            <el-input-number
                :model-value="value"
                :disabled="!props.editable"
                :step="props.step || 0.001"
                :min="props.minValue"
                :max="props.maxValue"
                :precision="precision"
                size="small"
                @update:model-value="onChange"
                @keydown="onKeyDown"
            />
        </div>
    </div>
</template>

<style scoped>
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

.oav-value {
    flex: 1;
    min-width: 0;
}
</style>
