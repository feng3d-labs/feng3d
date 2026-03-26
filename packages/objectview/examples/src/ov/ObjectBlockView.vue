<script setup lang="ts">
import { useObjectBlockView, type ObjectBlockViewProps } from './useObjectBlockView';

const props = defineProps<ObjectBlockViewProps>();
const { containerRef } = useObjectBlockView(props);
</script>

<template>
    <div ref="containerRef" class="object-block-view"></div>
</template>

