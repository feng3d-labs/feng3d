<template>
    <div class="color-picker" @click="onClick">
        <div class="color-preview" :style="{ backgroundColor: colorHex }" />
    </div>
</template>

<script setup lang="ts">
import { computed, createApp, type App } from 'vue';
import type { Color3, Color4 } from 'feng3d';
import { cloneColor, colorToHex } from '../../utils/colorUtils';
import { popupView } from './PopupView';
import ColorPickerView from './ColorPickerView.vue';

const props = withDefaults(defineProps<{
    modelValue: Color3 | Color4;
}>(), {
    // Color3 是纯数据 interface，不能用 `new Color3()`（运行时不是构造函数），默认值用字面量
    modelValue: (): Color3 => ({ __type__: 'Color3', r: 1, g: 1, b: 1 }),
});

const emit = defineEmits<{
    'update:modelValue': [value: Color3 | Color4];
    'change': [value: Color3 | Color4];
}>();

// 颜色预览的十六进制值（旧实现的两条分支 `toInt()` / `toColor3().toInt()` 统一为 colorToHex）
const colorHex = computed(() =>
{
    const color = props.modelValue;
    if (!color) return '#000000';

    return colorToHex(color);
});

// 颜色选择器视图实例（单例）
let colorPickerViewApp: App | null = null;
let colorPickerContainer: HTMLElement | null = null;

/**
 * 创建（或重建）颜色选择器视图。
 *
 * 视图内部会原地修改传入的颜色对象，因此传**副本**（`cloneColor`），
 * 只在 onChange 时经事件把新颜色交回父级，避免直接改动父级数据。
 */
function mountColorPickerView(container: HTMLElement)
{
    if (colorPickerViewApp) {
        colorPickerViewApp.unmount();
    }

    colorPickerViewApp = createApp(ColorPickerView, {
        color: cloneColor(props.modelValue),
        editable: true,
        onChange: (newColor: Color3 | Color4) =>
        {
            emit('update:modelValue', newColor);
            emit('change', newColor);
        },
    });

    colorPickerViewApp.mount(container);
}

// 点击打开颜色选择器
function onClick(event: MouseEvent)
{
    // 创建容器（单例）
    if (!colorPickerContainer) {
        colorPickerContainer = document.createElement('div');
        colorPickerContainer.style.width = '318px';
        colorPickerContainer.style.height = 'auto';
    }

    // 每次打开都重建视图（颜色可能已被父级改动），替代旧实现里重复的两段 createApp
    mountColorPickerView(colorPickerContainer);

    // 计算弹出位置
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const pos = {
        x: rect.left - 318,
        y: rect.top,
    };

    // 弹出颜色选择器
    if (colorPickerContainer) {
        popupView.popupView(colorPickerContainer, {
            x: pos.x,
            y: pos.y,
            width: 318,
            closecallback: () =>
            {
                // 关闭时清理（但不销毁实例，保持单例）
            },
        });
    }
}
</script>

<style scoped>
.color-picker {
    display: inline-block;
    cursor: pointer;
    user-select: none;
}

.color-preview {
    width: 24px;
    height: 24px;
    border: 1px solid var(--sideBar-border, #3d3d3d);
    border-radius: 2px;
    background-color: #000000;
}
</style>
