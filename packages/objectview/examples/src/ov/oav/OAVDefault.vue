<script setup lang="ts">
import { useOAVDefault, type OAVDefaultProps } from './useOAVDefault';

const props = defineProps<OAVDefaultProps>();
const { label, value, onChange } = useOAVDefault(props);
</script>

<template>
    <div class="oav-row">
        <label class="oav-label" :title="props.name">{{ label }}</label>
        <div class="oav-value">
            <input
                type="text"
                class="oav-input"
                :value="value"
                :disabled="!props.editable"
                @change="onChange"
            >
        </div>
    </div>
</template>

