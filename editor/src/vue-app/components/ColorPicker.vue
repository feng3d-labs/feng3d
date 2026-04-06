<template>
    <div class="color-picker" @click="onClick">
        <div class="color-preview" :style="{ backgroundColor: colorHex }" />
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Color3, Color4 } from 'feng3d';
import { popupView } from './PopupView';
import ColorPickerView from './ColorPickerView.vue';
import { createApp, type App } from 'vue';

const props = withDefaults(defineProps<{
    modelValue: Color3 | Color4;
}>(), {
    modelValue: () => new Color3(),
});

const emit = defineEmits<{
    'update:modelValue': [value: Color3 | Color4];
    'change': [value: Color3 | Color4];
}>();

// 颜色预览的十六进制值
const colorHex = computed(() => {
    const color = props.modelValue;
    if (!color) return '#000000';
    
    if (color instanceof Color3) {
        return `#${color.toInt().toString(16).padStart(6, '0')}`;
    } else {
        return `#${color.toColor3().toInt().toString(16).padStart(6, '0')}`;
    }
});

// 颜色选择器视图实例（单例）
let colorPickerViewApp: App | null = null;
let colorPickerContainer: HTMLElement | null = null;

// 点击打开颜色选择器
function onClick(event: MouseEvent) {
    // 创建或获取颜色选择器视图
    if (!colorPickerViewApp || !colorPickerContainer) {
        // 创建容器
        colorPickerContainer = document.createElement('div');
        colorPickerContainer.style.width = '318px';
        colorPickerContainer.style.height = 'auto';
        
        // 创建响应式颜色对象
        const currentColor = props.modelValue instanceof Color4 
            ? new Color4(props.modelValue.r, props.modelValue.g, props.modelValue.b, props.modelValue.a)
            : new Color3(props.modelValue.r, props.modelValue.g, props.modelValue.b);
        
        // 创建 Vue 应用实例
        colorPickerViewApp = createApp(ColorPickerView, {
            color: currentColor,
            editable: true,
            onChange: (newColor: Color3 | Color4) => {
                emit('update:modelValue', newColor);
                emit('change', newColor);
            },
        });
        
        colorPickerViewApp.mount(colorPickerContainer);
    } else {
        // 更新颜色（重新创建应用以更新颜色）
        if (colorPickerViewApp) {
            colorPickerViewApp.unmount();
        }
        
        const currentColor = props.modelValue instanceof Color4 
            ? new Color4(props.modelValue.r, props.modelValue.g, props.modelValue.b, props.modelValue.a)
            : new Color3(props.modelValue.r, props.modelValue.g, props.modelValue.b);
        
        colorPickerViewApp = createApp(ColorPickerView, {
            color: currentColor,
            editable: true,
            onChange: (newColor: Color3 | Color4) => {
                emit('update:modelValue', newColor);
                emit('change', newColor);
            },
        });
        
        if (colorPickerContainer) {
            colorPickerViewApp.mount(colorPickerContainer);
        }
    }
    
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
            closecallback: () => {
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
