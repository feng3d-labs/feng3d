<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { Color3, Color4 } from 'feng3d';
import { ObjectViewEvent } from '../../../objectview/events/ObjectViewEvent';

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

// 获取颜色值
const colorValue = computed(() => {
    const color = r_owner[props.name] as Color3 | Color4;
    if (!color) return '#000000';
    
    // 转换为 hex 字符串（Element Plus 格式）
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    const a = color instanceof Color4 ? Math.round(color.a * 255) : 255;
    
    if (color instanceof Color4 && a < 255) {
        return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(2)})`;
    }
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
});

// 判断是否为 Color4
const isColor4 = computed(() => {
    const color = r_owner[props.name];
    return color instanceof Color4;
});

// 十六进制值
const hexValue = computed(() => {
    const color = r_owner[props.name] as Color3 | Color4;
    if (!color) return '000000';
    return color.toHexString().substr(1);
});

// 颜色变化处理
function onColorChange(newValue: string | null) {
    if (!newValue) return;
    
    // 解析颜色值
    let r = 0, g = 0, b = 0, a = 1;
    
    if (newValue.startsWith('#')) {
        // #RRGGBB 或 #RRGGBBAA
        const hex = newValue.substr(1);
        r = parseInt(hex.substr(0, 2), 16) / 255;
        g = parseInt(hex.substr(2, 2), 16) / 255;
        b = parseInt(hex.substr(4, 2), 16) / 255;
        if (hex.length >= 8) {
            a = parseInt(hex.substr(6, 2), 16) / 255;
        }
    } else if (newValue.startsWith('rgba')) {
        // rgba(r, g, b, a)
        const match = newValue.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (match) {
            r = parseInt(match[1]) / 255;
            g = parseInt(match[2]) / 255;
            b = parseInt(match[3]) / 255;
            a = match[4] ? parseFloat(match[4]) : 1;
        }
    }
    
    // 创建颜色对象
    const currentColor = r_owner[props.name];
    if (currentColor instanceof Color4) {
        r_owner[props.name] = new Color4(r, g, b, a);
    } else {
        r_owner[props.name] = new Color3(r, g, b);
    }
    
    // 触发值变化事件
    if (props.attributeViewInfo) {
        const event = new ObjectViewEvent();
        event.type = ObjectViewEvent.VALUE_CHANGE;
        (event as any).space = r_owner;
        (event as any).attributeName = props.name;
        (event as any).attributeValue = r_owner[props.name];
    }
}

// 十六进制输入变化处理
const textFocusIn = ref(false);
function onHexChange(newValue: string | null) {
    if (!newValue || !textFocusIn.value) return;
    
    const hex = newValue.replace('#', '');
    if (hex.length < 6) return;
    
    try {
        const num = parseInt(hex, 16);
        const currentColor = r_owner[props.name];
        
        if (currentColor instanceof Color4) {
            const color = new Color4().fromUnit(num);
            r_owner[props.name] = color;
        } else {
            const color = new Color3().fromUnit(num);
            r_owner[props.name] = color;
        }
        
        // 触发值变化事件
        if (props.attributeViewInfo) {
            const event = new ObjectViewEvent();
        event.type = ObjectViewEvent.VALUE_CHANGE;
            (event as any).space = r_owner;
            (event as any).attributeName = props.name;
            (event as any).attributeValue = r_owner[props.name];
        }
    } catch (e) {
        // 解析失败，忽略
    }
}
</script>

<template>
    <div class="oav-row oav-color-picker">
        <label class="oav-label" :title="props.name">{{ label }}</label>
        <div class="oav-value">
            <div class="oav-color-picker-content">
                <el-color-picker
                    :model-value="colorValue"
                    :disabled="!props.editable"
                    :show-alpha="isColor4"
                    @update:model-value="onColorChange"
                />
                <el-input
                    :model-value="hexValue"
                    :disabled="!props.editable"
                    size="small"
                    style="width: 80px; margin-left: 8px"
                    @update:model-value="onHexChange"
                    @focus="textFocusIn = true"
                    @blur="textFocusIn = false; onHexChange(hexValue)"
                >
                    <template #prefix>#</template>
                </el-input>
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

.oav-color-picker-content {
    display: flex;
    align-items: center;
}
</style>
