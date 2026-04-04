<script setup lang="ts">
import { useOAVNumber, type OAVNumberProps } from './useOAVNumber';

const props = defineProps<OAVNumberProps>();
const { label, value, onChange } = useOAVNumber(props);
</script>

<template>
    <div class="oav-row">
        <label class="oav-label" :title="props.name">{{ label }}</label>
        <div class="oav-value">
            <input
                type="number"
                class="oav-input"
                step="0.1"
                :value="value"
                :disabled="!props.editable"
                @change="onChange"
            >
        </div>
    </div>
</template>

