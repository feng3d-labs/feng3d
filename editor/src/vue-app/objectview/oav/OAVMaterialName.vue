<script setup lang="ts">
import { computed, reactive, onMounted, onUnmounted } from 'vue';
import { Material, shaderlib, globalEmitter } from 'feng3d';
import { ObjectViewEvent } from '../../../objectview/events/ObjectViewEvent';

const props = defineProps<{
    name: string;
    owner: Record<string, unknown>;
    editable: boolean;
    attributeViewInfo?: any;
}>();

// 在组件内部创建响应式对象
const r_owner = reactive(props.owner);

// 获取 Material
const material = computed(() => r_owner as unknown as Material);

// 格式化标签名
const label = computed(() => {
    const name = props.attributeViewInfo?.label || props.name;
    return name
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
});

// Shader 名称
const shaderName = computed(() => material.value?.shaderName || '');

// Shader 选项列表
const shaderOptions = computed(() => {
    return shaderlib.getShaderNames().sort().map((v) => ({
        label: v,
        value: v,
    }));
});

// 当前选中的 Shader
const selectedShader = computed(() => {
    return shaderOptions.value.find(opt => opt.value === shaderName.value) || null;
});

// Shader 变化处理
function onShaderChange(newValue: string) {
    if (material.value) {
        (material.value as any).shaderName = newValue;
        
        // 触发值变化事件
        if (props.attributeViewInfo) {
            const event = new ObjectViewEvent();
            event.type = ObjectViewEvent.VALUE_CHANGE;
            (event as any).space = r_owner;
            (event as any).attributeName = 'shaderName';
            (event as any).attributeValue = newValue;
        }
    }
}

// 监听 Shader 变化事件
function onShaderChanged() {
    // Shader 库变化时，可能需要更新选项
}

onMounted(() => {
    globalEmitter.on('asset.shaderChanged', onShaderChanged);
});

onUnmounted(() => {
    globalEmitter.off('asset.shaderChanged', onShaderChanged);
});
</script>

<template>
    <div class="oav-material-name">
        <div class="oav-row">
            <label class="oav-label" :title="props.name">{{ label }}</label>
            <div class="oav-value">
                <el-select
                    :model-value="selectedShader?.value"
                    :disabled="!props.editable"
                    size="small"
                    style="width: 100%"
                    @update:model-value="onShaderChange"
                >
                    <el-option
                        v-for="opt in shaderOptions"
                        :key="opt.value"
                        :label="opt.label"
                        :value="opt.value"
                    />
                </el-select>
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
