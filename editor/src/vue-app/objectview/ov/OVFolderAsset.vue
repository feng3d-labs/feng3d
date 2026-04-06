<script setup lang="ts">
import { computed } from 'vue';
import { editorAsset } from '../../../ui/assets/EditorAsset';

const props = defineProps<{
    owner?: any;
    objectViewInfo?: any;
}>();

const folderName = computed(() => {
    return props.owner?.fileName || '';
});

function onOpenClick() {
    if (props.owner?.assetId) {
        const assetNode = editorAsset.getAssetByID(props.owner.assetId);
        if (assetNode) {
            editorAsset.showFloder = assetNode;
        }
    }
}
</script>

<template>
    <div class="ov-folder-asset">
        <div class="ov-folder-header">
            <span class="ov-folder-name">{{ folderName }}</span>
            <el-button size="small" text @click="onOpenClick">
                打开
            </el-button>
        </div>
    </div>
</template>

<style scoped>
.ov-folder-asset {
    padding: 8px;
}

.ov-folder-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.ov-folder-name {
    font-size: 12px;
    color: var(--sideBar-foreground, #cccccc);
}
</style>
