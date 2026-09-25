<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import type { Color3, Color4 } from 'feng3d';
import { colorToHexString } from '../../../utils/colorUtils';
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
    // 纯数据接口的 r/g/b/a 均可选（缺失时按默认值补齐）：r/g/b 缺省 0，a 缺省 1
    const r = Math.round((color.r ?? 0) * 255);
    const g = Math.round((color.g ?? 0) * 255);
    const b = Math.round((color.b ?? 0) * 255);
    // `Color3` / `Color4` 已是纯数据接口（`__type__` 字面量判别，不可用 instanceof）
    const a = color.__type__ === 'Color4' ? Math.round((color.a ?? 1) * 255) : 255;
    
    if (color.__type__ === 'Color4' && a < 255) {
        return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(2)})`;
    }
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
});

// 判断是否为 Color4
const isColor4 = computed(() => {
    const color = r_owner[props.name] as Color3 | Color4 | undefined;
    return color?.__type__ === 'Color4';
});

// 十六进制值
// 复用 colorUtils.colorToHexString：Color3 → RRGGBB；Color4 → AARRGGBB（与已删除的 `toHexString()` 一致）
const hexValue = computed(() => {
    const color = r_owner[props.name] as Color3 | Color4;
    if (!color) return '000000';

    return colorToHexString(color).substring(1);
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
    
    // 创建颜色对象（纯数据字面量：`Color3` / `Color4` 已是接口，不可 `new`）
    const currentColor = r_owner[props.name] as Color3 | Color4 | undefined;
    if (currentColor?.__type__ === 'Color4') {
        const color: Color4 = { __type__: 'Color4', r, g, b, a };
        r_owner[props.name] = color;
    } else {
        const color: Color3 = { __type__: 'Color3', r, g, b };
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
}

// 十六进制输入变化处理
const textFocusIn = ref(false);
function onHexChange(newValue: string | null) {
    if (!newValue || !textFocusIn.value) return;
    
    const hex = newValue.replace('#', '');
    if (hex.length < 6) return;
    
    try {
        const num = parseInt(hex, 16);
        const currentColor = r_owner[props.name] as Color3 | Color4 | undefined;
        
        // 旧 `new Color4().fromUnit(num)` / `new Color3().fromUnit(num)` 的等价解析
        // （Color4.fromUnit 取 AARRGGBB，Color3.fromUnit 取 RRGGBB，均按 0xff 归一化）
        if (currentColor?.__type__ === 'Color4') {
            const color: Color4 = {
                __type__: 'Color4',
                a: ((num >> 24) & 0xff) / 0xff,
                r: ((num >> 16) & 0xff) / 0xff,
                g: ((num >> 8) & 0xff) / 0xff,
                b: (num & 0xff) / 0xff,
            };
            r_owner[props.name] = color;
        } else {
            const color: Color3 = {
                __type__: 'Color3',
                r: ((num >> 16) & 0xff) / 0xff,
                g: ((num >> 8) & 0xff) / 0xff,
                b: (num & 0xff) / 0xff,
            };
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
