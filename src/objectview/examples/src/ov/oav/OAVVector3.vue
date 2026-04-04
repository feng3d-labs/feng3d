<script setup lang="ts">
import { useOAVVector3, type OAVVector3Props } from './useOAVVector3';

const props = defineProps<OAVVector3Props>();
const { label, x, y, z, onChangeX, onChangeY, onChangeZ } = useOAVVector3(props);
</script>

<template>
    <div class="oav-row">
        <label class="oav-label" :title="props.name">{{ label }}</label>
        <div class="oav-value oav-vector3">
            <div class="vector3-component">
                <span class="axis-label x">X</span>
                <input
                    type="number"
                    class="oav-input"
                    step="0.1"
                    :value="x"
                    :disabled="!props.editable"
                    @change="onChangeX"
                >
            </div>
            <div class="vector3-component">
                <span class="axis-label y">Y</span>
                <input
                    type="number"
                    class="oav-input"
                    step="0.1"
                    :value="y"
                    :disabled="!props.editable"
                    @change="onChangeY"
                >
            </div>
            <div class="vector3-component">
                <span class="axis-label z">Z</span>
                <input
                    type="number"
                    class="oav-input"
                    step="0.1"
                    :value="z"
                    :disabled="!props.editable"
                    @change="onChangeZ"
                >
            </div>
        </div>
    </div>
</template>

