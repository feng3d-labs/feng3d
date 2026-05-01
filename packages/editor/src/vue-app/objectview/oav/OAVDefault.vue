<script setup lang="ts">
import { useOAVDefault, type OAVDefaultProps } from './useOAVDefault';

const props = defineProps<OAVDefaultProps>();
const { label, value, onChange, onDoubleClick } = useOAVDefault(props);
</script>

<template>
    <div class="oav-row" @dblclick="onDoubleClick">
        <label class="oav-label" :title="props.name">{{ label }}</label>
        <div class="oav-value">
            <input
                type="text"
                class="oav-input"
                :value="value"
                :disabled="!props.editable"
                @change="onChange"
                @blur="onChange"
            >
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
    color: var(--editor-foreground, #cccccc);
    user-select: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.oav-value {
    flex: 1;
    min-width: 0;
}

.oav-input {
    width: 100%;
    padding: 2px 4px;
    font-size: 12px;
    background-color: var(--sideBar-background, #2d2d2d);
    border: 1px solid var(--sideBar-border, #3d3d3d);
    border-radius: 2px;
    color: var(--editor-foreground, #cccccc);
}

.oav-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.oav-input:focus {
    outline: none;
    border-color: var(--button-background, #007acc);
}
</style>
