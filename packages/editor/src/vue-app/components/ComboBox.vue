<template>
    <el-select
        :model-value="selectedValue"
        :disabled="disabled"
        :placeholder="placeholder"
        size="small"
        style="width: 100%"
        @update:model-value="onChange"
    >
        <el-option
            v-for="item in dataProvider"
            :key="getItemKey(item)"
            :label="item.label"
            :value="item.value"
        />
    </el-select>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface ComboBoxItem {
    label: string;
    value: any;
}

const props = withDefaults(defineProps<{
    dataProvider?: ComboBoxItem[];
    data?: ComboBoxItem;
    disabled?: boolean;
    placeholder?: string;
}>(), {
    dataProvider: () => [],
    disabled: false,
    placeholder: '请选择',
});

const emit = defineEmits<{
    change: [item: ComboBoxItem | null];
}>();

// 选中的值
const selectedValue = computed(() => {
    return props.data?.value;
});

// 获取项的 key
function getItemKey(item: ComboBoxItem) {
    return item.value !== undefined && item.value !== null
        ? String(item.value)
        : item.label;
}

// 值变化处理
function onChange(value: any) {
    const item = props.dataProvider.find(i => i.value === value) || null;
    emit('change', item);
}
</script>

<style scoped>
/* 使用 Element Plus 默认样式 */
</style>
