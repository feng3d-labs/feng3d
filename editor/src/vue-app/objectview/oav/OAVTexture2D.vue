<script setup lang="ts">
import { useOAVTexture2D, type OAVTexture2DProps } from './useOAVTexture2D';
import { useEditorStore } from '../../stores/editorStore';

const props = defineProps<OAVTexture2DProps>();
const { label, imageSrc, onPickClick, onDoubleClick } = useOAVTexture2D(props);
const editorStore = useEditorStore();
</script>

<template>
    <div class="oav-row oav-texture2d" @dblclick="onDoubleClick">
        <label class="oav-label" :title="props.name">{{ label }}</label>
        <div class="oav-value">
            <div class="oav-texture2d-content">
                <img v-if="imageSrc" :src="imageSrc" class="oav-texture2d-img" />
                <div v-else class="oav-texture2d-placeholder">无纹理</div>
                <el-button
                    v-if="props.editable"
                    size="small"
                    text
                    @click.stop="onPickClick"
                >
                    选择
                </el-button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.oav-row {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    min-height: 24px;
}

.oav-label {
    flex: 0 0 120px;
    font-size: 12px;
    color: var(--sideBar-foreground, #cccccc);
    user-select: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.oav-value {
    flex: 1;
    min-width: 0;
}

.oav-texture2d-content {
    display: flex;
    align-items: center;
    gap: 8px;
}

.oav-texture2d-img {
    width: 64px;
    height: 64px;
    object-fit: contain;
    border: 1px solid var(--sideBar-border, #3d3d3d);
    border-radius: 2px;
    background-color: var(--sideBar-background, #252526);
}

.oav-texture2d-placeholder {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    color: var(--descriptionForeground, #666666);
    border: 1px dashed var(--sideBar-border, #3d3d3d);
    border-radius: 2px;
}
</style>
