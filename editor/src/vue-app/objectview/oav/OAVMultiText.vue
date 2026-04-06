<script setup lang="ts">
import { useOAVMultiText, type OAVMultiTextProps } from './useOAVMultiText';

const props = defineProps<OAVMultiTextProps>();
const { label, value } = useOAVMultiText(props);
</script>

<template>
    <div class="oav-row oav-multitext">
        <label class="oav-label" :title="props.name">{{ label }}</label>
        <div class="oav-value">
            <div class="oav-multitext-content">{{ value }}</div>
        </div>
    </div>
</template>

<style scoped>
.oav-row {
    display: flex;
    align-items: flex-start;
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
    padding-top: 4px;
}

.oav-value {
    flex: 1;
    min-width: 0;
}

.oav-multitext-content {
    font-size: 12px;
    color: var(--sideBar-foreground, #cccccc);
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.5;
}
</style>
