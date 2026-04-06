<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    name: string;
    owner: Record<string, unknown>;
    editable: boolean;
    attributeViewInfo?: any;
}>();

const imageSrc = computed(() => {
    const texture = props.owner as any;
    return texture?.dataURL || '';
});
</script>

<template>
    <div class="oav-image">
        <img v-if="imageSrc" :src="imageSrc" class="oav-image-img" />
        <div v-else class="oav-image-placeholder">无图片</div>
    </div>
</template>

<style scoped>
.oav-image {
    padding: 4px 8px;
    width: 100%;
}

.oav-image-img {
    max-width: 100%;
    max-height: 200px;
    display: block;
    border: 1px solid var(--sideBar-border, #3d3d3d);
    border-radius: 2px;
}

.oav-image-placeholder {
    padding: 20px;
    text-align: center;
    color: var(--sideBarSectionHeader-foreground, #666666);
    font-size: 12px;
    border: 1px dashed var(--sideBar-border, #3d3d3d);
    border-radius: 2px;
}
</style>
