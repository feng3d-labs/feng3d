<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    owner?: any;
    objectViewInfo?: any;
}>();

type DisplayValue = { type: 'image'; src: string } | { type: 'text'; text: string } | '';

const displayValue = computed<DisplayValue>(() => {
    const value = props.owner;
    if (!value) return '';
    
    if (typeof value === 'string' && value.indexOf('data:') === 0) {
        return { type: 'image', src: value };
    }
    
    let string = String(value);
    if (string.length > 1000) {
        string = `${string.substr(0, 1000)}\n.......`;
    }
    return { type: 'text', text: string };
});
</script>

<template>
    <div class="ov-base-default">
        <img v-if="displayValue !== '' && displayValue.type === 'image'" :src="displayValue.src" class="ov-image" />
        <div v-else-if="displayValue !== '' && displayValue.type === 'text'" class="ov-text">{{ displayValue.text }}</div>
    </div>
</template>

<style scoped>
.ov-base-default {
    padding: 8px;
    width: 100%;
}

.ov-image {
    max-width: 100%;
    max-height: 200px;
    display: block;
}

.ov-text {
    font-size: 12px;
    color: var(--sideBar-foreground, #cccccc);
    white-space: pre-wrap;
    word-break: break-word;
}
</style>
