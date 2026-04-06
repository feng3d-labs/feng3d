<script setup lang="ts">
import { useOAVVector2, type OAVVector2Props } from './useOAVVector2';

const props = defineProps<OAVVector2Props>();
const { label, x, y, onChangeX, onChangeY, step, minValue, maxValue, precision } = useOAVVector2(props);
</script>

<template>
    <div class="oav-row">
        <label class="oav-label" :title="props.name">{{ label }}</label>
        <div class="oav-value oav-vector2">
            <div class="vector-component">
                <span class="axis-label x">X</span>
                <el-input-number
                    :model-value="x"
                    :disabled="!props.editable"
                    :step="step"
                    :min="minValue"
                    :max="maxValue"
                    :precision="precision"
                    size="small"
                    @update:model-value="onChangeX"
                />
            </div>
            <div class="vector-component">
                <span class="axis-label y">Y</span>
                <el-input-number
                    :model-value="y"
                    :disabled="!props.editable"
                    :step="step"
                    :min="minValue"
                    :max="maxValue"
                    :precision="precision"
                    size="small"
                    @update:model-value="onChangeY"
                />
            </div>
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

.oav-vector2 {
    display: flex;
    gap: 8px;
}

.vector-component {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 1;
}

.axis-label {
    font-size: 11px;
    font-weight: 500;
    min-width: 16px;
    text-align: center;
    color: var(--descriptionForeground, #999999);
}

.axis-label.x {
    color: #ff4444;
}

.axis-label.y {
    color: #44ff44;
}
</style>
