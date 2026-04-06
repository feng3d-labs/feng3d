<script setup lang="ts">
import { computed, reactive } from 'vue';

const props = defineProps<{
    name: string;
    owner: Record<string, unknown>;
    editable: boolean;
    attributeViewInfo?: any;
}>();

// 在组件内部创建响应式对象
const r_owner = reactive(props.owner);

// 格式化标签名
const label = computed(() => {
    const name = props.attributeViewInfo?.label || props.name;
    return name
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
});

// 点击处理
function onClick() {
    const func = r_owner[props.name];
    if (typeof func === 'function') {
        func.call(r_owner);
    }
}
</script>

<template>
    <div class="oav-row oav-function">
        <label class="oav-label" :title="props.name">{{ label }}</label>
        <div class="oav-value">
            <el-button
                size="small"
                :disabled="!props.editable"
                @click="onClick"
            >
                执行
            </el-button>
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
    color: var(--editor-foreground, #cccccc);
    user-select: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.oav-value {
    flex: 1;
    min-width: 0;
}
</style>
