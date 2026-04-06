<template>
    <div class="rename-text-input">
        <span
            v-if="!isEditing"
            class="rename-text-label"
            :style="{ textAlign: textAlign }"
            @dblclick="startEdit"
        >
            {{ text }}
        </span>
        <el-input
            v-else
            ref="inputRef"
            :model-value="editText"
            size="small"
            :style="{ textAlign: textAlign }"
            @update:model-value="editText = $event"
            @blur="finishEdit"
            @keyup.enter="finishEdit"
            @keyup.esc="cancelEdit"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { windowEventProxy } from 'feng3d';

const props = withDefaults(defineProps<{
    text?: string;
    textAlign?: 'left' | 'center' | 'right';
}>(), {
    text: '',
    textAlign: 'left',
});

const emit = defineEmits<{
    change: [text: string];
}>();

const isEditing = ref(false);
const editText = ref('');
const inputRef = ref<InstanceType<typeof import('element-plus').ElInput> | null>(null);

// 开始编辑
function startEdit() {
    isEditing.value = true;
    editText.value = props.text;
    
    nextTick(() => {
        inputRef.value?.focus();
        inputRef.value?.select();
    });
}

// 完成编辑
function finishEdit() {
    if (isEditing.value) {
        const newText = editText.value.trim();
        if (newText !== props.text) {
            emit('change', newText);
        }
        isEditing.value = false;
    }
}

// 取消编辑
function cancelEdit() {
    if (isEditing.value) {
        editText.value = props.text;
        isEditing.value = false;
    }
}

// 监听文本变化
watch(() => props.text, (newText) => {
    if (!isEditing.value) {
        editText.value = newText;
    }
}, { immediate: true });

// 暴露方法供外部调用
defineExpose({
    edit: startEdit,
    cancelEdit,
});
</script>

<style scoped>
.rename-text-input {
    display: inline-block;
    width: 100%;
    min-width: 0;
}

.rename-text-label {
    display: inline-block;
    width: 100%;
    padding: 4px 8px;
    font-size: 12px;
    color: var(--editor-foreground, #cccccc);
    cursor: text;
    user-select: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.rename-text-label:hover {
    background-color: var(--sideBar-background, #3d3d3d);
    border-radius: 2px;
}
</style>
