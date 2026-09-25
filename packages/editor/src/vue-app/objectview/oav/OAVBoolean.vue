<script setup lang="ts">
import { useOAVBoolean, type OAVBooleanProps } from './useOAVBoolean';

const props = defineProps<OAVBooleanProps>();
const { label, checked, onChange } = useOAVBoolean(props);
</script>

<template>
    <div class="oav-row">
        <label class="oav-label" :title="props.name">{{ label }}</label>
        <div class="oav-value">
            <el-switch
                :model-value="checked"
                :disabled="!props.editable"
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
</style>
