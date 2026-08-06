<script setup lang="ts">
import { useObjectView, type ObjectViewProps } from './useObjectView';

const props = defineProps<ObjectViewProps>();
const { containerRef } = useObjectView(props);
</script>

<template>
    <div ref="containerRef" class="object-view"></div>
</template>

