<script setup lang="ts">
import { useOAVBoolean, type OAVBooleanProps } from './useOAVBoolean';

const props = defineProps<OAVBooleanProps>();
const { label, checked, onChange } = useOAVBoolean(props);
</script>

<template>
    <div class="oav-row">
        <label class="oav-label" :title="props.name">{{ label }}</label>
        <div class="oav-value">
            <input
                type="checkbox"
                class="oav-checkbox"
                :checked="checked"
                :disabled="!props.editable"
                @change="onChange"
            >
        </div>
    </div>
</template>
