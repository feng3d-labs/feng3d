<script setup lang="ts">
import { useOAVString, type OAVStringProps } from './useOAVString';

const props = defineProps<OAVStringProps>();
const { label, value, onChange } = useOAVString(props);
</script>

<template>
    <div class="oav-row">
        <label class="oav-label" :title="props.name">{{ label }}</label>
        <div class="oav-value">
            <el-input
                :model-value="value"
                :disabled="!props.editable"
                size="small"
                @update:model-value="onChange"
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
