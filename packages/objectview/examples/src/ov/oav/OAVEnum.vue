<script setup lang="ts">
import { useOAVEnum, type OAVEnumProps } from './useOAVEnum';

const props = defineProps<OAVEnumProps>();
const { label, value, onChange } = useOAVEnum(props);
</script>

<template>
    <div class="oav-row">
        <label class="oav-label" :title="props.name">{{ label }}</label>
        <div class="oav-value">
            <select
                class="oav-select"
                :value="value"
                :disabled="!props.editable"
                @change="onChange"
            >
                <option v-for="opt in props.options" :key="opt" :value="opt">
                    {{ opt }}
                </option>
            </select>
        </div>
    </div>
</template>

