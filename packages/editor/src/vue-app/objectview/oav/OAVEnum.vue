<script setup lang="ts">
import { useOAVEnum, type OAVEnumProps } from './useOAVEnum';

const props = defineProps<OAVEnumProps>();
const { label, value, onChange, options } = useOAVEnum(props);
</script>

<template>
    <div class="oav-row">
        <label class="oav-label" :title="props.name">{{ label }}</label>
        <div class="oav-value">
            <el-select
                :model-value="value"
                :disabled="!props.editable"
                size="small"
                style="width: 100%"
                @update:model-value="onChange"
            >
                <el-option
                    v-for="opt in options"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                />
            </el-select>
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
