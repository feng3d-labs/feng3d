<script setup lang="ts">
import { useObjectAttributeView, type ObjectAttributeViewProps } from './useObjectAttributeView';

const props = defineProps<ObjectAttributeViewProps>();
const { containerRef } = useObjectAttributeView(props);
</script>

<template>
    <div ref="containerRef" class="object-attribute-view"></div>
</template>

